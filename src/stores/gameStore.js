import { useAudioStore } from './audioStore';

// src/stores/gameStore.js
import { defineStore } from 'pinia';
import * as mahjongLogic from '@/services/mahjongLogic';

// AIプレイヤーの候補リスト
const allAiPlayers = [
  { name: 'くろ　', originalId: 'kuro' },
  { name: 'たま　', originalId: 'tama' },
  { name: 'とら　', originalId: 'tora' },
  { name: '雀猫様', originalId: 'janneko' }
];

export const GAME_PHASES = {
  WAITING_TO_START: 'waitingToStart',
  PLAYER_TURN: 'playerTurn', // ツモ待ち
  AWAITING_DISCARD: 'awaitingDiscard', // 打牌待ち
  AWAITING_ACTION_RESPONSE: 'awaitingActionResponse', // 他家の打牌に対するロン・ポン・カン待ち
  AWAITING_KAKAN_RESPONSE: 'awaitingKakanResponse', // 加槓に対する槍槓ロン待ち
  RIICHI_ANIMATION: 'riichiAnimation', // リーチアニメーション中
  AWAITING_RIICHI_DISCARD: 'awaitingRiichiDiscard', // リーチ宣言後の打牌選択待ち
  ROUND_END: 'roundEnd', // 局終了 (結果表示待ち)
  GAME_OVER: 'gameOver' // ゲーム終了
  // 必要に応じて他のフェーズを追加
};

// 現在のプレイヤーをスコアでランク付けし、順位を付与する関数
function getRankedPlayers(players) {
    // スコアでプレイヤーを降順にソート
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // 順位を付与
    const rankedPlayers = [];
    let currentRank = 1;
    for (let i = 0; i < sortedPlayers.length; i++) {
        if (i > 0 && sortedPlayers[i].score < sortedPlayers[i - 1].score) {
            currentRank = i + 1;
        }
        rankedPlayers.push({
            ...sortedPlayers[i],
            rank: currentRank
        });
    }
    return rankedPlayers;
}
export const useGameStore = defineStore('game', {
  state: () => ({
    players: [
      { id: 'player1', name: 'あなた', hand: [], discards: [], melds: [], isDealer: false, score: 25000, seatWind: null },
    ],
    wall: [], // 山牌
    deadWall: [], // 王牌 (嶺上牌、ドラ表示牌など)
    dealerIndex: null, // 親プレイヤーのインデックス
    doraIndicators: [], // ドラ表示牌 (めくれているもの)
    uraDoraIndicators: [], // 裏ドラ表示牌 (リーチ和了時のみ)
    currentTurnPlayerId: null, // 現在のターンプレイヤーID
    gamePhase: GAME_PHASES.WAITING_TO_START, // ゲームの進行状況
    lastDiscardedTile: null, // 直前に捨てられた牌
    drawnTile: null, // 現在のプレイヤーがツモった牌 (手牌に加える前)
    showResultPopup: false,
    resultMessage: '',
    showFinalResultPopup: false,
    finalResultDetails: { // 最終結果の詳細情報 (構造化)
      rankedPlayers: [],
      consecutiveWins: 0,
    },
    currentRound: { wind: 'east', number: 1 }, // 例: 東1局
    honba: 0, // 本場
    riichiSticks: 0, // 供託リーチ棒
    turnCount: 0, // 現在の局の総ターン数 (捨て牌が行われるたびにインクリメント)
    playerTurnCount: {}, // 各プレイヤーがその局で手番を開始した回数 (ツモ、ポン/カン後の打牌前)
    isIppatsuChance: {}, // 各プレイヤーの一発のチャンスがあるか (リーチ直後の自分のツモ番まで)
    isChankanChance: false, // 槍槓のチャンスがあるか (他家が加槓した直後)
    chankanTile: null, // 槍槓の対象となる牌
    rinshanKaihouChance: false, // 嶺上開花のチャンス (カンの後)
    lastActionPlayerId: null, // 最後に行動（打牌、カンなど）したプレイヤーID
    canDeclareRon: {}, // 各プレイヤーがロン宣言可能か (他家の打牌後)
    canDeclarePon: {}, // 各プレイヤーがポン宣言可能か { playerId: tileObject | null }
    canDeclareMinkan: {}, // 各プレイヤーが明槓宣言可能か { playerId: tileObject | null }
    canDeclareAnkan: {}, // 各プレイヤーが暗槓可能か { playerId: tileObject | true | null }
    canDeclareKakan: {}, // 各プレイヤーが加槓可能か { playerId: tileObject | true | null }
    // 各プレイヤーが現在可能なアクションを保持するオブジェクト
    // 例: playerActionEligibility[playerId] = { canRon: true, canPon: tile, canMinkan: tile, canChankan: tile, canTsumoAgari: true, canRiichi: true }
    playerActionEligibility: {},
    // 他のプレイヤーのアクション宣言を待っているプレイヤーのIDリスト
    actionResponseQueue: [], // { playerId, actionType, tile, priority } プレイヤーが宣言したアクションを一時的に保持
    waitingForPlayerResponses: [], // 応答待ちのプレイヤーIDのリスト
    // どのプレイヤーがどのアクションに対して応答したか
    // 例: playerResponses[actionTargetPlayerId][respondingPlayerId] = 'skip' | 'ron' | 'pon'
    playerResponses: {},
    // isTenho, isChiho, isRenho は handleAgari 内で turnCount と isParent (isDealer) で判定するため、
    isFuriTen: {}, // { [playerId: string]: boolean } 永続的なフリテン（現物）
    activeActionPlayerId: null, // 応答をアクティブに待っているプレイヤーのID
    isDoujunFuriTen: {}, // { [playerId: string]: boolean } 同巡内フリテン
    riichiDiscardOptions: [], // リーチ宣言後に捨てられる牌のIDリスト
    isDeclaringRiichi: {}, // リーチ宣言中かどうかのフラグ { [playerId: string]: boolean }
    // 和了結果の詳細情報
    agariResultDetails: {
      roundWind: null, // 例: 'east'
      roundNumber: null, // 例: 1
      honba: 0, // 本場
      doraIndicators: [],
      uraDoraIndicators: [], // リーチ時のみ
      winningHand: [], // 和了時の手牌 (和了牌を含む)
      agariTile: null, // 和了牌
      yakuList: [], // { name: string, fans: number } の配列
      totalFans: 0,
      fu: 0, // 四牌麻雀では符計算は簡略化されることが多いが、念のため
      score: 0, // 最終的な点数
      scoreName: null, // "満貫", "跳満" など
      pointChanges: {}, // { playerId: changeAmount }
    },
    anyPlayerMeldInFirstRound: false, // 最初の1巡で誰かが鳴いたか
    // 必ずしも state に持つ必要はないが、デバッグやUI表示用に持つことも可能。
    // ここでは handleAgari で直接判定する方針とする。
    gameMode: 'allManual', // 'allManual', 'vsCPU', 'online'
    shouldAdvanceRound: false, // 次の局に進むかどうかのフラグ
    nextDealerIndex: null,     // 次の局の親のインデックス
    shouldEndGameAfterRound: false, // この局の後にゲームを終了するか
    pendingKanDoraReveal: false, // カン成立後、打牌時にドラをめくるためのフラグ
    animationState: { // アニメーション表示用の状態
      type: null, // 'ron', 'tsumo', 'riichi'
      playerId: null,
    },
    riichiDiscardedTileId: {}, // { [playerId: string]: string | null } リーチ宣言牌のIDを保持
    maxConsecutiveWins: parseInt(localStorage.getItem('mahjongMaxConsecutiveWins') || '0'), // ローカルストレージから最大連勝数を読み込み
    previousConsecutiveWins: 0, // 連勝が途切れる直前の連勝数
    showDealerDeterminationPopup: false, // 親決め結果ポップアップの表示フラグ
    dealerDeterminationResult: { // 親決め結果の詳細情報
      players: [], // { id, name, seatWind, isDealer } の配列
    },
    catCoins: 0, // 猫コインの合計
    lastCoinGain: 0, // 直近で得た猫コイン
    isRiichiBgmActive: false, // リーチBGMがアクティブかどうか
    previousBgm: null, // リーチ前のBGMを保持
    highlightedDiscardTileId: null, // ロンされた際にハイライトする捨て牌のID
  }),
  actions: {
    /**
     * リーチ時のBGMを開始します。
     * 現在のBGMを保存し、リーチ専用BGMに切り替えます。
     */
    startRiichiBgm() {
      const audioStore = useAudioStore();
      // リーチBGMがまだアクティブでない場合のみ、現在のBGMを保存
      if (!this.isRiichiBgmActive) {
        this.previousBgm = audioStore.currentBgm;
      }
      audioStore.setBgm('NES-JP-A04-2(Stage3-Loop125).mp3'); // リーチBGMに切り替え
      this.isRiichiBgmActive = true;
    },
    /**
     * リーチ時のBGMを停止し、元のBGMに戻します。
     */
    stopRiichiBgm() {
      const audioStore = useAudioStore();
      if (this.isRiichiBgmActive) {
        audioStore.setBgm(this.previousBgm); // 元のBGMに戻す
        this.isRiichiBgmActive = false;
        this.previousBgm = null; // リセット
      }
    },
    /**
     * ゲームを初期化し、新しい局を開始します。
     * プレイヤーのシャッフル、親の決定、牌の準備、配牌などを行います。
     */
    initializeGame() {
      // ゲーム初回開始時にプレイヤーの順番をランダム化
      if (this.dealerIndex === null) {
        // AIプレイヤーをランダムに3人選ぶ
        const shuffledAis = [...allAiPlayers].sort(() => 0.5 - Math.random());
        const selectedAis = shuffledAis.slice(0, 3).map((ai, index) => ({
          id: `player${index + 2}`, // player2, player3, player4
          name: ai.name,
          originalId: ai.originalId, // アイコン判別用に元のIDを保持
          hand: [],
          discards: [],
          melds: [],
          isDealer: false,
          score: 25000,
          seatWind: null
        }));

        // 人間プレイヤーと選択されたAIプレイヤーを結合
        this.players = [
          this.players[0], // 既存の人間プレイヤー
          ...selectedAis
        ];

        // Fisher-Yates shuffle (プレイヤーの初期配置をランダム化)
        for (let i = this.players.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
        }
      }

      // 局開始時の各種状態をリセット
      this.turnCount = 0; // 局開始時に総ターン数をリセット
      this.players.forEach(player => {
        this.playerTurnCount[player.id] = 0; // 各プレイヤーのターン数もリセット
        this.isIppatsuChance[player.id] = false; // 一発チャンスをリセット
        this.canDeclareRon[player.id] = false; // ロン宣言可能状態をリセット
        this.canDeclarePon[player.id] = null;
        this.canDeclareMinkan[player.id] = null;
        this.canDeclareAnkan[player.id] = null;
        this.canDeclareKakan[player.id] = null;
        this.playerActionEligibility[player.id] = {}; // アクション可能状態もリセット
        this.playerResponses = {};
        this.waitingForPlayerResponses = [];
        this.riichiDiscardOptions = [];
        this.actionResponseQueue = [];
        this.isDoujunFuriTen[player.id] = false;
        this.isFuriTen[player.id] = false;
        this.isTenpaiDisplay[player.id] = false;
        this.isDeclaringRiichi[player.id] = false; // リーチ宣言状態もリセット
        this.activeActionPlayerId = null;
        this.anyPlayerMeldInFirstRound = false; // 局開始時にリセット
        this.pendingKanDoraReveal = false; // フラグをリセット
        this.animationState = { type: null, playerId: null }; // アニメーション状態をリセット
        this.riichiDiscardedTileId[player.id] = null; // リーチ宣言牌IDをリセット
      });
      this.rinshanKaihouChance = false;
      this.lastActionPlayerId = null;
      this.shouldEndGameAfterRound = false; // ゲーム開始時にリセット

      // 1. 親の決定と席風の割り当て
      const playerCount = this.players.length;
      // dealerIndex が null (ゲーム初回開始時など) の場合のみランダムに親を決定
      // それ以外の場合 (連荘や親流れ後) は、既存の dealerIndex を使用
      if (this.dealerIndex === null) {
        this.dealerIndex = Math.floor(Math.random() * playerCount);
      }
      const currentDealerIndex = this.dealerIndex; // 決定された親インデックスを使用

      // isDealerフラグを設定
      this.players.forEach((player, index) => {
        player.isDealer = (index === currentDealerIndex);
      });

      // 席風を割り当てる (mahjongLogic.assignPlayerWinds は新しい配列を返す)
      // 注意: assignPlayerWinds に渡す this.players は isDealer が設定された状態
      const playersWithWinds = mahjongLogic.assignPlayerWinds(
        this.players, // isDealerが設定された現在のプレイヤー配列
        currentDealerIndex,
        playerCount
      );
      this.players = playersWithWinds; // ストアのプレイヤー情報を更新

      // 2. 山牌の準備と配牌
      let fullWall = mahjongLogic.getAllTiles(); // 全ての牌を生成
      fullWall = mahjongLogic.shuffleWall(fullWall); // 牌山をシャッフル

      // 山牌と王牌を分ける
      const deadWallSize = 14; // 王牌のサイズ
      this.deadWall = fullWall.slice(0, deadWallSize); // 王牌をfullWallの先頭から取得
      const liveWallForDealing = fullWall.slice(deadWallSize); // 配牌に使用する山牌は、王牌を除いた残り

      // 四牌麻雀の初期手牌枚数
      const initialHandSize = 4; // 初期手牌枚数
      const { hands: initialHands, wall: updatedLiveWall } = mahjongLogic.dealInitialHands(playerCount, liveWallForDealing, initialHandSize);
      this.wall = updatedLiveWall; // 配牌後の山牌でストアを更新

      // 各プレイヤーに手牌をセットし、その他の状態をリセット
      this.players.forEach((player, index) => {
        player.hand = initialHands[index] || []; // 配牌結果をセット、失敗時は空配列
        player.discards = []; // 捨て牌をリセット
        player.melds = []; // 副露
        player.isRiichi = false; // リーチ状態をリセット
        player.isDeclaringRiichi = false; // リーチ宣言状態もリセット
        player.isDoubleRiichi = false; // ダブルリーチ状態をリセット
        this.isDoujunFuriTen[player.id] = false; // 同巡フリテンをリセット
        // player.isIppatsu は isIppatsuChance で管理
      });

      // ドラ表示牌を王牌からめくる
      this.doraIndicators = [mahjongLogic.revealDora(this.deadWall)].filter(Boolean); // nullを除外

      this.currentTurnPlayerId = this.players[this.dealerIndex]?.id; // 親からスタート
      this.gamePhase = GAME_PHASES.PLAYER_TURN; // ゲームフェーズをプレイヤーのターンにする

      // 親決め結果をセットし、ポップアップ表示用のデータを準備
      this.dealerDeterminationResult.players = this.players.map(p => ({
        id: p.id,
        name: p.name,
        seatWind: p.seatWind,
        isDealer: p.isDealer,
        score: 25000, // 初期点数
        originalId: p.originalId, // アイコン表示用に元のIDを渡す
      }));
    },
    /**
     * 現在のターンプレイヤーが山から牌を1枚ツモるアクション。
     * ツモ後の各種アクション（ツモ和了、リーチ、カンなど）の可能性をチェックし、
     * AIプレイヤーの場合は自動で行動を決定します。
     */
    drawTile() {
      // プレイヤーがツモる条件: 山牌があり、現在のターンプレイヤーが設定されており、ゲームフェーズがツモ待ちの時
      if (this.wall.length > 0 &&
          this.currentTurnPlayerId &&
          this.gamePhase === GAME_PHASES.PLAYER_TURN) {
        const wallSizeBeforeDraw = this.wall.length;
        // 現在のプレイヤーのターン数をインクリメント
        if (this.playerTurnCount[this.currentTurnPlayerId] !== undefined && !this.rinshanKaihouChance) {
          this.playerTurnCount[this.currentTurnPlayerId]++;
        }
        const tile = this.wall.shift(); // 山の先頭からツモる
        this.drawnTile = tile; // ツモった牌をセット
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // プレイヤーの打牌待ち
        this.lastActionPlayerId = this.currentTurnPlayerId; // ツモもアクションとみなす

        // ツモったので、他家のロン宣言は不可にする
        this.players.forEach(p => this.canDeclareRon[p.id] = false);
        this.players.forEach(p => this.canDeclarePon[p.id] = null);
        this.players.forEach(p => this.canDeclareMinkan[p.id] = null);
        // 槍槓のチャンスは、槍槓対象の打牌後、次のツモまでの間。ここでリセット。
        if (this.isChankanChance && this.lastActionPlayerId === this.currentTurnPlayerId) {
            this.isChankanChance = false;
        }
        // 自分のツモ番なので、暗槓・加槓の可能性をチェック
        const currentPlayer = this.players.find(p => p.id === this.currentTurnPlayerId);
        if (currentPlayer) {
          // 自分のツモ番が来たので、同巡内フリテンは解除
          this.isDoujunFuriTen[currentPlayer.id] = false;
          // ツモ和了可能か（軽量チェック）
          this.playerActionEligibility[currentPlayer.id] = { 
            canTsumoAgari: mahjongLogic.canWinBasicShape(currentPlayer.hand, this.drawnTile, currentPlayer.melds)
          };

          // --- リーチ後の処理 ---
          if (currentPlayer.isRiichi || currentPlayer.isDoubleRiichi) {
            // リーチ中はツモ和了と暗槓のみ可能
            const ankanOptions = mahjongLogic.checkCanAnkan(currentPlayer.hand, this.drawnTile);
            this.playerActionEligibility[currentPlayer.id].canAnkan = ankanOptions.length > 0 ? ankanOptions : null;
            // リーチ中は再リーチ、ポン、明槓、加槓は不可
            this.playerActionEligibility[currentPlayer.id].canRiichi = false;
            this.playerActionEligibility[currentPlayer.id].canPon = null;
            this.playerActionEligibility[currentPlayer.id].canMinkan = null;
            this.playerActionEligibility[currentPlayer.id].canKakan = null;

            // ツモ和了可能か詳細チェック
            const gameContextForTsumo = this.createGameContextForPlayer(currentPlayer, true);
            const tsumoWinResult = mahjongLogic.checkYonhaiWin([...currentPlayer.hand, this.drawnTile], this.drawnTile, true, gameContextForTsumo);
            this.playerActionEligibility[currentPlayer.id].canTsumoAgari = tsumoWinResult.isWin;

            // ツモ和了可能な場合
            // AIプレイヤーの場合、自動でツモ和了またはツモ切り
            if (this.gameMode === 'vsCPU' && currentPlayer.id !== 'player1') {
                if (this.playerActionEligibility[currentPlayer.id].canTsumoAgari) {
                    this.handleAgari(currentPlayer.id, this.drawnTile, true); // ツモ和了
                } else {
                    // ツモ和了できない場合は、自動でツモ切り
                    setTimeout(() => {
                        if (this.currentTurnPlayerId === currentPlayer.id && this.drawnTile) {
                            this.discardTile(currentPlayer.id, this.drawnTile.id, true);
                        }
                    }, 500); // 少し待ってから打牌
                }
            } else { // 人間プレイヤーの場合 (player1)
                // UIにツモボタンを表示するため、ここでは何もしない
                // ツモ和了できない場合は、自動でツモ切り
                if (!this.playerActionEligibility[currentPlayer.id].canTsumoAgari) {
                    setTimeout(() => {
                        if (this.currentTurnPlayerId === currentPlayer.id && this.drawnTile) {
                            this.discardTile(currentPlayer.id, this.drawnTile.id, true);
                        }
                    }, 500); // 少し待ってから打牌
                }
            }
          } else { // --- リーチ中でない場合（通常のツモ処理） ---
            // 通常のツモ処理
            let canRiichi = false;
            // リーチは、残り山牌が4枚以上あり、持ち点が1000点以上の場合のみ可能
            if (this.wall.length > 3 && currentPlayer.melds.every(m => m.type === 'ankan') && currentPlayer.score >= 1000) {
              const potentialHandAfterDraw = [...currentPlayer.hand, this.drawnTile];
              for (const tileToDiscard of potentialHandAfterDraw) {
                const tempHand = [];
                let discarded = false;
                for (const tile of potentialHandAfterDraw) {
                  if (tile.id === tileToDiscard.id && !discarded) {
                    discarded = true;
                  } else {
                    tempHand.push(tile);
                  }
                }
                const tenpaiResult = mahjongLogic.checkYonhaiTenpai(tempHand, this.createGameContextForPlayer(currentPlayer, false));
                if (tenpaiResult.isTenpai && tenpaiResult.waits.length > 0) {
                  canRiichi = true;
                  break;
                }
              }
            }
            this.playerActionEligibility[currentPlayer.id].canRiichi = canRiichi;

            // 海底牌では暗槓・加槓はできない
            if (this.wall.length > 0) {
              const ankanOptions = mahjongLogic.checkCanAnkan(currentPlayer.hand, this.drawnTile);
              this.canDeclareAnkan[currentPlayer.id] = ankanOptions.length > 0 ? ankanOptions : null;
              const kakanOptions = mahjongLogic.checkCanKakan(currentPlayer.hand, currentPlayer.melds, this.drawnTile);
              this.canDeclareKakan[currentPlayer.id] = kakanOptions.length > 0 ? kakanOptions : null;
            }
            this.updateFuriTenState(currentPlayer.id);

            // AI対戦モードで、かつ現在のプレイヤーがAIの場合、自動でアクションを決定
            if (this.gameMode === 'vsCPU' && currentPlayer.id !== 'player1') {
              let actionTaken = false;

              // 1. リーチ可能なら8%の確率でリーチを試みる
              if (this.playerActionEligibility[currentPlayer.id].canRiichi && Math.random() < 0.08) {
                this.declareRiichi(currentPlayer.id);
                actionTaken = true;
              }

              if (!actionTaken) {
                // リーチを試みなかった、またはリーチできなかった場合、他のアクションをチェック
                if (this.canDeclareAnkan[currentPlayer.id] && Math.random() < 1.0) { // 2. 暗槓可能なら100%暗槓
                  this.declareAnkan(currentPlayer.id, this.canDeclareAnkan[currentPlayer.id][0]);
                } else if (this.canDeclareKakan[currentPlayer.id] && Math.random() < 1.0) { // 3. 加槓可能なら100%加槓
                  this.declareKakan(currentPlayer.id, this.canDeclareKakan[currentPlayer.id][0]);
                } else {
                  // どれもできない場合は打牌
                  this.handleAiDiscard();
                }
              }
            }
          }
        }
      } else { // --- 山牌が尽きた、またはツモの条件が満たされない場合 ---
        // 山牌が0枚の場合、流局処理を呼び出す
        if (this.wall.length === 0) {
          this.handleRyuukyoku();
        } else { // 山牌はあるが、ツモの条件が満たされない場合（エラーケース）
          console.warn(`gameStore: Cannot draw tile. Conditions not met. Player: ${this.currentTurnPlayerId}, Phase: ${this.gamePhase}, Wall: ${this.wall.length}`);
          // この場合、ゲームが進行不能になる可能性があるため、エラーハンドリングやリカバリ処理を検討
        }
      }
    },
    /**
     * プレイヤーが牌を捨てるアクション。
     * リーチ後の打牌、通常打牌、各種状態更新、他家のアクションチェックを行います。
     * @param {string} playerId - 牌を捨てるプレイヤーのID。
     * @param {string} tileIdToDiscard - 捨てられる牌のID。
     * @param {boolean} isFromDrawnTile - ツモった牌を捨てる場合はtrue、手牌から捨てる場合はfalse。
     */
    discardTile(playerId, tileIdToDiscard, isFromDrawnTile) {
      const audioStore = useAudioStore();
      // 効果音が有効なら打牌音を再生
      if (audioStore.isSeEnabled) {
        const audio = new Audio('/assets/sounds/打牌.mp3');
        audio.volume = audioStore.volume;
        audio.play();
      }

      // 牌の処理を少し遅延させる (アニメーションのためなど)
      setTimeout(() => {
        const player = this.players.find(p => p.id === playerId);
        // プレイヤーが存在しない、または現在のゲームフェーズで打牌が許可されていない場合は処理を中断
        if (!player || (this.gamePhase !== GAME_PHASES.AWAITING_DISCARD && this.gamePhase !== GAME_PHASES.AWAITING_RIICHI_DISCARD)) {
          console.warn('gameStore: Cannot discard tile now. Conditions not met.', { playerId: player?.id, phase: this.gamePhase, isFromDrawnTile, drawnTile: this.drawnTile });
          return;
        }

        let discardedTileActual; // 実際に捨てられる牌のオブジェクト

        // --- リーチ後の打牌処理 ---
        if (this.gamePhase === GAME_PHASES.AWAITING_RIICHI_DISCARD) {
          // リーチ宣言時の打牌であれば、その牌のIDを保存 (横向き表示のため)
          this.riichiDiscardedTileId[playerId] = tileIdToDiscard;
          const fullHand = [...player.hand, this.drawnTile]; // 手牌とツモ牌を合わせた5枚
          const discardIndex = fullHand.findIndex(t => t && t.id === tileIdToDiscard);

          if (discardIndex === -1) {
            console.error('Riichi discard: Tile to discard not found in hand or drawn tile:', tileIdToDiscard);
            return;
          }

          // テンパイを維持できるかチェックするために、一時的な手牌を作成
          const tempFullHand = [...fullHand];
          const tempDiscardedTile = tempFullHand.splice(discardIndex, 1)[0]; // 捨てられる牌を一時的に取り除く
          const handAfterDiscard = tempFullHand; // 捨てた後の手牌

          // 暗槓がある場合は常にテンパイとみなす（四牌麻雀のルール）
          const hasAnkan = player.melds.some(m => m.type === 'ankan');
          const isTenpai = hasAnkan ? true : mahjongLogic.checkYonhaiTenpai(handAfterDiscard, this.createGameContextForPlayer(player, false)).isTenpai;

          // テンパイが崩れる打牌は許可しない
          if (!isTenpai) {
            console.warn(`Player ${player.id} tried to discard ${tempDiscardedTile.id} after Riichi, but it breaks Tenpai. Aborting.`);
            return; // テンパイが崩れるので打牌を中止
          }

          // テンパイが維持されるので、打牌を確定させる
          discardedTileActual = tempDiscardedTile;
          player.hand = mahjongLogic.sortHand(handAfterDiscard); // 手牌をソート
          this.drawnTile = null; // ツモ牌をクリア
          this.startRiichiBgm(); // リーチBGMを再生
        } else { // --- 通常の打牌処理 ---
          // リーチ中で、かつまだリーチ宣言牌が横向きになっていない場合（ツモ切りリーチなど）
          if ((player.isRiichi || player.isDoubleRiichi) && !this.riichiDiscardedTileId[playerId]) {
            this.riichiDiscardedTileId[playerId] = tileIdToDiscard;
          }
          // ツモ牌を捨てる場合
          if (isFromDrawnTile) {
            if (!this.drawnTile || this.drawnTile.id !== tileIdToDiscard) {
              console.error('Mismatch: Trying to discard drawn tile, but IDs do not match or no drawn tile.');
              return;
            }
            discardedTileActual = this.drawnTile;
            this.drawnTile = null;
          } else { // 手牌から捨てる場合
            const tileIndex = player.hand.findIndex(t => t.id === tileIdToDiscard);
            if (tileIndex === -1) {
              console.error('Tile to discard not found in hand:', tileIdToDiscard);
              return;
            }
            discardedTileActual = player.hand.splice(tileIndex, 1)[0]; // 手牌から牌を削除
              if (this.drawnTile) {
                player.hand.push(this.drawnTile); // ツモ牌を手牌に加える
                player.hand = mahjongLogic.sortHand(player.hand); // 手牌をソート
              }
            this.drawnTile = null; // ツモ牌をクリア
          }
        }

        // 実際に捨て牌をプレイヤーの捨て牌リストに追加
        if (discardedTileActual) {
          player.discards = [...player.discards, discardedTileActual];
        } else {
          console.error("Discard failed: discardedTileActual is undefined. Cannot update discards.");
          return; // 捨て牌が確定しなかったので処理を中断
        }
        this.lastDiscardedTile = discardedTileActual; // 直前に捨てられた牌を更新

        // --- カン成立後の打牌であれば、カンドラをめくる ---
        // ※ このロジックは、どの種類のカン(明槓/暗槓/加槓)の後の打牌でも機能します。
        //    現状、pendingKanDoraRevealフラグは declareMinkan でのみ true になります。
        if (this.pendingKanDoraReveal) {
          if (this.deadWall.length > 0) {
              const newDoraIndicator = mahjongLogic.revealDora(this.deadWall);
              if (newDoraIndicator && !this.doraIndicators.find(d => d.id === newDoraIndicator.id)) {
                  this.doraIndicators.push(newDoraIndicator); // 新しいドラ表示牌を追加
              }
          }
          this.pendingKanDoraReveal = false; // フラグをリセット
        }

        // 手牌が変わったのでフリテン状態を更新
        this.updateFuriTenState(player.id);

        this.turnCount++; // 総ターン数をインクリメント
        this.lastActionPlayerId = player.id; // 最後にアクションを行ったプレイヤーを更新
        this.rinshanKaihouChance = false; // 打牌したら嶺上開花の権利は消える

        // 自分の打牌で自分の一発チャンスは消える。
        // ただし、リーチ宣言時の打牌では消えない（ここから一発が始まるため）
        if (this.gamePhase !== GAME_PHASES.AWAITING_RIICHI_DISCARD) {
          this.isIppatsuChance[player.id] = false;
        }
        this.isChankanChance = false; // 打牌されたら槍槓のチャンスはなくなる

        // --- 他のプレイヤーのアクション可能性をチェック ---
        this.waitingForPlayerResponses = []; // 応答待ちリストを初期化
        let canAnyoneAct = false; // 誰かアクション可能なプレイヤーがいるか
        this.players.forEach(p => {
          if (p.id !== player.id) { // 捨てたプレイヤー以外をチェック
            const eligibility = {};
            // フリテンチェック
            const isPlayerInFuriTen = this.isFuriTen[p.id] || this.isDoujunFuriTen[p.id] || false;

            // ロン可能か（軽量チェック）
            if (isPlayerInFuriTen) {
              eligibility.canRon = false;
            } else {
              eligibility.canRon = mahjongLogic.canWinBasicShape(p.hand, this.lastDiscardedTile, p.melds);
            }
            // 河底牌ではポン・明槓はできず、リーチ中のプレイヤーも同様にできない
            if (this.wall.length > 0 && !p.isRiichi && !p.isDoubleRiichi) {
              eligibility.canPon = mahjongLogic.checkCanPon(p.hand, this.lastDiscardedTile) ? this.lastDiscardedTile : null;
              eligibility.canMinkan = mahjongLogic.checkCanMinkan(p.hand, this.lastDiscardedTile) ? this.lastDiscardedTile : null;
            }
            this.playerActionEligibility[p.id] = eligibility; // プレイヤーのアクション資格を更新

            // ロン、ポン、明槓のいずれかが可能であれば、応答待ちリストに追加
            if (eligibility.canRon || eligibility.canPon || eligibility.canMinkan) {
              canAnyoneAct = true;
              this.waitingForPlayerResponses.push(p.id);
            }
          }
        });

        // 誰もアクションできず、かつリーチ宣言中でもない場合のみ、即座に次のターンへ
        if (!canAnyoneAct && !this.isDeclaringRiichi[player.id]) {
          this.gamePhase = GAME_PHASES.PLAYER_TURN;
          this.moveToNextPlayer();
        } else {
          // 誰かがアクション可能、またはリーチ宣言中の場合は、応答待ちフェーズに入る
          this.gamePhase = GAME_PHASES.AWAITING_ACTION_RESPONSE;
          this.playerResponses = {}; // 応答状態をリセット
          this.setNextActiveResponder(); // 応答を待つ最初のプレイヤーを設定
        }
      }, 100);
    },
    /**
     * 現在のターンプレイヤーから次のプレイヤーへターンを移行します。
     * 各種アクションフラグをリセットし、次のプレイヤーのツモ処理を呼び出します。
     */
    moveToNextPlayer() {
      if (this.players.length === 0) return; // プレイヤーがいない場合は何もしない

      const currentPlayerIndex = this.players.findIndex(p => p.id === this.currentTurnPlayerId);
      // const previousPlayerId = this.currentTurnPlayerId; // ログ用に以前のプレイヤーIDを保持 (未使用のためコメントアウト)

      // 次のプレイヤーのIDを計算
      if (currentPlayerIndex === -1) { // 初期状態など、現在のプレイヤーが設定されていない場合
        this.currentTurnPlayerId = this.players[0].id; // 最初のプレイヤーに設定
      } else {
        this.currentTurnPlayerId = this.players[(currentPlayerIndex + 1) % this.players.length].id; // 次のプレイヤーへ
      }

      this.gamePhase = GAME_PHASES.PLAYER_TURN; // ゲームフェーズを次のプレイヤーのツモ待ちに設定

      // ターンが移ったので、各種宣言可能フラグをリセット
      this.players.forEach(p => {
        this.canDeclareRon[p.id] = false;
        this.canDeclarePon[p.id] = null;
        this.canDeclareMinkan[p.id] = null;
        this.canDeclareAnkan[p.id] = null; // 暗槓可能フラグもリセット
        this.canDeclareKakan[p.id] = null; // 加槓可能フラグもリセット
      });
      
      this.drawTile(); // 次のプレイヤーのツモ処理を呼び出す
      this.waitingForPlayerResponses = []; // ターンが移るので応答待ちはクリア
      this.activeActionPlayerId = null; // アクティブな応答者もクリア
    },
    /**
     * 流局時の処理を行います。
     * テンパイ状況の判定、ノーテン罰符の計算、局の継続/終了条件の判定、結果表示などを行います。
     */
    handleRyuukyoku() {
      try {
        this.gamePhase = GAME_PHASES.ROUND_END; // ゲームフェーズを局終了に設定
        const dealerPlayer = this.players[this.dealerIndex]; // 現在の親プレイヤー

        // 流局結果の詳細情報を初期化
        this.agariResultDetails = {
          roundWind: this.currentRound.wind,
          roundNumber: this.currentRound.number,
          honba: this.honba,
          doraIndicators: [...this.doraIndicators],
          uraDoraIndicators: [], // 流局時は裏ドラなし
          winningHand: [],
          agariTile: null,
          yakuList: [],
          totalFans: 0,
          fu: 0,
          score: 0,
          scoreName: null,
          pointChanges: {},
          isDraw: true, // 流局であることを示すフラグ
        };

        // 各プレイヤーのテンパイ状況を判定
        const tenpaiStates = this.players.map(player => {
          const context = this.createGameContextForPlayer(player, false);
          const tenpaiResult = mahjongLogic.checkYonhaiTenpai(player.hand, context);
          this.isTenpaiDisplay[player.id] = tenpaiResult.isTenpai; // テンパイ状態をストアに保存
          console.log(`Player ${player.id} tenpai status: ${tenpaiResult.isTenpai}`);
          return {
            id: player.id,
            isTenpai: tenpaiResult.isTenpai,
          };
        });

        const tenpaiPlayers = tenpaiStates.filter(p => p.isTenpai); // テンパイしているプレイヤー
        const notenPlayers = tenpaiStates.filter(p => !p.isTenpai); // ノーテンのプレイヤー
        const pointChanges = {}; // 点数変動を格納するオブジェクト
        this.players.forEach(p => pointChanges[p.id] = 0); // 全プレイヤーの点数変動を0で初期化

        // ノーテン罰符の計算
        if (tenpaiPlayers.length > 0 && tenpaiPlayers.length < 4) {
          const totalPayment = 3000; // ノーテン罰符の合計点
          let paymentPerNoten = 0; // ノーテン1人あたりの支払い
          let incomePerTenpai = 0; // テンパイ1人あたりの収入

          // テンパイ人数に応じた点数配分
          if (tenpaiPlayers.length === 1) { paymentPerNoten = 1000; incomePerTenpai = 3000; }
          else if (tenpaiPlayers.length === 2) { paymentPerNoten = 1500; incomePerTenpai = 1500; }
          else if (tenpaiPlayers.length === 3) { paymentPerNoten = 3000; incomePerTenpai = 1000; }

          notenPlayers.forEach(notenPlayer => { pointChanges[notenPlayer.id] -= paymentPerNoten; });
          tenpaiPlayers.forEach(tenpaiPlayer => { pointChanges[tenpaiPlayer.id] += incomePerTenpai; });
        }
        this.agariResultDetails.pointChanges = pointChanges; // 点数変動を結果に反映

        // 局の継続/終了条件の判定
        const isDealerTenpai = tenpaiPlayers.some(p => p.id === dealerPlayer.id); // 親がテンパイしているか
        const rankedPlayers = getRankedPlayers(this.players); // 現在の順位
        const dealerRank = rankedPlayers.find(p => p.id === dealerPlayer.id)?.rank; // 親の順位

        const isEast4 = this.currentRound.wind === 'east' && this.currentRound.number === 4; // 東4局か
        const isDealerTop = dealerRank === 1; // 親がトップか

        if (isEast4 && isDealerTenpai && isDealerTop) {
          // 東4局で親がテンパイかつトップの場合、ゲーム終了
          this.resultMessage = `親（${dealerPlayer.name}）がテンパイでトップのため終局`;
          this.honba = 0; // 本場リセット
          this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length; // 親流れ
          this.shouldAdvanceRound = true; // 局を進める
          this.shouldEndGameAfterRound = true; // ゲーム終了フラグ
        } else if (isDealerTenpai) {
          // 親がテンパイの場合、連荘
          this.resultMessage = `親（${dealerPlayer.name}）がテンパイのため連荘`;
          this.honba++; // 本場プラス
          this.nextDealerIndex = this.dealerIndex; // 親は継続
          this.shouldAdvanceRound = false; // 局は進めない
        } else {
          // 親がノーテンの場合、親流れ
          this.resultMessage = `親（${this.players[this.dealerIndex].name}）がノーテンのため親流れ`;
          this.honba = 0; // 本場リセット
          this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length; // 親流れ
          this.shouldAdvanceRound = true; // 局を進める
        }

        // 箱下（持ち点0未満）による終局条件のチェック
        if (this.shouldEndGameAfterRound && !(isEast4 && isDealerTenpai && isDealerTop)) {
          const playerBelowZero = this.players.find(p => (p.score + (pointChanges[p.id] || 0)) < 0);
          if (playerBelowZero) {
            this.resultMessage += `\n${playerBelowZero.name} の持ち点が0点未満になったため終局します。`;
          }
        }
      } catch (error) {
        console.error("流局処理中にエラーが発生しました:", error);
        this.resultMessage = "流局処理中にエラーが発生しました。";
        this.shouldAdvanceRound = true; // エラー時は強制的に局を進める
        this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length;
      } finally {
        // 2秒後にリザルトポップアップを表示
        setTimeout(() => {
          this.stopRiichiBgm(); // リーチBGMを停止
          this.showResultPopup = true;
        }, 2000); // 2秒の遅延
      }
    },
    /**
     * 次の局の準備を行います。
     * 点数変動の適用、親の交代、局数の更新、各種状態のリセット、ゲーム終了判定などを行います。
     */
    prepareNextRound() {
      // 点数反映後に箱下チェックを行う
      const playerBelowZero = this.players.find(p => p.score < 0);
      if (playerBelowZero) {
        this.shouldEndGameAfterRound = true; // 持ち点が0未満のプレイヤーがいればゲーム終了フラグを立てる
      }

      // dealerIndex を nextDealerIndex で更新
      if (this.nextDealerIndex !== null) {
        this.dealerIndex = this.nextDealerIndex;
        this.nextDealerIndex = null; // 使用後はクリア
      }

      // ゲーム終了フラグが立っていればゲーム終了処理を呼び出す
      if (this.shouldEndGameAfterRound) {
        this.handleGameEnd();
        return; // ゲーム終了なので、次の局の準備は行わない
      }

      // 局開始前の各種状態をリセット
      this.showResultPopup = false;
      this.resultMessage = '';
      this.drawnTile = null;
      this.lastDiscardedTile = null;
      this.highlightedDiscardTileId = null; // ハイライトをリセット
      this.animationState = { type: null, playerId: null }; // アニメーション状態をリセット
      // リーチ棒は供託されたままなのでリセットしない
      if (this.isChankanChance) this.isChankanChance = false; // 局をまたぐ槍槓はない
      this.chankanTile = null;
      // isIppatsuChance は initializeGame でリセットされる
      this.players.forEach(p => {
        this.canDeclarePon[p.id] = null; this.canDeclareMinkan[p.id] = null;
      });
      // turnCount, playerTurnCount も initializeGame でリセットされる
      if (this.shouldAdvanceRound) {
        this.currentRound.number++; // 局数をインクリメント
        // isDealerフラグと席風を新しい親に基づいて更新
        this.players.forEach((player, index) => {
          player.isDealer = (index === this.dealerIndex);
        });
        const playersWithNewWinds = mahjongLogic.assignPlayerWinds(
          this.players,
          this.dealerIndex,
          this.players.length
        );
        this.players = playersWithNewWinds; // ストアのプレイヤー情報を更新
      }
      this.shouldAdvanceRound = false; // フラグをリセット

      // ゲーム終了条件のチェック (東4局終了)
      // shouldEndGameAfterRound フラグで既に判定しているので、ここでのチェックは補助的
      if (this.currentRound.wind === 'east' && this.currentRound.number > 4 && !this.shouldEndGameAfterRound) {
        // 親が和了して東4局が終了した場合も考慮 (shouldAdvanceRound が false でも局数が4を超えていれば終了)
        this.handleGameEnd();
        return;
      }
      // dealerIndex が更新された状態で initializeGame を呼び出す
      // initializeGame 内で、現在の dealerIndex を元に親や風が設定される
      this.initializeGame();
      this.startGameFlow(); // 新しい局の開始時に最初のツモを開始
    },
    /**
     * ゲームモードを設定します。
     * @param {string} mode - 設定するゲームモード ('allManual', 'vsCPU', 'online')。
     */
    setGameMode(mode) {
      this.gameMode = mode; // 'allManual', 'vsCPU', 'online'
    },
    /**
     * リーチアニメーションの状態を設定し、一定時間後に打牌選択フェーズへ移行します。
     * @param {string} playerId - リーチを宣言したプレイヤーのID。
     */
    setRiichiAnimationState(playerId) {
      this.animationState = { type: 'riichi', playerId: playerId }; // アニメーション状態をセット
      // 1.5秒後にアニメーションをリセットし、打牌選択フェーズへ移行
      setTimeout(() => {
        this.animationState = { type: null, playerId: null }; // アニメーション状態をリセット
        if (this.gamePhase === GAME_PHASES.RIICHI_ANIMATION) {
          this.gamePhase = GAME_PHASES.AWAITING_RIICHI_DISCARD; // 打牌選択フェーズへ移行
          // 現在のプレイヤーがAIの場合、自動で打牌処理を呼び出す
          const currentPlayer = this.players.find(p => p.id === this.currentTurnPlayerId);
          if (this.gameMode === 'vsCPU' && currentPlayer && currentPlayer.id !== 'player1') {
            this.handleAiRiichiDiscard();
          }
        }
      }, 1500); // 1.5秒の遅延
    },
    /**
     * プレイヤーがリーチを宣言します。
     * リーチ条件を満たしているかチェックし、リーチアニメーションを開始します。
     * @param {string} playerId - リーチを宣言するプレイヤーのID。
     */
    declareRiichi(playerId) {
      const audioStore = useAudioStore();
      const player = this.players.find(p => p.id === playerId);
      // リーチ宣言の条件チェック:
      // - プレイヤーが存在すること
      // - 既にリーチまたはダブルリーチ中でないこと
      // - ツモ牌があること
      // - 鳴き（暗槓以外）がないこと
      // - 残り山牌が4枚以上あること
      // - 持ち点が1000点以上あること
      if (!player || player.isRiichi || player.isDoubleRiichi || !this.drawnTile || player.melds.some(m => m.type !== 'ankan') || this.wall.length <= 3 || player.score < 1000) {
        console.warn("Cannot declare Riichi now.");
        return;
      }
      // リーチを宣言したことを一時的に記録する
      this.isDeclaringRiichi[playerId] = true;
      // リーチ宣言後、次の自分のツモまでは一発のチャンス
      this.isIppatsuChance[playerId] = true;
      this.playerActionEligibility[playerId] = {}; // リーチしたので他のアクションはリセット
      // リーチ宣言後、アニメーションフェーズに移行
      this.gamePhase = GAME_PHASES.RIICHI_ANIMATION;
      audioStore.playSound('Kagura_Suzu03-1.mp3'); // リーチ時の効果音を再生
      // 捨てられる牌の候補を計算 (手牌 + ツモ牌)
      const potentialDiscards = [...player.hand, this.drawnTile];
      this.riichiDiscardOptions = potentialDiscards.filter(tileToDiscard => {
        if (!tileToDiscard) return false;
        // tileToDiscard を捨てたと仮定した残りの4枚の手牌 (tempHand) を作成
        const currentFullHand = [...player.hand, this.drawnTile]; // 5枚の牌
        let tempHand = [];
        let discarded = false;
        for (const tile of currentFullHand) {
          if (tile.id === tileToDiscard.id && !discarded) {
            discarded = true;
          } else {
            tempHand.push(tile);
          }
        }
        // 捨てた後の手牌でテンパイしているかチェック
        return mahjongLogic.checkYonhaiTenpai(tempHand, this.createGameContextForPlayer(player, false)).isTenpai;
      }).map(tile => tile.id); // 捨てられる牌のIDのリストとして保持

      // リーチアニメーションの状態を設定
      this.setRiichiAnimationState(playerId);
    },

    /**
     * プレイヤーが他家への鳴き（ロン、ポン、カン）を見送るアクション。
     * ロンを見逃した場合はフリテン状態を更新します。
     * @param {string} playerId - アクションを見送るプレイヤーのID。
     */
    playerSkipsCall(playerId) {
      // 現在アクティブな応答プレイヤーでなければ処理を中断
      if (this.activeActionPlayerId !== playerId) {
        console.warn(`Player ${playerId} cannot skip now. Active player is ${this.activeActionPlayerId}.`);
        return;
      }

      // ロンを見逃した場合、フリテン状態を更新
      const player = this.getPlayerById(playerId);
      if (player && this.playerActionEligibility[playerId]?.canRon) {
        // リーチ中のプレイヤーがロンを見逃した場合、永続的なフリテンにする
        if (player.isRiichi || player.isDoubleRiichi) {
          this.isFuriTen[playerId] = true;
        } else {
          // リーチ中でない場合は同巡内フリテン
          this.isDoujunFuriTen[playerId] = true;
        }
      }
      
      this.playerResponses[playerId] = 'skip'; // プレイヤーの応答を'skip'として記録
      this.playerActionEligibility[playerId] = {}; // スキップしたので、このプレイヤーのアクション資格をリセット

      this.setNextActiveResponder(); // 次の応答者を設定し、応答処理を続行
    },
    /**
     * プレイヤーが鳴き（ポン、カン）またはロンを宣言します。
     * 宣言されたアクションをキューに追加し、次の応答者を設定します。
     * @param {string} playerId - アクションを宣言するプレイヤーのID。
     * @param {string} actionType - 宣言するアクションのタイプ ('pon', 'minkan', 'ron'など)。
     * @param {Object} tile - ポンやカンの対象となる牌オブジェクト。ロンの場合はnullまたはロン牌。
     */
    playerDeclaresCall(playerId, actionType, tile) {
      // 現在アクティブな応答プレイヤーでなければ処理を中断
      if (this.activeActionPlayerId !== playerId) {
         console.warn(`Player ${playerId} cannot declare ${actionType} now. Active player is ${this.activeActionPlayerId}.`);
         return;
      }

      // ロン宣言の場合、対象の牌はUIから渡されたものではなく、ストアが保持する牌（捨て牌 or 槍槓牌）を正とする
      const tileForAction = actionType === 'ron'
        ? (this.isChankanChance ? this.chankanTile : this.lastDiscardedTile)
        : tile;

      this.playerResponses[playerId] = actionType; // プレイヤーの応答を記録
      this.playerActionEligibility[playerId] = {}; // アクション宣言したので、このプレイヤーのアクション資格をリセット

      // アクションの優先度を設定 (ロンが最も高い)
      let priority = 0;
      if (actionType === 'ron') priority = 3;
      else if (actionType === 'minkan') priority = 1;
      else if (actionType === 'pon') priority = 1;

      // 宣言されたアクションをキューに追加
      this.actionResponseQueue.push({ playerId, actionType, tile: tileForAction, priority });

      // ロンが宣言されても、他のプレイヤーのロン宣言（ダブロン/トリロン）を待つため、すぐには処理しない。
      // 次の応答者に移る。
      this.setNextActiveResponder();
    },
    /**
     * 次にアクションに応答すべきプレイヤーを設定します。
     * 捨て牌プレイヤーの次のプレイヤーから順にチェックし、応答待ちのプレイヤーがいればそのプレイヤーをアクティブにします。
     * 全員が応答済み、または応答待ちのプレイヤーがいなければ、保留中のアクションを処理します。
     */
    setNextActiveResponder() {
      const discarderIndex = this.players.findIndex(p => p.id === this.lastActionPlayerId);
      // 捨て牌プレイヤーが見つからない場合は、アクティブな応答者をクリアして終了
      if (discarderIndex === -1) { this.activeActionPlayerId = null; return; }

      // 捨て牌プレイヤーの次のプレイヤーから順番にチェック
      for (let i = 1; i < this.players.length; i++) {
        const checkIndex = (discarderIndex + i) % this.players.length; // 循環的にインデックスを計算
        const checkPlayerId = this.players[checkIndex].id;

        // 応答待ちリストに含まれていて、まだ応答していないプレイヤーかチェック
        if (this.waitingForPlayerResponses.includes(checkPlayerId) && !this.playerResponses[checkPlayerId]) {
          this.activeActionPlayerId = checkPlayerId; // このプレイヤーをアクティブな応答者に設定

          // ねこAI対戦モードで、応答者がAIの場合、自動で応答処理を呼び出す
          if (this.gameMode === 'vsCPU' && checkPlayerId !== 'player1') {
            this.handleAiResponse(checkPlayerId);
          }

          return; // アクティブな応答者が見つかったら処理を終了
        }
      }

      // 全員が応答済み、または応答待ちのプレイヤーがいない場合
      this.activeActionPlayerId = null; // アクティブな応答者をクリア
      // 全員応答済みなら、保留中のアクションを処理する関数を呼び出す
      this.processPendingActions();
    },
    /**
     * リーチを最終的に成立させる内部ヘルパー関数。
     * リーチ状態の確定、供託棒の追加、リーチ棒の減算を行います。
     * @param {string} playerId - リーチを成立させるプレイヤーのID。
     * @private
     */
    _finalizeRiichi(playerId) {
      const player = this.players.find(p => p.id === playerId);
      // プレイヤーが存在しない、またはリーチ宣言中でなければ処理を中断
      if (!player || !this.isDeclaringRiichi[playerId]) return;

      // ダブルリーチか判定: 自分の最初のツモ番（playerTurnCountが1）で、かつまだ全員が1巡目を終えていない場合
      if (this.playerTurnCount[player.id] === 1 && this.turnCount < this.players.length) {
        player.isDoubleRiichi = true;
      } else {
        player.isRiichi = true;
      }
      this.isDeclaringRiichi[playerId] = false; // 一時フラグをクリア

      player.score -= 1000; // リーチ棒を支払う
      this.riichiSticks++; // 供託リーチ棒を増やす
    },
    /**
     * 他のプレイヤーからの応答が全て揃った後、保留中のアクションを優先度に基づいて処理します。
     * ロン、ポン、カンなどのアクションを解決し、ゲームの状態を更新します。
     */
    processPendingActions() {
      // --- 加槓に対する槍槓応答の処理 ---
      if (this.gamePhase === GAME_PHASES.AWAITING_KAKAN_RESPONSE) {
        // 槍槓ロンが宣言されたかチェック
        const ronAction = this.actionResponseQueue.find(a => a.actionType === 'ron' && a.tile?.id === this.chankanTile?.id);
        if (ronAction) {
          // 槍槓ロンが成立した場合、和了処理へ
          this.handleAgari(ronAction.playerId, this.chankanTile, false, this.currentTurnPlayerId);
        } else {
          // 槍槓されなかった場合、嶺上牌をツモる処理へ
          this.drawRinshanAfterKakan(this.currentTurnPlayerId);
        }
      }
      // --- 通常の打牌に対するアクション応答の処理 ---
      else if (this.gamePhase === GAME_PHASES.AWAITING_ACTION_RESPONSE) {
        // --- リーチ成立判定 ---
        const discarder = this.players.find(p => p.id === this.lastActionPlayerId);
        if (discarder && this.isDeclaringRiichi[discarder.id]) {
          const hasRon = this.actionResponseQueue.some(a => a.actionType === 'ron');
          if (hasRon) {
            // ロンされたのでリーチは不成立
            this.isDeclaringRiichi[discarder.id] = false;
          } else {
            // ロンされなかったのでリーチ成立
            this._finalizeRiichi(discarder.id);
          }
        }
        // --- 保留中のアクションの解決 ---
        if (this.actionResponseQueue.length > 0) {
          // アクションを優先度が高い順にソート (ロン > カン > ポン)
          this.actionResponseQueue.sort((a, b) => b.priority - a.priority);
          const highestPriorityAction = this.actionResponseQueue[0]; // 最も優先度の高いアクション

          let ronActions = this.actionResponseQueue.filter(a => a.actionType === 'ron');
          if (ronActions.length > 0) {
            let winningRonAction = ronActions[0]; // デフォルトは最初のロン宣言
            if (ronActions.length > 1) {
              // ダブロン・トリロンの場合、上家取りルールを適用
              // lastActionPlayerId (捨て牌をしたプレイヤー) から見て、最も近い下家のロンを優先
              const discarderIndex = this.players.findIndex(p => p.id === this.lastActionPlayerId);
              ronActions.sort((a, b) => {
                const indexA = this.players.findIndex(p => p.id === a.playerId);
                const indexB = this.players.findIndex(p => p.id === b.playerId);
                // 捨て牌者からの相対的な位置 (時計回り)
                const relativeIndexA = (indexA - discarderIndex + this.players.length) % this.players.length;
                const relativeIndexB = (indexB - discarderIndex + this.players.length) % this.players.length;
                return relativeIndexA - relativeIndexB;
              });
              winningRonAction = ronActions[0]; // 上家取りで最も優先されるロン
            }
            // ロン和了処理へ
            this.handleAgari(winningRonAction.playerId, this.lastDiscardedTile, false, this.lastActionPlayerId);
          } else if (highestPriorityAction.actionType === 'minkan') {
            // 明槓処理へ
            this.declareMinkan(highestPriorityAction.playerId, this.lastActionPlayerId, highestPriorityAction.tile);
          } else if (highestPriorityAction.actionType === 'pon') {
            // ポン処理へ
            this.declarePon(highestPriorityAction.playerId, this.lastActionPlayerId, highestPriorityAction.tile);
          }
        } else {
          // アクションが何も宣言されなかった場合のみ次のプレイヤーへターンを移す
          if (this.actionResponseQueue.length === 0) {
            this.moveToNextPlayer();
          }
        }
      }

      // 処理が終わったら関連stateをクリア
      this.actionResponseQueue = [];
      this.waitingForPlayerResponses = [];
      this.playerResponses = {};
      // playerActionEligibility は、和了/流局でなければ次のターン開始時にリセットされるか、
      // 鳴きが発生した場合はそのプレイヤーの打牌待ちになるので、そのタイミングで適切に更新される。
      // ここでは一旦クリアしないでおくか、次のフェーズに応じてクリアする。
      if (this.gamePhase !== GAME_PHASES.ROUND_END && this.gamePhase !== GAME_PHASES.GAME_OVER && this.gamePhase !== GAME_PHASES.AWAITING_DISCARD) {
          this.players.forEach(p => this.playerActionEligibility[p.id] = {});
      }
      this.isChankanChance = false; // 槍槓の機会は終了
      this.chankanTile = null;
      this.activeActionPlayerId = null; // 処理が終わったのでクリア
    },
    /**
     * プレイヤーがポンを宣言し、処理します。
     * 鳴かれた牌の処理、手牌からの牌の削除、面子の追加、状態のリセット、ターンプレイヤーの交代などを行います。
     * @param {string} playerId - ポンを宣言するプレイヤーのID。
     * @param {string} targetPlayerId - ポンされる牌を捨てたプレイヤーのID。
     * @param {Object} tileToPon - ポンする牌のオブジェクト。
     */
    declarePon(playerId, targetPlayerId, tileToPon) {
      const audioStore = useAudioStore();
      const player = this.players.find(p => p.id === playerId);
      const targetPlayer = this.players.find(p => p.id === targetPlayerId);
      // ポン宣言の条件チェック
      if (!player || !targetPlayer || !this.lastDiscardedTile || mahjongLogic.getTileKey(this.lastDiscardedTile) !== mahjongLogic.getTileKey(tileToPon)) {
        console.error("Pon declaration invalid.");
        return;
      }
      // ポンが可能かロジックで再確認
      const canPon = mahjongLogic.checkCanPon(player.hand, this.lastDiscardedTile);
      if (!canPon) {
        console.error("Cannot declare Pon. Conditions not met.");
        return;
      }

      // ポンされた牌を捨て牌から削除
      targetPlayer.discards.pop();

      // 鳴かれた牌がリーチ宣言牌であれば、そのプレイヤーのリーチ宣言牌IDをリセット
      if (this.riichiDiscardedTileId[targetPlayer.id] === tileToPon.id) {
        this.riichiDiscardedTileId[targetPlayer.id] = null;
      }

      // 手牌から2枚取り除く (tileToPon と同じ牌)
      let removedCount = 0;
      player.hand = player.hand.filter(tileInHand => {
        if (mahjongLogic.getTileKey(tileInHand) === mahjongLogic.getTileKey(this.lastDiscardedTile) && removedCount < 2) {
          removedCount++;
          return false;
        }
        return true;
      });

      // どの位置の牌が鳴かれたか (横向きになる牌) を計算
      const currentPlayerIndex = this.players.findIndex(p => p.id === playerId);
      const targetPlayerIndex = this.players.findIndex(p => p.id === targetPlayerId);
      let takenTileRelativePosition = null;
      if ((currentPlayerIndex + 1) % this.players.length === targetPlayerIndex) { // 下家から鳴いた場合
        takenTileRelativePosition = 'right';
      } else if ((currentPlayerIndex + 2) % this.players.length === targetPlayerIndex) { // 対面から鳴いた場合
        takenTileRelativePosition = 'middle';
      } else if ((currentPlayerIndex + 3) % this.players.length === targetPlayerIndex) { // 上家から鳴いた場合
        takenTileRelativePosition = 'left';
      }

      // 面子として追加
      player.melds.push({ type: 'pon', tiles: [tileToPon, tileToPon, tileToPon], from: targetPlayerId, takenTileRelativePosition: takenTileRelativePosition });
      // 手牌が変わったのでフリテン状態を更新
      this.updateFuriTenState(playerId);
      
      this.currentTurnPlayerId = playerId; // ポンしたプレイヤーのターン
      this.playerActionEligibility[playerId] = {}; // ポンしたのでアクションリセット
      this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌待ちフェーズへ移行
      this.drawnTile = null; // ポンなのでツモ牌はない
      this.lastDiscardedTile = null; // 他家の捨て牌は消費された
      this.rinshanKaihouChance = false; // ポンでは嶺上開花なし
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false); // 鳴きが入ったので同巡フリテンは解除
      this.players.forEach(p => this.isIppatsuChance[p.id] = false); // 鳴きが入ったので一発は消える
      this.isChankanChance = false; // 槍槓のチャンスもリセット
      this.players.forEach(p => { // 他のプレイヤーのアクション機会をリセット
        this.playerActionEligibility[p.id] = {};
      });
      this.lastActionPlayerId = playerId; // 最後にアクションを行ったプレイヤーを更新
      // ターン数をインクリメント (1巡目鳴き判定用)
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      // 最初の1巡目での鳴きがあったか記録
      if (this.turnCount < this.players.length) {
        this.anyPlayerMeldInFirstRound = true;
      }
      // AIプレイヤーの場合、ポン後に自動で打牌
      if (this.gameMode === 'vsCPU' && playerId !== 'player1') {
        setTimeout(() => {
          if (this.currentTurnPlayerId === playerId && this.gamePhase === GAME_PHASES.AWAITING_DISCARD) {
            this.handleAiDiscard();
          }
        }, 1550); // アニメーション時間待つ
      }

      // ポンアニメーションの状態を設定
      this.animationState = { type: 'pon', playerId: playerId };
      // 効果音を鳴らす
      audioStore.playSound('Percussive_Accent03-1(Dry).mp3');
      // 1.5秒後にアニメーションをリセット
      setTimeout(() => {
        this.animationState = { type: null, playerId: null };
      }, 1500);
    },
    /**
     * プレイヤーが明槓（大明槓）を宣言し、処理します。
     * 鳴かれた牌の処理、手牌からの牌の削除、面子の追加、嶺上牌のツモ、状態のリセットなどを行います。
     * @param {string} playerId - 明槓を宣言するプレイヤーのID。
     * @param {string} targetPlayerId - 明槓される牌を捨てたプレイヤーのID。
     * @param {Object} tileToKan - 明槓する牌のオブジェクト。
     */
    declareMinkan(playerId, targetPlayerId, tileToKan) {
      const audioStore = useAudioStore();
      const player = this.players.find(p => p.id === playerId);
      const targetPlayer = this.players.find(p => p.id === targetPlayerId);
      // 明槓宣言の条件チェック
      if (!player || !targetPlayer || !this.lastDiscardedTile || mahjongLogic.getTileKey(this.lastDiscardedTile) !== mahjongLogic.getTileKey(tileToKan)) {
        console.error("Minkan declaration invalid: No valid tile to kan from discard.");
        return;
      }
      // 明槓が可能かロジックで再確認
      const canMinkan = mahjongLogic.checkCanMinkan(player.hand, this.lastDiscardedTile);
      if (!canMinkan) {
        console.error("Cannot declare Minkan. Conditions not met.");
        return;
      }
      // カンされた牌を捨て牌から削除
      targetPlayer.discards.pop();

      // 鳴かれた牌がリーチ宣言牌であれば、そのプレイヤーのリーチ宣言牌IDをリセット
      if (this.riichiDiscardedTileId[targetPlayer.id] === tileToKan.id) {
        this.riichiDiscardedTileId[targetPlayer.id] = null;
      }

      // 手牌から3枚取り除く (tileToKan と同じ牌)
      let removedCount = 0;
      player.hand = player.hand.filter(t => {
        if (mahjongLogic.getTileKey(t) === mahjongLogic.getTileKey(tileToKan) && removedCount < 3) {
          removedCount++;
          return false;
        }
        return true;
      });

      // どの位置の牌が鳴かれたか (横向きになる牌) を計算
      const currentPlayerIndex = this.players.findIndex(p => p.id === playerId);
      const targetPlayerIndex = this.players.findIndex(p => p.id === targetPlayerId);
      let takenTileRelativePosition = null;
      if ((currentPlayerIndex + 1) % this.players.length === targetPlayerIndex) { // 下家から鳴いた場合
        takenTileRelativePosition = 'right';
      } else if ((currentPlayerIndex + 2) % this.players.length === targetPlayerIndex) { // 対面から鳴いた場合
        takenTileRelativePosition = 'middle';
      } else if ((currentPlayerIndex + 3) % this.players.length === targetPlayerIndex) { // 上家から鳴いた場合
        takenTileRelativePosition = 'left';
      }

      // 面子として追加
      player.melds.push({ type: 'minkan', tiles: [tileToKan, tileToKan, tileToKan, tileToKan], from: targetPlayerId, takenTileRelativePosition: takenTileRelativePosition });
      
      this.currentTurnPlayerId = playerId; // 明槓したプレイヤーのターン
      this.lastDiscardedTile = null; // 他家の捨て牌は消費された
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false); // 鳴きが入ったので同巡フリテンは解除
      this.players.forEach(p => this.isIppatsuChance[p.id] = false); // 鳴きが入ったので一発は消える
      this.isChankanChance = false; // 槍槓のチャンスもリセット
      this.players.forEach(p => { // 他のプレイヤーのアクション機会をリセット
        this.playerActionEligibility[p.id] = {};
      });
      this.lastActionPlayerId = playerId; // 最後にアクションを行ったプレイヤーを更新
      // ターン数をインクリメント (1巡目鳴き判定用)
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      // 最初の1巡目での鳴きがあったか記録
      if (this.turnCount < this.players.length) {
        this.anyPlayerMeldInFirstRound = true;
      }
      // 嶺上牌をツモる
      if (this.deadWall.length > 0) {
        this.drawnTile = mahjongLogic.drawRinshanTile(this.wall); // 嶺上牌を山からツモる
        this.rinshanKaihouChance = true; // 嶺上開花のチャンス
        this.pendingKanDoraReveal = true; // 打牌後にドラをめくるフラグを立てる
        this._handlePostRinshanDraw(playerId); // 嶺上ツモ後の処理
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌待ちフェーズへ移行
      } else {
        console.warn("Cannot draw Rinshan tile, dead wall is empty.");
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌は必要
      }

      // カンアニメーションの状態を設定
      this.animationState = { type: 'kan', playerId: playerId };
      // 効果音を鳴らす
      audioStore.playSound('Hyoshigi01-1.mp3');
      // 1.5秒後にアニメーションをリセット
      setTimeout(() => {
        this.animationState = { type: null, playerId: null };
      }, 1500);
    },
    /**
     * プレイヤーが暗槓を宣言し、処理します。
     * 手牌からの牌の削除、面子の追加、嶺上牌のツモ、状態のリセットなどを行います。
     * @param {string} playerId - 暗槓を宣言するプレイヤーのID。
     * @param {Object} tileToAnkan - 暗槓する牌のオブジェクト。
     */
    declareAnkan(playerId, tileToAnkan) {
      const audioStore = useAudioStore();
      const player = this.players.find(p => p.id === playerId);
      // プレイヤーが存在しない、または暗槓する牌が指定されていなければ処理を中断
      if (!player || !tileToAnkan) {
        console.error("Ankan declaration invalid. Player or tile not found.");
        return;
      }
      const ankanKey = mahjongLogic.getTileKey(tileToAnkan); // 暗槓する牌のキー
      const drawnTileKey = this.drawnTile ? mahjongLogic.getTileKey(this.drawnTile) : null; // ツモ牌のキー
      const isFromDrawn = ankanKey === drawnTileKey; // ツモ牌で暗槓するかどうか

      // 手牌からカンする牌を取り除く
      // ツモ牌でカンする場合は手牌から3枚、手牌の4枚でカンする場合は4枚取り除く
      const removeCount = isFromDrawn ? 3 : 4;
      let removedCount = 0;
      player.hand = player.hand.filter(t => {
        if (mahjongLogic.getTileKey(t) === ankanKey && removedCount < removeCount) {
          removedCount++;
          return false;
        }
        return true;
      });
      player.hand = mahjongLogic.sortHand(player.hand); // 暗槓後に手牌をソート
      // 面子として追加 (暗槓はfrom: playerId, takenTileRelativePosition: null)
      player.melds.push({ type: 'ankan', tiles: [tileToAnkan, tileToAnkan, tileToAnkan, tileToAnkan], from: playerId, takenTileRelativePosition: null });
      // ツモ牌でカンした場合は、ツモ牌を消費する
      if (isFromDrawn) {
          this.drawnTile = null;
      } else if (this.drawnTile) {
          // 手牌の4枚でカンした場合、元々ツモっていた牌は手牌に加える
          player.hand.push(this.drawnTile);
          this.drawnTile = null;
      }

      // 手牌が変わったのでフリテン状態を更新
      this.updateFuriTenState(playerId);
      // 鳴き（暗槓含む）が入ったので、全プレイヤーの同巡フリテンは解除
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false);

      this.isChankanChance = false; // 槍槓のチャンスもリセット
      this.players.forEach(p => { // 他のプレイヤーのアクション機会をリセット
        this.canDeclareRon[p.id] = false;
        this.canDeclarePon[p.id] = null;
        this.canDeclareMinkan[p.id] = null;
      });
      this.lastActionPlayerId = playerId; // 最後にアクションを行ったプレイヤーを更新
      // ターン数をインクリメント (1巡目鳴き判定用)
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      // 嶺上牌をツモる
      if (this.deadWall.length > 0) {
        this.drawnTile = mahjongLogic.drawRinshanTile(this.wall); // 嶺上牌を山からツモる
        this.rinshanKaihouChance = true; // 嶺上開花のチャンス
        // カンドラをめくる (暗槓の場合は即座にめくる)
        if (this.deadWall.length > 0) {
            const newDoraIndicator = mahjongLogic.revealDora(this.deadWall);
            if (newDoraIndicator && !this.doraIndicators.find(d => d.id === newDoraIndicator.id)) this.doraIndicators.push(newDoraIndicator);
        }
        this._handlePostRinshanDraw(playerId); // 嶺上ツモ後の処理
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌待ちフェーズへ移行
      } else {
        console.warn("Cannot draw Rinshan tile, dead wall is empty.");
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌は必要
      }

      // カンアニメーションの状態を設定
      this.animationState = { type: 'kan', playerId: playerId };
      // 効果音を鳴らす
      audioStore.playSound('Hyoshigi01-1.mp3');
      // 1.5秒後にアニメーションをリセット
      setTimeout(() => {
        this.animationState = { type: null, playerId: null };
      }, 1500);
    },
    /**
     * プレイヤーが加槓を宣言し、処理します。
     * 既存のポンを槓子に更新し、槍槓のチャンスを発生させ、嶺上牌のツモ処理へ移行します。
     * @param {string} playerId - 加槓を宣言するプレイヤーのID。
     * @param {Object} tileToKakan - 加槓する牌のオブジェクト。
     */
    declareKakan(playerId, tileToKakan) {
      const audioStore = useAudioStore();
      const player = this.players.find(p => p.id === playerId);
      // リーチ後は加槓できない
      if (player && (player.isRiichi || player.isDoubleRiichi)) {
        console.warn(`Player ${playerId} is in Riichi and cannot declare Kakan.`);
        return;
      }
      // プレイヤーが存在しない、または加槓する牌が指定されていなければ処理を中断
      if (!player || !tileToKakan) {
        console.error("Kakan declaration invalid. Player or tile not found.");
        return;
      }
      // 既存のポンをカンに更新
      const ponMeldIndex = player.melds.findIndex(m => m.type === 'pon' && mahjongLogic.getTileKey(m.tiles[0]) === mahjongLogic.getTileKey(tileToKakan));
      if (ponMeldIndex === -1) {
        console.error("Kakan failed: Corresponding Pon meld not found.");
        return;
      }
      player.melds[ponMeldIndex].type = 'kakan'; // 面子のタイプを加槓に更新
      player.melds[ponMeldIndex].tiles.push(tileToKakan); // 4枚目の牌を追加
      // 加槓の場合、元のポン牌の takenTileRelativePosition を維持
      // player.melds[ponMeldIndex].takenTileRelativePosition は変更しない
      // ツモ牌で加カンした場合はツモ牌を消費、そうでなければ手牌から削除
      const kakanKey = mahjongLogic.getTileKey(tileToKakan);
      if (this.drawnTile && mahjongLogic.getTileKey(this.drawnTile) === kakanKey) {
          this.drawnTile = null;
      } else {
        const tileIndexInHand = player.hand.findIndex(t => mahjongLogic.getTileKey(t) === kakanKey);
        if (tileIndexInHand > -1) player.hand.splice(tileIndexInHand, 1);
      }

      // 手牌が変わったのでフリテン状態を更新
      this.updateFuriTenState(playerId);
      this.isChankanChance = true; // 他家は槍槓のチャンス
      this.chankanTile = tileToKakan; // 槍槓の対象となる牌を設定
      this.waitingForPlayerResponses = []; // 槍槓応答待ちリストを初期化
      this.playerResponses = {}; // 応答状態をリセット
      this.players.forEach(p => {
        if (p.id !== playerId) { // 加槓したプレイヤー以外をチェック
          const canChankanRon = mahjongLogic.canWinBasicShape(p.hand, this.chankanTile, p.melds);
          // フリテンでない場合のみ槍槓可能
          if (canChankanRon && !this.isFuriTen[p.id] && !this.isDoujunFuriTen[p.id]) {
            this.playerActionEligibility[p.id] = { canRon: true };
            this.waitingForPlayerResponses.push(p.id);
          } else {
            this.playerActionEligibility[p.id] = { canRon: false };
          }
        }
      });
      this.lastActionPlayerId = playerId; // 最後にアクションを行ったプレイヤーを更新

      // 鳴き（加槓含む）が入ったので、全プレイヤーの同巡フリテンは解除
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false);
      this.players.forEach(p => this.isIppatsuChance[p.id] = false); // 加槓は一発を消す
      // ターン数をインクリメント (1巡目鳴き判定用)
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      // 最初の1巡目での鳴きがあったか記録
      if (this.turnCount < this.players.length) {
        this.anyPlayerMeldInFirstRound = true;
      }
      // 常に他プレイヤーの応答待ちフェーズに入り、次の応答者を設定する
      // 応答待ちリストが空の場合、setNextActiveResponderは最終的にprocessPendingActionsを呼び出し、
      // そこで嶺上牌がツモられる
      this.gamePhase = GAME_PHASES.AWAITING_KAKAN_RESPONSE;
      this.setNextActiveResponder();

      // カンアニメーションの状態を設定
      this.animationState = { type: 'kan', playerId: playerId };
      // 効果音を鳴らす
      audioStore.playSound('Hyoshigi01-1.mp3');
      // 1.5秒後にアニメーションをリセット
      setTimeout(() => {
        this.animationState = { type: null, playerId: null };
      }, 1500);
    },
    
    /**
     * 加槓後、槍槓されなかった場合に嶺上牌をツモるアクション。
     * @param {string} playerId - 加槓を行ったプレイヤーのID。
     */
    drawRinshanAfterKakan(playerId) {
      // 現在のターンプレイヤーが加槓したプレイヤーと一致しない、
      // またはゲームフェーズが槍槓応答待ちでなければ処理を中断
      if (this.currentTurnPlayerId !== playerId || this.gamePhase !== GAME_PHASES.AWAITING_KAKAN_RESPONSE) {
        console.warn("Cannot draw rinshan tile now for Kakan.");
        return;
      }
      // このアクションは processPendingActions から呼ばれる想定 (槍槓ロンがなかった場合)
      // なので、isChankanChance や他プレイヤーの eligibility は processPendingActions でリセット済みのはず

      // カンしたプレイヤー以外のプレイヤーのアクション資格と応答状態をクリア
      this.players.forEach(p => {
        if (p.id !== playerId) {
            this.playerActionEligibility[p.id] = {};
            this.playerResponses[p.id] = undefined; // 応答状態もクリア
        }
      });
      // 嶺上牌をツモる
      if (this.deadWall.length > 0) {
        this.drawnTile = mahjongLogic.drawRinshanTile(this.wall); // 嶺上牌を山からツモる
        this.rinshanKaihouChance = true; // 嶺上開花のチャンス
        this.pendingKanDoraReveal = true; // 打牌後にドラをめくるフラグを立てる
        this._handlePostRinshanDraw(playerId); // 嶺上ツモ後の処理
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌待ちフェーズへ移行
      } else {
        console.warn("Cannot draw Rinshan tile, dead wall is empty.");
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌は必要
      }
    },
    handleAgari(agariPlayerId, agariTile, isTsumo, ronTargetPlayerId = null) {
      const audioStore = useAudioStore();
      this.actionResponseQueue = []; // 和了が発生したので他のアクションは無効
      const player = this.players.find(p => p.id === agariPlayerId);
      if (!player) {
        console.error(`[handleAgari] Player not found: ${agariPlayerId}`);
        return;
      }

      // --- 裏ドラ判定 ---
      if (player.isRiichi || player.isDoubleRiichi) {
        this.uraDoraIndicators = mahjongLogic.getUraDoraIndicators(this.deadWall, this.doraIndicators);
      } else {
        this.uraDoraIndicators = []; // リーチ和了でなければ裏ドラはなし
      }

      const handForWin = isTsumo ? [...player.hand, this.drawnTile] : [...player.hand, agariTile];
      if (handForWin.some(tile => !tile)) { // handForWin に null/undefined が含まれていないかチェック
          console.error('[handleAgari] Invalid tile in handForWin:', handForWin);
          return;
      }

      // ここで初めて、完全な役判定と点数計算を行う
      const gameCtxForWin = this.createGameContextForPlayer(player, isTsumo, agariTile);
      const winResult = isTsumo 
        ? mahjongLogic.checkCanTsumo(player.hand, this.drawnTile, gameCtxForWin)
        : mahjongLogic.checkCanRon(player.hand, agariTile, gameCtxForWin);

      if (winResult.isWin) {
        // プレイヤー1が和了した場合、役の達成状況を記録する
        if (agariPlayerId === 'player1') {
          const yakuAchievements = JSON.parse(localStorage.getItem('mahjongYakuAchieved') || '{}');
          winResult.yaku.forEach(yaku => {
            if (yaku.key) { // keyが存在することを確認
              yakuAchievements[yaku.key] = true;
            }
          });
          localStorage.setItem('mahjongYakuAchieved', JSON.stringify(yakuAchievements));
        }
        // 槍槓でないロン和了の場合、捨て牌をハイライトする
        if (!isTsumo && !gameCtxForWin.isChankan) {
          this.highlightedDiscardTileId = this.lastDiscardedTile.id;
        }

        // --- チョンボの場合の点数計算 ---
        if (winResult.isChombo) {
          // チョンボであってもロン宣言自体は行われているため、アニメーションと効果音を再生
          this.animationState = { type: 'ron', playerId: agariPlayerId };
          audioStore.playSound('Single_Accent17-2(Dry).mp3'); // ロン和了時の効果音

          const pointChanges = {};
          this.players.forEach(p => pointChanges[p.id] = 0);

          const isChomboParent = winResult.chomboPlayerIsParent;

          if (isChomboParent) {
            // 親がチョンボ
            pointChanges[agariPlayerId] = -12000;
            this.players.forEach(p => {
              if (p.id !== agariPlayerId) {
                pointChanges[p.id] = 4000;
              }
            });
          } else {
            // 子がチョンボ
            pointChanges[agariPlayerId] = -8000;
            this.players.forEach(p => {
              if (p.id !== agariPlayerId) {
                if (p.isDealer) {
                  pointChanges[p.id] = 4000;
                } else {
                  pointChanges[p.id] = 2000;
                }
              }
            });
          }

          this.gamePhase = GAME_PHASES.ROUND_END;
          this.resultMessage = `${player.name} が役なしチョンボ！`;
          this.agariResultDetails = {
            roundWind: this.currentRound.wind,
            roundNumber: this.currentRound.number,
            honba: this.honba,
            doraIndicators: [...this.doraIndicators],
            uraDoraIndicators: [],
            winningHand: winResult.chomboHand || [],
            agariTile: null,
            yakuList: [{ name: "役なしチョンボ", fans: 0 }],
            totalFans: 0,
            fu: 0,
            score: winResult.score,
            scoreName: "役なしチョンボ",
            pointChanges: pointChanges,
            isChombo: true,
            chomboPlayerId: agariPlayerId,
            isDraw: false,
          };

          // チョンボの場合、親は流れず、本場を1つ増やす
          this.resultMessage += `チョンボのため、親は流れず次の本場になります.`;
          this.honba++;
          this.nextDealerIndex = this.dealerIndex; // 親は継続
          this.shouldAdvanceRound = false; // 局は進めない

          setTimeout(() => {
            this.showResultPopup = true;
            this.stopRiichiBgm();
          }, 1000);
          return;
        }

        // --- 通常の和了処理 ---
        // 和了アニメーションの状態を即座に設定
        this.animationState = { type: isTsumo ? 'tsumo' : 'ron', playerId: agariPlayerId };


        const pointChanges = {};
        this.players.forEach(p => pointChanges[p.id] = 0);
        if (isTsumo) {
          audioStore.playSound('Multi_Accent01-3(Dry).mp3'); // ツモ和了時の効果音
          if (player.isDealer) { // 親のツモ和了
            const scorePerKo = winResult.score / (this.players.length - 1); // 子は等分
            this.players.forEach(p => {
              if (p.id !== agariPlayerId) {
                pointChanges[p.id] = -scorePerKo;
              }
            });
          } else {
            let parentPayment = 0;
            let koPayment = 0;
            parentPayment = Math.ceil(winResult.score / 2); // 親の支払い (切り上げ)
            koPayment = Math.ceil(winResult.score / 4);     // 他の子の支払い (切り上げ)

            this.players.forEach(p => {
              if (p.id !== agariPlayerId) {
                const payment = p.isDealer ? -parentPayment : -koPayment;
                pointChanges[p.id] = payment;
              }
            });
          }
          pointChanges[agariPlayerId] = winResult.score;
        } else if (ronTargetPlayerId) {
          audioStore.playSound('Single_Accent17-2(Dry).mp3'); // ロン和了時の効果音
          // ロン和了の場合
          pointChanges[ronTargetPlayerId] = -winResult.score;
          pointChanges[agariPlayerId] = winResult.score;
        }
        
        // --- 供託リーチ棒の処理 ---
        pointChanges[agariPlayerId] += this.riichiSticks * 1000; // 和了者が供託棒を受け取る
        this.riichiSticks = 0; // 供託棒をリセット

        this.gamePhase = GAME_PHASES.ROUND_END;
        this.resultMessage = `${player.name} の和了！ ${winResult.yaku.map(y => y.name).join(' ')} ${winResult.isYakuman ? '' : (winResult.fans + '翻')} ${winResult.score}点`;
        this.agariResultDetails = {
          roundWind: this.currentRound.wind,
          roundNumber: this.currentRound.number,
          honba: this.honba, // 本場情報を追加
          doraIndicators: [...this.doraIndicators],
          uraDoraIndicators: (player.isRiichi || player.isDoubleRiichi) ? [...this.uraDoraIndicators] : [],
          winningHand: mahjongLogic.sortHand([...handForWin]), // ソートされた和了手牌
          agariTile: { ...agariTile }, // 和了牌
          yakuList: winResult.yaku, // 役リスト (役満の場合はpower、通常役はfansプロパティを持つ)
          totalFans: winResult.fans,
          fu: winResult.fu || 0, // 符 (四牌麻雀では簡略化されることが多い)
          score: winResult.score,
          scoreName: winResult.scoreName, // 役満名や満貫などの名称
          pointChanges: pointChanges,
          melds: player.melds, // 鳴き牌情報を追加
          isDraw: false,
        };
        // アニメーション表示から1.8秒後にリザルトポップアップを表示
        setTimeout(() => {
          this.showResultPopup = true;
          this.stopRiichiBgm(); // リザルトポップアップ表示時にBGMを元に戻す
        }, 1800);
        
        // 箱下チェックは prepareNextRound に移動

        // isDealerHola の設定など、局の継続/終了に関わるフラグもここで設定
        if (player.isDealer) {
          if (this.currentRound.wind === 'east' && this.currentRound.number === 4) {
            this.resultMessage += `\n親が和了、東4局のため終局`;
            this.honba = 0; // 終局なので本場はリセット
            this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length; // 形式的に親流れ
            this.shouldAdvanceRound = true; // 局を進めてゲーム終了へ
            this.shouldEndGameAfterRound = true; // 東4局親和了でもゲーム終了
          } else {
            this.resultMessage += `\n親が和了し、連荘`;
            this.honba++; // 親和了で本場プラス (連荘)
            this.nextDealerIndex = this.dealerIndex; // 親は継続
            this.shouldAdvanceRound = false;
          }
        } else {
            this.resultMessage += `\n子が和了、親流れ`;
            this.honba = 0; // 子和了で本場リセット
            this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length; // 親流れ
            this.shouldAdvanceRound = true;
        }
        // shouldEndGameAfterRound が true の場合、ResultPopup のボタンで prepareNextRound が呼ばれ、そこで handleGameEnd が呼ばれる
        if (this.shouldEndGameAfterRound) {
            this.resultMessage += ` (最終局)`; // メッセージに最終局であることを示唆
        }

        // 東4局かつ親が和了した場合の終局条件を判定
        let shouldEndGameDueToEast4DealerWin = false;
        if (this.currentRound.wind === 'east' && this.currentRound.number === 4 && player.isDealer) {
            // 東4局で親が和了 かつ 親がトップであるかチェック
            const rankedPlayers = getRankedPlayers(this.players); // 点数変動後の順位を取得
            const dealerRank = rankedPlayers.find(p => p.id === player.id)?.rank;
            if (dealerRank === 1) {
                shouldEndGameDueToEast4DealerWin = true; // 親がトップなら終局
            }
        }

        // 局の継続/終了に関わるフラグを設定
        if (shouldEndGameDueToEast4DealerWin || (player.isDealer && this.currentRound.wind === 'east' && this.currentRound.number === 4)) {
           // 東4局で親が和了かつトップの場合、または箱下で既に終局フラグが立っている場合
           // shouldEndGameDueToEast4DealerWin の条件に箱下チェックも含めるか、shouldEndGameAfterRound を優先するか検討
           // ここでは shouldEndGameDueToEast4DealerWin が true の場合のみ終局条件として扱う
           if (shouldEndGameDueToEast4DealerWin) {
              this.resultMessage += `\n親が和了、東4局終了、親がトップのため終局`;
              this.honba = 0; // 終局なので本場はリセット
              this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length; // 形式的に親流れ
              this.shouldAdvanceRound = true; // 局を進めてゲーム終了へ
              this.shouldEndGameAfterRound = true; // ゲーム終了をトリガー
           } else {
              // 東4局で親が和了だがトップではない場合 -> 連荘
              this.resultMessage += `\n親が和了、東4局終了、親がトップでないため連荘`;
              this.honba++; // 連荘なので本場プラス
              this.nextDealerIndex = this.dealerIndex; // 親は継続
              this.shouldAdvanceRound = false;
              this.shouldEndGameAfterRound = false; // ゲーム終了しない
           }
        } else if (player.isDealer) { // 東4局以外で親が和了
            this.resultMessage += `\n親が和了、連荘`;
            this.honba++; // 親和了で本場プラス (連荘)
            this.nextDealerIndex = this.dealerIndex; // 親は継続
            this.shouldAdvanceRound = false;
        } else { // 子が和了
            this.resultMessage += `\n子が和了、親流れ`;
            this.honba = 0; // 子和了で本場リセット
            this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length; // 親流れ
            this.shouldAdvanceRound = true;
        }

        // 箱下による終局フラグが既に立っている場合は、メッセージに追記
        if (this.shouldEndGameAfterRound && !shouldEndGameDueToEast4DealerWin) { // 東4局親トップ以外での箱下終局
             const playerBelowZero = this.players.find(p => p.score < 0);
             if (playerBelowZero) {
                 this.resultMessage += `\n${playerBelowZero.name} の持ち点が0点未満になったため終局`;
             }
            }
      } else {
        // チョンボ処理など
      }
    },
    /**
     * ゲーム終了時の処理を行います。
     * プレイヤーの最終順位付け、連勝数の更新、猫コインの計算、最終結果ポップアップの表示などを行います。
     */
    handleGameEnd() {
      this.gamePhase = GAME_PHASES.GAME_OVER; // ゲームフェーズをゲーム終了に設定
      // プレイヤーを最終スコアでランク付け
      const rankedPlayers = getRankedPlayers(this.players);

      // 全操作モードでない場合のみ連勝数を更新
      if (this.gameMode !== 'allManual') {
        // ユーザープレイヤー ('player1') が1位か判定し、連勝数を更新
        const myPlayerRank = rankedPlayers.find(p => p.id === 'player1')?.rank;
        const currentWins = this.finalResultDetails.consecutiveWins;

        if (myPlayerRank === 1) {
          this.finalResultDetails.consecutiveWins++; // 1位なら連勝数をインクリメント
          this.previousConsecutiveWins = 0; // 連勝が継続しているのでリセット
        } else {
          // 1位でなく、かつ現在の連勝数が1以上の場合、その数を記録
          if (currentWins > 0) {
            this.previousConsecutiveWins = currentWins;
          } else {
            this.previousConsecutiveWins = 0;
          }
          this.finalResultDetails.consecutiveWins = 0; // 1位でなければ連勝数をリセット
        }
        // 最大連勝数を更新
        if (this.finalResultDetails.consecutiveWins > this.maxConsecutiveWins) {
          this.maxConsecutiveWins = this.finalResultDetails.consecutiveWins;
          localStorage.setItem('mahjongMaxConsecutiveWins', this.maxConsecutiveWins.toString());
        }
      }

      // 最終結果の詳細情報をセット
      this.finalResultDetails.rankedPlayers = rankedPlayers.map(p => ({
        id: p.id,
        rank: p.rank,
        name: p.name,
        score: p.score,
      }));
      this.updateCatCoins(); // 猫コインを更新
      this.showFinalResultPopup = true; // 最終結果ポップアップを表示
    },
    /**
     * タイトル画面に戻る処理を行います。
     * 最終結果ポップアップを閉じ、ゲーム状態を完全にリセットします。
     */
    returnToTitle() {
      this.showFinalResultPopup = false;
      this.resetGameForNewSession(); // ゲーム状態を完全にリセット
      // ここでVue Routerなどを使ってタイトル画面へ遷移する処理を呼び出す (UI側で実装)
    },
    /**
     * 新しいゲームセッションのためにストアの状態を完全にリセットします。
     * オプションによって連勝数を維持するかどうかを制御できます。
     * @param {Object} [options] - リセットオプション。
     * @param {boolean} [options.keepStreak=false] - 連勝数を維持するかどうか。
     */
    resetGameForNewSession(options = { keepStreak: false }) {
      const wins = options.keepStreak ? this.finalResultDetails.consecutiveWins : 0;

      // 人間プレイヤーのみ残し、AIプレイヤーを削除
      this.players = [this.players.find(p => p.id === 'player1')];

      // 各プレイヤーの状態を初期化
      this.players.forEach(player => {
        player.hand = [];
        player.discards = [];
        player.melds = [];
        player.score = 25000; // 初期スコアに戻す
        player.isDealer = false; // isDealer も初期状態に戻す
        player.seatWind = null; // seatWind もリセット
        player.isRiichi = false;
        player.isDoubleRiichi = false;
        player.isDeclaringRiichi = false;
        this.isIppatsuChance[player.id] = false;
      });

      // ゲーム全体の状態を初期化
      this.wall = [];
      this.deadWall = [];
      this.doraIndicators = [];
      this.drawnTile = null;
      this.lastDiscardedTile = null;
      this.dealerIndex = null; // 親インデックスもリセット
      this.currentTurnPlayerId = null; // または初期プレイヤーに設定
      this.gamePhase = GAME_PHASES.WAITING_TO_START; // 初期フェーズに戻す
      this.showResultPopup = false; // ポップアップ関連もリセット
      this.resultMessage = '';
      this.showFinalResultPopup = false; // 最終リザルトポップアップもリセット
      this.finalResultDetails = { // 最終リザルト詳細もリセット
        rankedPlayers: [],
        consecutiveWins: wins,
      };
      this.previousConsecutiveWins = 0; // 新しいセッションではリセット
      this.currentRound = { wind: 'east', number: 1 };
      this.honba = 0;
      this.turnCount = 0;
      this.playerTurnCount = {};
      this.isChankanChance = false;
      this.chankanTile = null;
      this.rinshanKaihouChance = false;
      this.lastActionPlayerId = null;
      this.players.forEach(p => this.canDeclareRon[p.id] = false);
      this.players.forEach(p => {
        this.canDeclareRon[p.id] = false;
        this.canDeclarePon[p.id] = null;
        this.canDeclareMinkan[p.id] = null;
        this.canDeclareAnkan[p.id] = null;
        this.canDeclareKakan[p.id] = null;
        this.playerActionEligibility[p.id] = {};
        this.playerResponses = {};
        this.waitingForPlayerResponses = [];
        this.riichiDiscardOptions = [];
        this.actionResponseQueue = [];
        this.isDoujunFuriTen = {};
        this.isFuriTen = {};
        this.isTenpaiDisplay = {};
        this.isDeclaringRiichi[p.id] = false;
        this.activeActionPlayerId = null;
      });
      this.shouldEndGameAfterRound = false; // タイトルに戻るのでリセット
      this.animationState = { type: null, playerId: null }; // アニメーション状態をリセット
      this.pendingKanDoraReveal = false; // フラグをリセット
      // isInitialized フラグなどがあればそれもリセット
      this.stopRiichiBgm(); // リーチBGMが再生中の場合、停止して通常BGMに戻す
      this.previousBgm = null; // 保存していたBGMをクリア
    },
    /**
     * 指定されたプレイヤーのフリテン状態（永続フリテン）を更新します。
     * テンパイしている場合、捨て牌に待ち牌が含まれていないかチェックします。
     * @param {string} playerId - フリテン状態を更新するプレイヤーのID。
     */
    updateFuriTenState(playerId) {
      const player = this.players.find(p => p.id === playerId);
      // プレイヤーが見つからなければ、フリテン状態をfalseにして終了
      if (!player) {
        this.isFuriTen[playerId] = false;
        return;
      }

      // リーチ中のプレイヤーが既に永続フリテンの場合、状態を維持し、再計算しない
      if ((player.isRiichi || player.isDoubleRiichi) && this.isFuriTen[playerId] === true) {
        return;
      }

      // テンパイしているか、待ち牌は何かをチェック
      const tenpaiResult = mahjongLogic.checkYonhaiTenpai(player.hand, this.createGameContextForPlayer(player, false));
      // テンパイしていなければフリテンではない
      if (!tenpaiResult.isTenpai) {
        this.isFuriTen[playerId] = false;
        return;
      }

      // 待ち牌のキーと捨て牌のキーをセットで取得
      const waitingTileKeys = new Set(tenpaiResult.waits.map(mahjongLogic.getTileKey));
      const discardTileKeys = new Set(player.discards.map(mahjongLogic.getTileKey));

      // 待ち牌の中に、既に捨てた牌が含まれているかチェック
      const isFuriten = [...waitingTileKeys].some(waitKey => discardTileKeys.has(waitKey));
      this.isFuriTen[playerId] = isFuriten; // フリテン状態を更新
    },
    /**
     * 役判定やアクション判定のためのゲームコンテキストオブジェクトを生成します。
     * @param {Object} player - 対象プレイヤーのオブジェクト。
     * @param {boolean} isTsumo - ツモ和了かどうかのフラグ。
     * @param {Object|null} agariTile - 和了牌のオブジェクト（ロンの場合）。
     * @returns {Object|null} ゲームコンテキストオブジェクト、またはnull（プレイヤーが存在しない場合）。
     */
    createGameContextForPlayer(player, isTsumo, agariTile = null) {
      if (!player) return null;
      return {
          playerWind: player.seatWind, // プレイヤーの自風
          roundWind: this.currentRound.wind === 'east' ? mahjongLogic.PLAYER_WINDS.EAST : mahjongLogic.PLAYER_WINDS.SOUTH, // 場風
          doraIndicators: this.doraIndicators, // 表ドラ表示牌
          uraDoraIndicators: (player.isRiichi || player.isDoubleRiichi) ? this.uraDoraIndicators : [], // 裏ドラ表示牌（リーチ時のみ）
          turnCount: this.turnCount, // 現在の局の総ターン数
          playerTurnCount: this.playerTurnCount[player.id], // 各プレイヤーがその局で手番を開始した回数
          isRiichi: player.isRiichi, // リーチ中か
          isDoubleRiichi: player.isDoubleRiichi, // ダブルリーチ中か
          isIppatsu: this.isIppatsuChance[player.id], // 一発のチャンスがあるか
          isHaitei: isTsumo && this.wall.length === 0 && !this.rinshanKaihouChance, // 海底摸月か
          isHoutei: !isTsumo && this.wall.length === 0 && agariTile && this.lastDiscardedTile && agariTile.id === this.lastDiscardedTile.id, // 河底撈魚か
          isChankan: this.isChankanChance && agariTile && this.chankanTile && agariTile.id === this.chankanTile.id, // 槍槓か
          isTenho: player.isDealer && (this.playerTurnCount[player.id] || 0) === 1 && isTsumo && this.turnCount === 0 && (player.melds || []).length === 0, // 天和か（親の配牌時ツモ和了、鳴きなし）
          isChiho: !player.isDealer && (this.playerTurnCount[player.id] || 0) === 1 && isTsumo && this.turnCount < this.players.length && !this.anyPlayerMeldInFirstRound, // 地和か（子の第一ツモ和了、鳴きなし）
          isRenho: !player.isDealer && !isTsumo && (this.playerTurnCount[player.id] || 0) === 0 && this.turnCount < this.players.length && !this.anyPlayerMeldInFirstRound, // 人和か（子の第一打牌ロン和了、鳴きなし）
          melds: player.melds, // プレイヤーの副露情報
          isParent: player.isDealer, // 親かどうかのフラグ
          remainingTilesCount: this.wall.length, // 残り山牌の数
          currentPlayerTurnCount: this.playerTurnCount[player.id] || 0 // 現在のプレイヤーのツモ回数を追加
      };
    },
    /**
     * AIプレイヤーがリーチ後に捨てる牌を決定します。
     * テンパイを維持しつつ、最も安全または有利な牌を選択します。
     */
    handleAiRiichiDiscard() {
      const player = this.players.find(p => p.id === this.currentTurnPlayerId);
      // プレイヤーが存在しない、またはリーチ後に捨てる牌の選択肢がなければ、通常のAI打牌にフォールバック
      if (!player || this.riichiDiscardOptions.length === 0) {
        this.handleAiDiscard(); // Fallback
        return;
      }

      let bestRiichiDiscardTile = null;
      let minScoreForRiichiDiscard = Infinity;

      const potentialDiscardsObjects = [...player.hand, this.drawnTile].filter(tile =>
        tile && this.riichiDiscardOptions.includes(tile.id)
      );

      for (const tile of potentialDiscardsObjects) {
        let score = 0;
        const fullHandForScoring = [...player.hand, this.drawnTile];
        const tempHandAfterDiscard = fullHandForScoring.filter(t => t.id !== tile.id);

        // 字牌の場合の評価
        if (tile.suit === mahjongLogic.SUITS.JIHAI) {
          const tileKey = mahjongLogic.getTileKey(tile);
          const count = tempHandAfterDiscard.filter(t => mahjongLogic.getTileKey(t) === tileKey).length;

          // 対子や刻子を崩すのはマイナス評価
          if (count >= 2) {
            score -= 50;
          }
          const isWindTile = tile.rank >= mahjongLogic.JIHAI_TYPES.TON && tile.rank <= mahjongLogic.JIHAI_TYPES.PEI;
          const isSangenTile = tile.rank >= mahjongLogic.JIHAI_TYPES.HAKU && tile.rank <= mahjongLogic.JIHAI_TYPES.CHUN;

          // 役牌（風牌、三元牌）の評価
          if (isWindTile) {
            const otherWindTiles = tempHandAfterDiscard.filter(t => t.suit === mahjongLogic.SUITS.JIHAI && t.rank >= mahjongLogic.JIHAI_TYPES.TON && t.rank <= mahjongLogic.JIHAI_TYPES.PEI && mahjongLogic.getTileKey(t) !== tileKey);
            if (otherWindTiles.length === 0) { // 他の同種風牌がなければ捨てたい
              score += 80;
            } else {
              score -= 20; // 他の同種風牌があれば残したい
            }
          } else if (isSangenTile) {
            const otherSangenTiles = tempHandAfterDiscard.filter(t => t.suit === mahjongLogic.SUITS.JIHAI && t.rank >= mahjongLogic.JIHAI_TYPES.HAKU && t.rank <= mahjongLogic.JIHAI_TYPES.CHUN && mahjongLogic.getTileKey(t) !== tileKey);
            if (otherSangenTiles.length === 0) { // 他の同種三元牌がなければ捨てたい
              score += 80;
            } else {
              score -= 20; // 他の同種三元牌があれば残したい
            }
          } else { // その他の字牌（例: 雀頭以外の字牌）
            score += 100; // 字牌は捨てたい
          }
        } else { // 数牌の場合の評価
          const suitTiles = tempHandAfterDiscard.filter(t => t.suit === tile.suit);
          const rank = tile.rank;

          // 孤立牌に近いほどプラス評価
          if (suitTiles.length <= 2) {
            score += 80;
          } else if (suitTiles.length <= 4) {
            score += 40;
          }

          // 牌の繋がり（連番）を考慮して、繋がりが近いほど残したい
          let connections = 0;
          if (suitTiles.some(t => t.rank === rank + 1)) { connections += 2; }
          if (suitTiles.some(t => t.rank === rank - 1)) { connections += 2; }
          if (suitTiles.some(t => t.rank === rank + 2)) { connections += 1; }
          if (suitTiles.some(t => t.rank === rank - 2)) { connections += 1; }
          score -= (connections * 10);

          // 端牌（1, 9）の評価
          if (rank === 1 && !suitTiles.some(t => t.rank === 2 || t.rank === 3)) { score += 25; }
          if (rank === 9 && !suitTiles.some(t => t.rank === 7 || t.rank === 8)) { score += 25; }
          // 中張牌（2-8）で繋がりがなければプラス評価
          if (rank > 1 && rank < 9 && connections === 0) { score += 30; }
        }

        // 最も評価スコアが低い牌を選択
        if (score < minScoreForRiichiDiscard) {
          minScoreForRiichiDiscard = score;
          bestRiichiDiscardTile = tile;
        }
      }

      // 最適な捨て牌があればそれを捨て、なければ通常のAI打牌にフォールバック
      if (bestRiichiDiscardTile) {
        this.discardTile(player.id, bestRiichiDiscardTile.id, this.drawnTile && bestRiichiDiscardTile.id === this.drawnTile.id);
      } else {
        this.handleAiDiscard(); // Fallback
      }
    }
    ,
    /**
     * ローカルストレージから猫コインの残高を読み込み、ストアに設定します。
     */
    loadCatCoins() {
      const coins = localStorage.getItem('mahjongCatCoins');
      this.catCoins = coins ? parseInt(coins, 10) : 0;
    },
    /**
     * ゲーム終了時のプレイヤーの順位とスコアに基づいて猫コインを計算し、更新します。
     * 計算されたコインはローカルストレージに保存されます。
     */
    updateCatCoins() {
      const player1 = this.players.find(p => p.id === 'player1');
      if (player1) {
        const rankedPlayers = getRankedPlayers(this.players);
        const myRank = rankedPlayers.find(p => p.id === 'player1')?.rank;
        let gain = 0; // 獲得コイン数

        if (myRank === 1) {
          gain = Math.floor(player1.score / 500) + 200; // 1位はスコアに応じたコイン + 200コインボーナス
        } else if (myRank === 2) {
          gain = Math.floor(player1.score / 500); // 2位はスコアに応じたコイン
        } else if (myRank === 3) {
          gain = -Math.floor(player1.score / 400); // 3位はスコアに応じたマイナス
        } else if (myRank === 4) {
          if (player1.score < 0) {
            gain = -300; // 4位で持ち点マイナスなら固定で-300
          } else {
            gain = -Math.floor(player1.score / 300) - 100; // 4位で持ち点プラスでもマイナスボーナス
          }
        }

        this.lastCoinGain = gain; // 直近のコイン獲得数を記録
        // 猫コインの合計を更新 (0～9999の範囲に制限)
        this.catCoins = Math.min(9999, Math.max(0, this.catCoins + gain));
        localStorage.setItem('mahjongCatCoins', this.catCoins.toString()); // ローカルストレージに保存
      }
    },
    /**
     * 指定された量の猫コインを消費します。
     * コインが足りない場合は消費せず、falseを返します。
     * @param {number} amount - 消費する猫コインの量。
     * @returns {boolean} コインの消費に成功した場合はtrue、足りない場合はfalse。
     */
    deductCatCoins(amount) {
      if (this.catCoins >= amount) {
        this.catCoins -= amount;
        localStorage.setItem('mahjongCatCoins', this.catCoins.toString());
        return true;
      }
      return false;
    },
    /**
     * 嶺上牌をツモった後の処理を行います。
     * ツモ和了、暗槓、加槓、リーチの可能性をチェックし、AIプレイヤーの場合は自動で行動を決定します。
     * @param {string} playerId - 嶺上牌をツモったプレイヤーのID。
     * @private
     */
    _handlePostRinshanDraw(playerId) {
      const player = this.players.find(p => p.id === playerId);
      // プレイヤーが存在しない、またはツモ牌がなければ処理を中断
      if (!player || !this.drawnTile) return;

      // 鳴きが入ったので、全プレイヤーの一発は消える
      this.players.forEach(p => this.isIppatsuChance[p.id] = false);

      const eligibility = {}; // プレイヤーのアクション資格を格納するオブジェクト

      // ツモ和了可能かチェック (嶺上開花)
      const gameContextForTsumo = this.createGameContextForPlayer(player, true);
      const tsumoWinResult = mahjongLogic.checkYonhaiWin([...player.hand, this.drawnTile], this.drawnTile, true, gameContextForTsumo);
      eligibility.canTsumoAgari = tsumoWinResult.isWin;

      // リーチ中でなければ、さらにカンやリーチができるかチェック
      if (!player.isRiichi && !player.isDoubleRiichi) {
          // 海底牌では暗槓・加槓はできない (嶺上牌は海底牌ではないため、ここでは壁の長さでチェック)
          if (this.wall.length > 0) {
              const ankanOptions = mahjongLogic.checkCanAnkan(player.hand, this.drawnTile);
              eligibility.canAnkan = ankanOptions.length > 0 ? ankanOptions : null;

              const kakanOptions = mahjongLogic.checkCanKakan(player.hand, player.melds, this.drawnTile);
              eligibility.canKakan = kakanOptions.length > 0 ? kakanOptions : null;
          }
          
          let canRiichi = false;
          // リーチは、残り山牌が4枚以上あり、持ち点が1000点以上の場合のみ可能
          if (this.wall.length > 3 && player.melds.every(m => m.type === 'ankan') && player.score >= 1000) {
            const potentialHandAfterDraw = [...player.hand, this.drawnTile];
            // 各牌を捨てた場合にテンパイするかチェック
            for (const tileToDiscard of potentialHandAfterDraw) {
              const tempHand = [];
              let discarded = false;
              for (const tile of potentialHandAfterDraw) {
                if (tile.id === tileToDiscard.id && !discarded) {
                  discarded = true;
                } else {
                  tempHand.push(tile);
                }
              }
              const tenpaiResult = mahjongLogic.checkYonhaiTenpai(tempHand, this.createGameContextForPlayer(player, false));
              if (tenpaiResult.isTenpai && tenpaiResult.waits.length > 0) {
                canRiichi = true; // テンパイする捨て牌があればリーチ可能
                break;
              }
            }
          }
          eligibility.canRiichi = canRiichi;
      }
      
      this.playerActionEligibility[playerId] = eligibility; // プレイヤーのアクション資格を更新
      this.canDeclareAnkan[playerId] = eligibility.canAnkan; // 古いstateも更新
      this.canDeclareKakan[playerId] = eligibility.canKakan; // 古いstateも更新

      // AI対戦モードで、かつ現在のプレイヤーがAIの場合、自動で打牌処理を呼び出す
      if (this.gameMode === 'vsCPU' && player.id !== 'player1') {
        setTimeout(() => {
          if (this.currentTurnPlayerId === player.id && this.gamePhase === GAME_PHASES.AWAITING_DISCARD) {
            if (eligibility.canTsumoAgari) {
              // ツモ和了
              setTimeout(() => {
                this.handleAgari(playerId, this.drawnTile, true);
              }, 200); // アニメーション時間待つ
            } else if (eligibility.canAnkan && Math.random() < 1.0) { // 暗槓可能なら100%暗槓
              this.declareAnkan(playerId, eligibility.canAnkan[0]);
            } else if (eligibility.canKakan && Math.random() < 1.0) { // 加槓可能なら100%加槓
              this.declareKakan(playerId, eligibility.canKakan[0]);
            } else {
              // ツモ和了もカンもできない場合は打牌
              const fullHand = [...player.hand, this.drawnTile];
              const tileToDiscard = this._getBestTileToDiscard(player, fullHand);
              const isFromDrawnTile = tileToDiscard.id === this.drawnTile.id;
              this.discardTile(playerId, tileToDiscard.id, isFromDrawnTile);
            }
          }
        }, 1550); // アニメーション時間待つ
      }
    },
    
    /**
     * AIプレイヤーが捨てる牌を決定するためのヘルパー関数。
     * 手牌の状況や直前の鳴きなどを考慮し、最も有利な捨て牌を評価します。
     * @param {Object} player - AIプレイヤーのオブジェクト。
     * @param {Array<Object>} currentFullHand - 現在の手牌（ツモ牌を含む5枚）。
     * @returns {Object} 捨てるべき牌のオブジェクト。
     * @private
     */
    _getBestTileToDiscard(player, currentFullHand) {
      let bestTileToDiscard = null;
      let maxScore = -Infinity; // スコアが高いほど捨てたい牌（マイナス評価が少ないほど良い）

      // 鳴いた牌の情報を取得 (直前の鳴きがあった場合)
      const lastMeld = player.melds.length > 0 ? player.melds[player.melds.length - 1] : null;

      // 手牌の各牌について評価スコアを計算
      for (const tile of currentFullHand) {
        let score = 0; // この牌を捨てた場合の評価スコア
        const tileKey = mahjongLogic.getTileKey(tile);
        const tileCountInHand = currentFullHand.filter(t => mahjongLogic.getTileKey(t) === tileKey).length;

        // 対子や刻子を崩すのはマイナス評価（残す優先度が高い）
        if (tileCountInHand >= 2) {
          score -= 100;
        }
        if (tileCountInHand >= 3) {
          score -= 150;
        }

        // --- 鳴いた後の打牌選択ロジック ---
        if (lastMeld && lastMeld.tiles.length > 0) {
          const calledTile = lastMeld.tiles[0]; // 鳴いた牌の代表

          // 鳴いた牌が字牌の場合
          if (calledTile.suit === 'z') {
            // 捨てる牌が字牌の場合、残す優先度を上げる（捨てにくくする）
            if (tile.suit === 'z') {
              score -= 200;
            }
          } else { // 鳴いた牌が数牌の場合
            const isCalledTileTerminal = (calledTile.rank === 1 || calledTile.rank === 9);

            // 鳴いた牌が1,9牌の場合、他の1,9牌を残す
            if (isCalledTileTerminal) {
              if (tile.suit !== 'z' && (tile.rank === 1 || tile.rank === 9)) {
                score -= 200;
              }
            } else { // 鳴いた牌が中張牌の場合、同じ色の牌を残す
              if (tile.suit === calledTile.suit) {
                score -= 200;
              }
            }
          }
        }
        // --- ここまで ---

        if (tile.suit === mahjongLogic.SUITS.JIHAI) {
          const isWindTile = tile.rank >= mahjongLogic.JIHAI_TYPES.TON && tile.rank <= mahjongLogic.JIHAI_TYPES.PEI;
          const isSangenTile = tile.rank >= mahjongLogic.JIHAI_TYPES.HAKU && tile.rank <= mahjongLogic.JIHAI_TYPES.CHUN;

          if (isWindTile) {
            const otherWindTiles = currentFullHand.filter(t => t.suit === mahjongLogic.SUITS.JIHAI && t.rank >= mahjongLogic.JIHAI_TYPES.TON && t.rank <= mahjongLogic.JIHAI_TYPES.PEI && mahjongLogic.getTileKey(t) !== tileKey);
            if (otherWindTiles.length === 0) {
              score += 80;
            } else {
              score -= 20;
            }
          } else if (isSangenTile) {
            const otherSangenTiles = currentFullHand.filter(t => t.suit === mahjongLogic.SUITS.JIHAI && t.rank >= mahjongLogic.JIHAI_TYPES.HAKU && t.rank <= mahjongLogic.JIHAI_TYPES.CHUN && mahjongLogic.getTileKey(t) !== tileKey);
            if (otherSangenTiles.length === 0) {
              score += 80;
            } else {
              score -= 20;
            }
          } else {
            score += 100;
          }
        } else {
          const suitTiles = currentFullHand.filter(t => t.suit === tile.suit);
          const rank = tile.rank;

          if (suitTiles.length <= 2) {
            score += 80;
          } else if (suitTiles.length <= 4) {
            score += 40;
          }

          let connections = 0;
          for (let i = -2; i <= 2; i++) {
            if (i === 0) continue;
            if (suitTiles.some(t => t.rank === rank + i)) {
              connections++;
            }
          }
          score -= (connections * 10);

          if (rank === 1 && !suitTiles.some(t => t.rank === 2 || t.rank === 3)) {
            score += 25;
          }
          if (rank === 9 && !suitTiles.some(t => t.rank === 7 || t.rank === 8)) {
            score += 25;
          }
          if (rank > 1 && rank < 9 && connections === 0) {
              score += 30;
          }
        }

        if (score > maxScore) {
          maxScore = score;
          bestTileToDiscard = tile;
        }
      }
      return bestTileToDiscard || currentFullHand[Math.floor(Math.random() * currentFullHand.length)];
    },
    // AIプレイヤーの打牌処理
    handleAiDiscard() {
      if (this.gameMode !== 'vsCPU' || this.gamePhase !== GAME_PHASES.AWAITING_DISCARD) {
        return;
      }

      const aiPlayerId = this.currentTurnPlayerId;
      const player = this.players.find(p => p.id === aiPlayerId);

      if (!player || player.id === 'player1') {
        return;
      }

      // 0.5秒後に思考・実行
      setTimeout(() => {
        // ツモ和了可能かチェック (ツモ牌がある場合のみ)
        if (this.drawnTile && this.playerActionEligibility[aiPlayerId]?.canTsumoAgari) {
          this.handleAgari(aiPlayerId, this.drawnTile, true);
          return; // 和了したので打牌はしない
        }

        // AIの手牌とツモ牌を結合 (鳴いた直後でdrawnTileがnullの場合も考慮)
        const fullHand = this.drawnTile ? [...player.hand, this.drawnTile] : [...player.hand];

        if (fullHand.length === 0) {
          console.error(`AI ${aiPlayerId} has no tiles to discard.`);
          return;
        }

        const tileToDiscard = this._getBestTileToDiscard(player, fullHand);
        const isFromDrawnTile = this.drawnTile ? tileToDiscard.id === this.drawnTile.id : false;

        this.discardTile(aiPlayerId, tileToDiscard.id, isFromDrawnTile);
      }, 500);
    },
    // AIプレイヤーの応答処理 (他家の打牌に対して)
    handleAiResponse(aiPlayerId) {

      // 0秒後に思考・実行
      setTimeout(() => {
        // タイムアウト後もまだこのAIの応答待ちか確認
        if (this.activeActionPlayerId === aiPlayerId) {
          const eligibility = this.playerActionEligibility[aiPlayerId];

          // 1. ロン可能かチェック (90%実施)
          if (eligibility?.canRon && Math.random() < 0.9) {
            this.playerDeclaresCall(aiPlayerId, 'ron', null);
            return;
          }

          // 2. 明槓可能かチェック (100%実施)
          if (eligibility?.canMinkan && Math.random() < 1.0) {
            this.playerDeclaresCall(aiPlayerId, 'minkan', eligibility.canMinkan);
            return;
          }

          // 3. ポン可能かチェック (20%実施)
          if (eligibility?.canPon && Math.random() < 0.2) {
            this.playerDeclaresCall(aiPlayerId, 'pon', eligibility.canPon);
            return;
          }

          // どれも宣言しない場合はスキップ
          this.playerSkipsCall(aiPlayerId);
        }
      }, 0);
    },
    startGameFlow() {
      // ゲーム開始時の最初のツモ処理
      if (this.currentTurnPlayerId && this.gamePhase === GAME_PHASES.PLAYER_TURN) {
        this.drawTile();
      }
    },
    applyPointChanges() {
      if (this.agariResultDetails && this.agariResultDetails.pointChanges) {
        for (const playerId in this.agariResultDetails.pointChanges) {
          const player = this.players.find(p => p.id === playerId);
          if (player) {
            player.score += this.agariResultDetails.pointChanges[playerId];
          }
        }
      }
    }
  },
  getters: {
    getPlayerById: (state) => (playerId) => {
      return state.players.find(p => p.id === playerId);
    },
    // 例: 現在のターンプレイヤーオブジェクトを取得
    currentPlayer: (state) => {
      return state.players.find(p => p.id === state.currentTurnPlayerId);
    },
    // ドラ表示牌 (UI表示用)
    revealedDoraIndicators: (state) => {
      return state.doraIndicators;
    },
    // 山牌の残り枚数
    remainingWallTilesCount: (state) => {
      return state.wall.length;
    },
    // 例: 他のプレイヤーの手牌の枚数を取得 (裏向き表示用)
    opponentHandsInfo: (state) => {
      return state.players
        .filter(p => p.id !== 'player1') // 自分以外のプレイヤーを想定 (player1が自分IDの場合)
        .map(p => ({ id: p.id, handSize: p.hand.length }));
    }
  }
});
