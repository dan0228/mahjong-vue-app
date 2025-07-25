import { useAudioStore } from './audioStore';

// src/stores/gameStore.js
import { defineStore } from 'pinia';
import * as mahjongLogic from '@/services/mahjongLogic';

export const GAME_PHASES = {
  WAITING_TO_START: 'waitingToStart',
  PLAYER_TURN: 'playerTurn', // ツモ待ち
  AWAITING_DISCARD: 'awaitingDiscard', // 打牌待ち
  AWAITING_ACTION_RESPONSE: 'awaitingActionResponse', // 他家の打牌に対するロン・ポン・カン待ち
  AWAITING_KAKAN_RESPONSE: 'awaitingKakanResponse', // 加槓に対する槍槓ロン待ち
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
      { id: 'player2', name: 'くろ　', hand: [], discards: [], melds: [], isDealer: false, score: 25000, seatWind: null },
      { id: 'player3', name: 'たま　', hand: [], discards: [], melds: [], isDealer: false, score: 25000, seatWind: null },
      { id: 'player4', name: 'とら　', hand: [], discards: [], melds: [], isDealer: false, score: 25000, seatWind: null }
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
    showDealerDeterminationPopup: false, // 親決め結果ポップアップの表示フラグ
    dealerDeterminationResult: { // 親決め結果の詳細情報
      players: [], // { id, name, seatWind, isDealer } の配列
    },
    catCoins: 9999, // 猫コインの合計 (デバッグ用)
    lastCoinGain: 0, // 直近で得た猫コイン
    isRiichiBgmActive: false, // リーチBGMがアクティブかどうか
    previousBgm: null, // リーチ前のBGMを保持
  }),
  actions: {
    startRiichiBgm() {
      const audioStore = useAudioStore();
      console.log('[gameStore] startRiichiBgm: Current BGM before change:', audioStore.currentBgm);
      this.previousBgm = audioStore.currentBgm; // 現在のBGMを保存
      audioStore.setBgm('NES-JP-A04-2(Stage3-Loop125).mp3'); // リーチBGMに切り替え
      this.isRiichiBgmActive = true;
      console.log('[gameStore] startRiichiBgm: Previous BGM saved:', this.previousBgm, 'New BGM set:', audioStore.currentBgm);
    },
    stopRiichiBgm() {
      const audioStore = useAudioStore();
      console.log('[gameStore] stopRiichiBgm: Previous BGM to restore:', this.previousBgm, 'Current BGM:', audioStore.currentBgm);
      if (this.isRiichiBgmActive) {
        audioStore.setBgm(this.previousBgm); // 元のBGMに戻す
        this.isRiichiBgmActive = false;
        this.previousBgm = null; // リセット
        console.log('[gameStore] stopRiichiBgm: BGM restored to:', audioStore.currentBgm);
      }
    },
    initializeGame() {
      // TODO: ここでmahjongLogicを呼び出し、山牌生成、配牌などを行う
      console.log('gameStore: initializeGame action started');
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
      // ゲームモードに応じて初期設定を変更する場合、ここで this.gameMode を参照できる
      // 例: if (this.gameMode === 'vsCPU') { /* CPUプレイヤーのセットアップ */ }

      // 1. 親の決定と風の割り当て
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
      let fullWall = mahjongLogic.getAllTiles();
      fullWall = mahjongLogic.shuffleWall(fullWall); 

      // 山牌と王牌を分ける
      const deadWallSize = 14; // 四牌麻雀も通常の王牌と同じサイズ
      // 王牌をfullWallの先頭から取得
      this.deadWall = fullWall.slice(0, deadWallSize);
      // 配牌に使用する山牌は、王牌を除いた残り
      const liveWallForDealing = fullWall.slice(deadWallSize);

      // 四牌麻雀の初期手牌枚数
      const initialHandSize = 4; // 初期手牌枚数
      const { hands: initialHands, wall: updatedLiveWall } = mahjongLogic.dealInitialHands(playerCount, liveWallForDealing, initialHandSize);
      this.wall = updatedLiveWall; // 配牌後の山牌でストアを更新

      this.players.forEach((player, index) => {
        player.hand = initialHands[index] || []; // 配牌結果をセット、失敗時は空配列
        player.discards = []; // 捨て牌をリセット
        player.melds = []; // 副露
        player.isRiichi = false; // リーチ状態をリセット
        player.isDeclaringRiichi = false; // リーチ宣言状態もリセット
        player.isDoubleRiichi = false; // ダブルリーチ状態をリセット
        this.isDoujunFuriTen[player.id] = false;
        // player.isIppatsu は isIppatsuChance で管理
      });

      // ドラ表示牌を王牌からめくる
      this.doraIndicators = [mahjongLogic.revealDora(this.deadWall)].filter(Boolean); // nullを除外

      this.currentTurnPlayerId = this.players[this.dealerIndex]?.id; // 親からスタート
      this.gamePhase = GAME_PHASES.PLAYER_TURN; // ゲームフェーズをプレイヤーのターンにする
      console.log(`gameStore: initializeGame finished. Dealer: ${this.players[this.dealerIndex]?.name} (${this.players[this.dealerIndex]?.seatWind}). Player hands:`, this.players.map(p => ({ id: p.id, name: p.name, wind: p.seatWind, hand: p.hand.map(t => t?.id) })), 'Wall size:', this.wall.length, 'DeadWall size:', this.deadWall.length);

      // 新しい局の開始時、またはゲーム初回開始時に、最初のプレイヤー(親)がツモを行う
      

      // 親決め結果をセットし、ポップアップを表示
      this.dealerDeterminationResult.players = this.players.map(p => ({
        id: p.id,
        name: p.name,
        seatWind: p.seatWind,
        isDealer: p.isDealer,
        score: 25000, // 初期点数
      }));
      
    },
    drawTile() {
      // プレイヤーがツモるアクション
      // 自分のターンで、かつ山牌があり、かつゲームフェーズがツモ待ちの時のみ実行
      if (this.wall.length > 0 &&
          this.currentTurnPlayerId && // currentTurnPlayerId が null でないことを確認
          this.gamePhase === GAME_PHASES.PLAYER_TURN) { // gamePhaseのチェックを追加
        const wallSizeBeforeDraw = this.wall.length;
        // 現在のプレイヤーのターン数をインクリメント
        if (this.playerTurnCount[this.currentTurnPlayerId] !== undefined && !this.rinshanKaihouChance) {
          this.playerTurnCount[this.currentTurnPlayerId]++;
        }
        const tile = this.wall.shift(); // 山の先頭からツモる
        console.log(`gameStore: [drawTile] Player ${this.currentTurnPlayerId} is drawing. Tile: ${tile?.id}. Wall before: ${wallSizeBeforeDraw}, Wall after: ${this.wall.length}`);
        this.drawnTile = tile; // ツモった牌をセット
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // プレイヤーの打牌待ち
        console.log(`gameStore: Player ${this.currentTurnPlayerId} drew tile: ${tile?.id}. Phase: ${this.gamePhase}. Wall: ${this.wall.length}`);
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

          // リーチ後の処理
          if (currentPlayer.isRiichi || currentPlayer.isDoubleRiichi) {
            // リーチ後の暗槓は、待ちが変わらない場合のみ可能（というルールが一般的だが、このゲームでは「いかなる形でも可能」）
            const ankanable = this.playerActionEligibility[currentPlayer.id].canAnkan;

            // ツモ和了も暗槓もできなければ、自動でツモ切り
            if (!this.playerActionEligibility[currentPlayer.id].canTsumoAgari && !ankanable) {
              setTimeout(() => {
                // タイムアウト後もまだ自分のターンで、ツモ牌が残っているか確認
                if (this.currentTurnPlayerId === currentPlayer.id && this.drawnTile) {
                  console.log(`gameStore: Riichi auto-discard for ${currentPlayer.id}`);
                  this.discardTile(currentPlayer.id, this.drawnTile.id, true);
                }
              }, 500); // 0.5秒後に自動打牌
            }
          } else {
            // 通常のツモ処理
            let canRiichi = false;
            if (currentPlayer.melds.length === 0 && currentPlayer.score >= 1000) {
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
                if (tempHand.length === 4) {
                  const tenpaiResult = mahjongLogic.checkYonhaiTenpai(tempHand, this.createGameContextForPlayer(currentPlayer, false));
                  if (tenpaiResult.isTenpai && tenpaiResult.waits.length > 0) {
                    canRiichi = true;
                    break;
                  }
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
            // AI対戦モードで、かつ現在のプレイヤーがAIの場合、自動で打牌処理を呼び出す
            if (this.gameMode === 'vsCPU' && currentPlayer.id !== 'player1') {
              this.handleAiDiscard();
            }
          }
        }
      } else {
        if (this.wall.length === 0) {
          console.log('gameStore: No more tiles in the wall. Round ends in a draw (ryuukyoku).');
          this.handleRyuukyoku(); // 流局処理を呼び出す
        } else { // wall.length > 0 だが、他の条件が満たされない場合
          console.warn(`gameStore: Cannot draw tile. Conditions not met. Player: ${this.currentTurnPlayerId}, Phase: ${this.gamePhase}, Wall: ${this.wall.length}`);
          // この場合、ゲームが進行不能になる可能性があるため、エラーハンドリングやリカバリ処理を検討
        }
      }
    },
    discardTile(playerId, tileIdToDiscard, isFromDrawnTile) {
      const audioStore = useAudioStore();
      if (audioStore.isSeEnabled) {
        const audio = new Audio('/assets/sounds/打牌.mp3');
        audio.volume = audioStore.volume;
        audio.play();
      }

      setTimeout(() => {
        const player = this.players.find(p => p.id === playerId);
        if (!player || (this.gamePhase !== GAME_PHASES.AWAITING_DISCARD && this.gamePhase !== GAME_PHASES.AWAITING_RIICHI_DISCARD)) {
          console.warn('gameStore: Cannot discard tile now. Conditions not met.', { playerId: player?.id, phase: this.gamePhase, isFromDrawnTile, drawnTile: this.drawnTile });
          return;
        }

        let discardedTileActual;

        // --- リーチ後の打牌処理 ---
        if (this.gamePhase === GAME_PHASES.AWAITING_RIICHI_DISCARD) {
          // リーチ宣言時の打牌であれば、その牌のIDを保存
          this.riichiDiscardedTileId[playerId] = tileIdToDiscard;
          const fullHand = [...player.hand, this.drawnTile];
          const discardIndex = fullHand.findIndex(t => t && t.id === tileIdToDiscard);

          if (discardIndex === -1) {
            console.error('Riichi discard: Tile to discard not found in hand or drawn tile:', tileIdToDiscard);
            return;
          }

          // テンパイを維持できるかチェックするために、一時的な手牌を作成
          const tempFullHand = [...fullHand];
          const tempDiscardedTile = tempFullHand.splice(discardIndex, 1)[0];
          const handAfterDiscard = tempFullHand;

          const tenpaiCheck = mahjongLogic.checkYonhaiTenpai(handAfterDiscard, this.createGameContextForPlayer(player, false));
          if (!tenpaiCheck.isTenpai) {
            console.warn(`Player ${player.id} tried to discard ${tempDiscardedTile.id} after Riichi, but it breaks Tenpai. Aborting.`);
            return; // テンパイが崩れるので打牌を中止
          }

          // テンパイが維持されるので、打牌を確定させる
          discardedTileActual = tempDiscardedTile;
          player.hand = mahjongLogic.sortHand(handAfterDiscard);
          this.drawnTile = null;
          // リーチBGMを再生
          this.startRiichiBgm();
        } else { // --- 通常の打牌処理 ---
          // リーチ中で、かつまだリーチ宣言牌が横向きになっていない場合
          if ((player.isRiichi || player.isDoubleRiichi) && !this.riichiDiscardedTileId[playerId]) {
            this.riichiDiscardedTileId[playerId] = tileIdToDiscard;
          }
          if (isFromDrawnTile) {
            if (!this.drawnTile || this.drawnTile.id !== tileIdToDiscard) {
              console.error('Mismatch: Trying to discard drawn tile, but IDs do not match or no drawn tile.');
              return;
            }
            discardedTileActual = this.drawnTile;
            this.drawnTile = null;
          } else {
            const tileIndex = player.hand.findIndex(t => t.id === tileIdToDiscard);
            if (tileIndex === -1) {
              console.error('Tile to discard not found in hand:', tileIdToDiscard);
              return;
            }
            discardedTileActual = player.hand.splice(tileIndex, 1)[0];
              if (this.drawnTile) {
                player.hand.push(this.drawnTile); // ツモ牌を手牌に加える
                player.hand = mahjongLogic.sortHand(player.hand); // 手牌をソート
              }
            this.drawnTile = null;
          }
        }

        if (discardedTileActual) {
        player.discards = [...player.discards, discardedTileActual];
      } else {
        console.error("Discard failed: discardedTileActual is undefined. Cannot update discards.");
        return; // 捨て牌が確定しなかったので処理を中断
      }
        this.lastDiscardedTile = discardedTileActual;

        // --- カン成立後の打牌であれば、カンドラをめくる ---
        // ※ このロジックは、どの種類のカン(明槓/暗槓/加槓)の後の打牌でも機能します。
        //    現状、pendingKanDoraRevealフラグは declareMinkan でのみ true になります。
        if (this.pendingKanDoraReveal) {
          console.log("Revealing Kan Dora after discard from Kan.");
          if (this.deadWall.length > 0) {
              const newDoraIndicator = mahjongLogic.revealDora(this.deadWall);
              if (newDoraIndicator && !this.doraIndicators.find(d => d.id === newDoraIndicator.id)) {
                  this.doraIndicators.push(newDoraIndicator);
              }
          }
          this.pendingKanDoraReveal = false; // フラグをリセット
        }

        // 手牌が変わったのでフリテン状態を更新
        this.updateFuriTenState(player.id);

        this.turnCount++; // 総ターン数をインクリメント
        this.lastActionPlayerId = player.id;
        this.rinshanKaihouChance = false; // 打牌したら嶺上開花の権利は消える

        // 自分の打牌で自分の一発チャンスは消える。
        // ただし、リーチ宣言時の打牌では消えない（ここから一発が始まるため）
        if (this.gamePhase !== GAME_PHASES.AWAITING_RIICHI_DISCARD) {
          this.isIppatsuChance[player.id] = false;
        }
        this.isChankanChance = false; // 打牌されたら槍槓のチャンスはなくなる
        // 他のプレイヤーのアクション可能性をチェック
        this.waitingForPlayerResponses = []; // 応答待ちリストを初期化
        let canAnyoneAct = false;
        this.players.forEach(p => {
          if (p.id !== player.id) {
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
            this.playerActionEligibility[p.id] = eligibility;

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
          console.log(`gameStore: Player ${player.id} discarded ${tileIdToDiscard}. Waiting for: ${this.waitingForPlayerResponses.join(', ')}. Active: ${this.activeActionPlayerId}. Eligible:`, JSON.parse(JSON.stringify(this.playerActionEligibility)));
        }
      }, 100);
    },
    moveToNextPlayer() {
      if (this.players.length === 0) return;
      const currentPlayerIndex = this.players.findIndex(p => p.id === this.currentTurnPlayerId);
      const previousPlayerId = this.currentTurnPlayerId; // ログ用に以前のプレイヤーIDを保持
      if (currentPlayerIndex === -1) { // 初期状態など
        this.currentTurnPlayerId = this.players[0].id;
      } else {
        this.currentTurnPlayerId = this.players[(currentPlayerIndex + 1) % this.players.length].id;
      }
      this.gamePhase = GAME_PHASES.PLAYER_TURN; // 次のプレイヤーのターン開始 (ツモ待ち)
      console.log(`gameStore: [moveToNextPlayer] Previous player: ${previousPlayerId}, Next player: ${this.currentTurnPlayerId}, Game phase set to: ${this.gamePhase}`);
      // ターンが移ったので、各種宣言可能フラグをリセット
      this.players.forEach(p => {
        this.canDeclareRon[p.id] = false;
        this.canDeclarePon[p.id] = null;
        this.canDeclareMinkan[p.id] = null;
      });
      this.players.forEach(p => this.canDeclareAnkan[p.id] = null);
      this.players.forEach(p => this.canDeclareKakan[p.id] = null);
      this.drawTile(); 
      this.waitingForPlayerResponses = []; // ターンが移るので応答待ちはクリア
      this.activeActionPlayerId = null; // アクティブな応答者もクリア
    },
    handleRyuukyoku() {
      try {
        this.gamePhase = GAME_PHASES.ROUND_END;
        const dealerPlayer = this.players[this.dealerIndex];

        this.agariResultDetails = {
          roundWind: this.currentRound.wind,
          roundNumber: this.currentRound.number,
          honba: this.honba,
          doraIndicators: [...this.doraIndicators],
          uraDoraIndicators: [],
          winningHand: [],
          agariTile: null,
          yakuList: [],
          totalFans: 0,
          fu: 0,
          score: 0,
          scoreName: null,
          pointChanges: {},
          isDraw: true,
        };

        const tenpaiStates = this.players.map(player => {
          const context = this.createGameContextForPlayer(player, false);
          return {
            id: player.id,
            isTenpai: mahjongLogic.checkYonhaiTenpai(player.hand, context).isTenpai,
          };
        });

        const tenpaiPlayers = tenpaiStates.filter(p => p.isTenpai);
        const notenPlayers = tenpaiStates.filter(p => !p.isTenpai);
        const pointChanges = {};
        this.players.forEach(p => pointChanges[p.id] = 0);

        if (tenpaiPlayers.length > 0 && tenpaiPlayers.length < 4) {
          const totalPayment = 3000;
          let paymentPerNoten = 0;
          let incomePerTenpai = 0;

          if (tenpaiPlayers.length === 1) { paymentPerNoten = 1000; incomePerTenpai = 3000; }
          else if (tenpaiPlayers.length === 2) { paymentPerNoten = 1500; incomePerTenpai = 1500; }
          else if (tenpaiPlayers.length === 3) { paymentPerNoten = 3000; incomePerTenpai = 1000; }

          notenPlayers.forEach(notenPlayer => { pointChanges[notenPlayer.id] -= paymentPerNoten; });
          tenpaiPlayers.forEach(tenpaiPlayer => { pointChanges[tenpaiPlayer.id] += incomePerTenpai; });
        }
        this.agariResultDetails.pointChanges = pointChanges;

        const isDealerTenpai = tenpaiPlayers.some(p => p.id === dealerPlayer.id);
        const rankedPlayers = getRankedPlayers(this.players);
        const dealerRank = rankedPlayers.find(p => p.id === dealerPlayer.id)?.rank;

        const isEast4 = this.currentRound.wind === 'east' && this.currentRound.number === 4;
        const isDealerTop = dealerRank === 1;

        if (isEast4 && isDealerTenpai && isDealerTop) {
          this.resultMessage = `親（${dealerPlayer.name}）がテンパイでトップのため終局`;
          this.honba = 0;
          this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length;
          this.shouldAdvanceRound = true;
          this.shouldEndGameAfterRound = true;
        } else if (isDealerTenpai) {
          this.resultMessage = `親（${dealerPlayer.name}）がテンパイのため連荘`;
          this.honba++;
          this.nextDealerIndex = this.dealerIndex;
          this.shouldAdvanceRound = false;
        } else {
          this.resultMessage = `親（${this.players[this.dealerIndex].name}）がノーテンのため親流れ`;
          this.honba = 0;
          this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length;
          this.shouldAdvanceRound = true;
        }

        if (this.shouldEndGameAfterRound && !(isEast4 && isDealerTenpai && isDealerTop)) {
          const playerBelowZero = this.players.find(p => (p.score + (pointChanges[p.id] || 0)) < 0);
          if (playerBelowZero) {
            this.resultMessage += `\n${playerBelowZero.name} の持ち点が0点未満になったため終局します。`;
          }
        }
      } catch (error) {
        console.error("Error during handleRyuukyoku:", error);
        this.resultMessage = "流局処理中にエラーが発生しました。";
        this.shouldAdvanceRound = true;
        this.nextDealerIndex = (this.dealerIndex + 1) % this.players.length;
      } finally {
        this.stopRiichiBgm();
        this.showResultPopup = true;
        console.log("handleRyuukyoku finished, showResultPopup set to true.");
      }
    },
    prepareNextRound() {
      // 点数反映後に箱下チェックを行う
      const playerBelowZero = this.players.find(p => p.score < 0);
      if (playerBelowZero) {
        console.log(`Player ${playerBelowZero.name} has gone below 0 points (${playerBelowZero.score}). Game ends.`);
        this.shouldEndGameAfterRound = true;
      }

      // dealerIndex を nextDealerIndex で更新
      if (this.nextDealerIndex !== null) {
        this.dealerIndex = this.nextDealerIndex;
        this.nextDealerIndex = null; // 使用後はクリア
      }

      if (this.shouldEndGameAfterRound) {
        this.handleGameEnd();
        return; // ゲーム終了なので、次の局の準備は行わない
      }

      this.showResultPopup = false;
      this.resultMessage = '';
      this.drawnTile = null;
      this.lastDiscardedTile = null;
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
        this.currentRound.number++;
        // isDealerフラグと席風を新しい親に基づいて更新
        this.players.forEach((player, index) => {
          player.isDealer = (index === this.dealerIndex);
        });
        const playersWithNewWinds = mahjongLogic.assignPlayerWinds(
          this.players,
          this.dealerIndex,
          this.players.length
        );
        this.players = playersWithNewWinds;
      }
      this.shouldAdvanceRound = false; // フラグをリセット

      // ゲーム終了条件のチェック (東4局終了)
      // TODO: 誰かが飛んだ場合の終了条件も追加する
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
    setGameMode(mode) {
      this.gameMode = mode; // 'allManual', 'vsCPU', 'online'
      console.log(`gameStore: Game mode set to ${mode}`);
    },
    declareRiichi(playerId) {
      const player = this.players.find(p => p.id === playerId);
      // ダブルリーチ: 自分の最初の捨て牌までで、かつ他家が誰も鳴いていない(turnCountがプレイヤー数未満)
      // リーチ宣言時はツモ牌を持っている状態
      if (!player || player.isRiichi || player.isDoubleRiichi || !this.drawnTile || player.melds.length > 0) {
        console.warn("Cannot declare Riichi now.");
        return;
      }
      // リーチを宣言したことを一時的に記録する
      this.isDeclaringRiichi[playerId] = true;
      console.log(`gameStore: Player ${playerId} is declaring Riichi.`);

      // リーチ宣言後、次の自分のツモまでは一発のチャンス
      this.isIppatsuChance[playerId] = true;
      this.playerActionEligibility[playerId] = {}; // リーチしたので他のアクションはリセット
      // リーチ宣言後、捨てる牌を選択させるフェーズに移行
      this.gamePhase = GAME_PHASES.AWAITING_RIICHI_DISCARD;
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
            discarded = true; // 最初に一致した牌を捨てる
          } else {
            tempHand.push(tile);
          }
        }

        if (tempHand.length !== 4 && discarded) { // 正しく1枚捨てられたが4枚にならなかった場合 (potentialDiscardsの重複など)
            console.warn("Error creating tempHand for Riichi check. Expected 4 tiles, got:", tempHand.length, "Original 5:", currentFullHand.map(t=>t.id), "Discarding:", tileToDiscard.id);
            return false; // このケースは問題があるのでテンパイとしない
        }
        return mahjongLogic.checkYonhaiTenpai(tempHand, this.createGameContextForPlayer(player, false)).isTenpai;
      }).map(tile => tile.id); // IDのリストとして保持
      console.log(`Player ${playerId} declared Riichi. Awaiting discard. Options:`, this.riichiDiscardOptions);
    },

    // プレイヤーが鳴きやロンを見送るアクション
    playerSkipsCall(playerId) {
      if (this.activeActionPlayerId !== playerId) {
        console.warn(`Player ${playerId} cannot skip now. Active player is ${this.activeActionPlayerId}.`);
        return;
      }
      console.log(`gameStore: Player ${playerId} chose to skip.`);

      // ロンを見逃した場合、同巡内フリテンにする
      const player = this.getPlayerById(playerId);
      if (player && this.playerActionEligibility[playerId]?.canRon) {
        // リーチ中のプレイヤーがロンを見逃した場合、永続的なフリテンにする
        if (player.isRiichi || player.isDoubleRiichi) {
          this.isFuriTen[playerId] = true;
          console.log(`Player ${playerId} (Riichi) is now in permanent FuriTen due to Ron skip.`);
        } else {
          // リーチ中でない場合は同巡内フリテン
          this.isDoujunFuriTen[playerId] = true;
          console.log(`Player ${playerId} is now in Doujun FuriTen.`);
        }
      }
      
      this.playerResponses[playerId] = 'skip';
      this.playerActionEligibility[playerId] = {}; // スキップしたのでアクション不可に

      this.setNextActiveResponder(); // 次の応答者をセット
    },
    playerDeclaresCall(playerId, actionType, tile) { // tile はポンやカンの対象牌
      if (this.activeActionPlayerId !== playerId) {
         console.warn(`Player ${playerId} cannot declare ${actionType} now. Active player is ${this.activeActionPlayerId}.`);
         return;
      }

      // ロン宣言の場合、対象の牌はUIから渡されたものではなく、ストアが保持する牌（捨て牌 or 槍槓牌）を正とする
      const tileForAction = actionType === 'ron'
        ? (this.isChankanChance ? this.chankanTile : this.lastDiscardedTile)
        : tile;

      console.log(`gameStore: Player ${playerId} declares ${actionType} with tile ${tileForAction?.id}.`);
      this.playerResponses[playerId] = actionType;
      this.playerActionEligibility[playerId] = {}; // アクション宣言したので他のアクションは不可に

      let priority = 0;
      if (actionType === 'ron') priority = 3;
      else if (actionType === 'minkan') priority = 2;
      else if (actionType === 'pon') priority = 1;

      this.actionResponseQueue.push({ playerId, actionType, tile: tileForAction, priority });

      // ロンが宣言されても、他のプレイヤーのロン宣言（ダブロン/トリロン）を待つため、すぐには処理しない。
      // 次の応答者に移る。
      this.setNextActiveResponder();
    },
    setNextActiveResponder() {
      const discarderIndex = this.players.findIndex(p => p.id === this.lastActionPlayerId);
      if (discarderIndex === -1) { this.activeActionPlayerId = null; return; }

      // 捨て牌プレイヤーの次のプレイヤーから順番にチェック
      for (let i = 1; i < this.players.length; i++) {
        const checkIndex = (discarderIndex + i) % this.players.length;
        const checkPlayerId = this.players[checkIndex].id;

        // 応答待ちリストに含まれていて、まだ応答していないプレイヤーか
        if (this.waitingForPlayerResponses.includes(checkPlayerId) && !this.playerResponses[checkPlayerId]) {
          this.activeActionPlayerId = checkPlayerId;
          console.log(`[setNextActiveResponder] Next active responder is ${checkPlayerId}`);

          // ねこAI対戦モードで、応答者がAIの場合、自動で応答処理を呼び出す
          if (this.gameMode === 'vsCPU' && checkPlayerId !== 'player1') {
            this.handleAiResponse(checkPlayerId);
          }

          return; // 見つかったら終了
        }
      }

      // 全員応答済み or 応答待ちがいない
      this.activeActionPlayerId = null;
      console.log('[setNextActiveResponder] No more active responders. Processing actions.');
      // 全員応答済みならアクション処理へ
      this.processPendingActions();
    },
    _finalizeRiichi(playerId) {
      const player = this.players.find(p => p.id === playerId);
      if (!player || !this.isDeclaringRiichi[playerId]) return;

      console.log(`Riichi by ${player.id} is successful.`);

      // ダブルリーチか判定
      if (this.playerTurnCount[player.id] === 1 && this.turnCount < this.players.length) {
        player.isDoubleRiichi = true;
      } else {
        player.isRiichi = true;
      }
      this.isDeclaringRiichi[playerId] = false; // 一時フラグをクリア

      player.score -= 1000;
      this.riichiSticks++;
    },
    processPendingActions() {
      console.log("gameStore: All players responded or Kakan response period ended. Processing actions:", JSON.parse(JSON.stringify(this.actionResponseQueue)));

      if (this.gamePhase === GAME_PHASES.AWAITING_KAKAN_RESPONSE) {
        // 槍槓の処理
        const ronAction = this.actionResponseQueue.find(a => a.actionType === 'ron' && a.tile?.id === this.chankanTile?.id);
        if (ronAction) {
          console.log(`gameStore: Processing Chankan Ron by ${ronAction.playerId}`);
          this.handleAgari(ronAction.playerId, this.chankanTile, false, this.currentTurnPlayerId);
        } else {
          // 槍槓されなかった場合
          console.log("gameStore: No Chankan. Proceeding with Rinshan draw for Kakan player.");
          this.drawRinshanAfterKakan(this.currentTurnPlayerId);
        }
      } else if (this.gamePhase === GAME_PHASES.AWAITING_ACTION_RESPONSE) {
        // --- リーチ成立判定 ---
        const discarder = this.players.find(p => p.id === this.lastActionPlayerId);
        if (discarder && this.isDeclaringRiichi[discarder.id]) {
          const hasRon = this.actionResponseQueue.some(a => a.actionType === 'ron');
          if (hasRon) {
            // ロンされたのでリーチは不成立
            console.log(`Riichi by ${discarder.id} was aborted due to Ron call.`);
            this.isDeclaringRiichi[discarder.id] = false;
          } else {
            // ロンされなかったのでリーチ成立
            this._finalizeRiichi(discarder.id);
          }
        }
        // 通常の打牌に対するアクション処理
        if (this.actionResponseQueue.length > 0) {
          this.actionResponseQueue.sort((a, b) => b.priority - a.priority);
          const highestPriorityAction = this.actionResponseQueue[0];

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
            console.log(`gameStore: Processing Ron by ${winningRonAction.playerId} (Atama-hane applied if multiple Ron declarations)`);
            this.handleAgari(winningRonAction.playerId, this.lastDiscardedTile, false, this.lastActionPlayerId);
          } else if (highestPriorityAction.actionType === 'minkan') {
            console.log(`gameStore: Processing Minkan by ${highestPriorityAction.playerId}`);
            this.declareMinkan(highestPriorityAction.playerId, this.lastActionPlayerId, highestPriorityAction.tile);
          } else if (highestPriorityAction.actionType === 'pon') {
            console.log(`gameStore: Processing Pon by ${highestPriorityAction.playerId}`);
            this.declarePon(highestPriorityAction.playerId, this.lastActionPlayerId, highestPriorityAction.tile);
          }
        } else {
          // アクションが何も宣言されなかった場合のみ次のプレイヤーへ
          if (this.actionResponseQueue.length === 0) {
            console.log("gameStore: No actions declared. Moving to next player.");
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
    // ポン宣言
    declarePon(playerId, targetPlayerId, tileToPon) {
      const player = this.players.find(p => p.id === playerId);
      const targetPlayer = this.players.find(p => p.id === targetPlayerId);
      if (!player || !targetPlayer || !this.lastDiscardedTile || mahjongLogic.getTileKey(this.lastDiscardedTile) !== mahjongLogic.getTileKey(tileToPon)) {
        console.error("Pon declaration invalid.");
        return;
      }
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

      console.log(`gameStore: Player ${playerId} declares Pon on ${tileToPon.id} from ${targetPlayerId}`);
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
      if ((currentPlayerIndex + 1) % this.players.length === targetPlayerIndex) { // 下家
        takenTileRelativePosition = 'right';
      } else if ((currentPlayerIndex + 2) % this.players.length === targetPlayerIndex) { // 対面
        takenTileRelativePosition = 'middle';
      } else if ((currentPlayerIndex + 3) % this.players.length === targetPlayerIndex) { // 上家
        takenTileRelativePosition = 'left';
      }

      player.melds.push({ type: 'pon', tiles: [tileToPon, tileToPon, tileToPon], from: targetPlayerId, takenTileRelativePosition: takenTileRelativePosition }); // 鳴いた牌も含む
      // 手牌が変わったのでフリテン状態を更新
      this.updateFuriTenState(playerId);
      
      this.currentTurnPlayerId = playerId; // ポンしたプレイヤーのターン
      this.playerActionEligibility[playerId] = {}; // ポンしたのでアクションリセット
      this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌待ち
      this.drawnTile = null; // ポンなのでツモ牌はない
      this.lastDiscardedTile = null; // 他家の捨て牌は消費された
      this.rinshanKaihouChance = false; // ポンでは嶺上開花なし
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false); // 鳴きが入ったので同巡フリテンは解除
      this.players.forEach(p => this.isIppatsuChance[p.id] = false); // 鳴きが入ったので一発は消える
      this.isChankanChance = false;
      this.players.forEach(p => { // 他のプレイヤーのアクション機会をリセット
        this.playerActionEligibility[p.id] = {};
      });
      this.lastActionPlayerId = playerId;
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      if (this.turnCount < this.players.length) { // 最初の1巡以内か
        this.anyPlayerMeldInFirstRound = true;
      }
    },
    // 明カン宣言
    declareMinkan(playerId, targetPlayerId, tileToKan) {
      const player = this.players.find(p => p.id === playerId);
      const targetPlayer = this.players.find(p => p.id === targetPlayerId);
      if (!player || !targetPlayer || !this.lastDiscardedTile || mahjongLogic.getTileKey(this.lastDiscardedTile) !== mahjongLogic.getTileKey(tileToKan)) {
        console.error("Minkan declaration invalid: No valid tile to kan from discard.");
        return;
      }
      const canMinkan = mahjongLogic.checkCanMinkan(player.hand, this.lastDiscardedTile);
      if (!canMinkan) {
        console.error("Cannot declare Minkan. Conditions not met.");
        return;
      }
      console.log(`gameStore: Player ${playerId} declares Minkan on ${tileToKan.id} from ${targetPlayerId}`);
      // カンされた牌を捨て牌から削除
      targetPlayer.discards.pop();

      // 鳴かれた牌がリーチ宣言牌であれば、そのプレイヤーのリーチ宣言牌IDをリセット
      if (this.riichiDiscardedTileId[targetPlayer.id] === tileToKan.id) {
        this.riichiDiscardedTileId[targetPlayer.id] = null;
      }

      // 手牌から3枚取り除く
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
      if ((currentPlayerIndex + 1) % this.players.length === targetPlayerIndex) { // 下家
        takenTileRelativePosition = 'right';
      } else if ((currentPlayerIndex + 2) % this.players.length === targetPlayerIndex) { // 対面
        takenTileRelativePosition = 'middle';
      } else if ((currentPlayerIndex + 3) % this.players.length === targetPlayerIndex) { // 上家
        takenTileRelativePosition = 'left';
      }

      player.melds.push({ type: 'minkan', tiles: [tileToKan, tileToKan, tileToKan, tileToKan], from: targetPlayerId, takenTileRelativePosition: takenTileRelativePosition });
      
      this.currentTurnPlayerId = playerId;
      this.lastDiscardedTile = null;
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false); // 鳴きが入ったので同巡フリテンは解除
      this.players.forEach(p => this.isIppatsuChance[p.id] = false);
      this.isChankanChance = false;
      this.players.forEach(p => {
        this.playerActionEligibility[p.id] = {};
      });
      this.lastActionPlayerId = playerId;
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      if (this.turnCount < this.players.length) {
        this.anyPlayerMeldInFirstRound = true;
      }
      // 嶺上牌をツモる
      if (this.deadWall.length > 0) {
        this.drawnTile = mahjongLogic.drawRinshanTile(this.deadWall); // 修正: mahjongLogicから呼び出し
        this.rinshanKaihouChance = true;
        this.pendingKanDoraReveal = true; // 打牌後にドラをめくるフラグを立てる
        this._handlePostRinshanDraw(playerId);
        console.log(`gameStore: Player ${playerId} drew Rinshan tile: ${this.drawnTile?.id}. Pending Kan Dora reveal.`);
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD;
      } else {
        console.warn("Cannot draw Rinshan tile, dead wall is empty.");
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌は必要
      }
    },
    // 暗カン宣言
    declareAnkan(playerId, tileToAnkan) {
      const player = this.players.find(p => p.id === playerId);
      if (!player || !tileToAnkan) {
        console.error("Ankan declaration invalid. Player or tile not found.");
        return;
      }
      console.log(`gameStore: Player ${playerId} declares Ankan with ${tileToAnkan.id}`);
      const ankanKey = mahjongLogic.getTileKey(tileToAnkan);
      const drawnTileKey = this.drawnTile ? mahjongLogic.getTileKey(this.drawnTile) : null;
      const isFromDrawn = ankanKey === drawnTileKey;

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
      player.melds.push({ type: 'ankan', tiles: [tileToAnkan, tileToAnkan, tileToAnkan, tileToAnkan], from: playerId, takenTileRelativePosition: null });
      // ツモ牌でカンした場合は、ツモ牌を消費する
      if (isFromDrawn) {
          this.drawnTile = null;
      }

      // 手牌が変わったのでフリテン状態を更新
      this.updateFuriTenState(playerId);
      // 鳴き（暗槓含む）が入ったので、全プレイヤーの同巡フリテンは解除
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false);

      this.isChankanChance = false;
      this.players.forEach(p => {
        this.canDeclareRon[p.id] = false;
        this.canDeclarePon[p.id] = null;
        this.canDeclareMinkan[p.id] = null;
      });
      this.lastActionPlayerId = playerId;
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      // 嶺上牌をツモる
      if (this.deadWall.length > 0) {
        this.drawnTile = mahjongLogic.drawRinshanTile(this.deadWall); // 修正: mahjongLogicから呼び出し
        this.rinshanKaihouChance = true;
        console.log(`gameStore: Player ${playerId} drew Rinshan tile: ${this.drawnTile?.id}`);
        if (this.deadWall.length > 0) {
            const newDoraIndicator = mahjongLogic.revealDora(this.deadWall);
            if (newDoraIndicator && !this.doraIndicators.find(d => d.id === newDoraIndicator.id)) this.doraIndicators.push(newDoraIndicator);
        }
        this._handlePostRinshanDraw(playerId);
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD;
      } else {
        console.warn("Cannot draw Rinshan tile, dead wall is empty.");
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD;
      }
    },
    // 加カン宣言
    declareKakan(playerId, tileToKakan) {
      const player = this.players.find(p => p.id === playerId);
      // リーチ後は加槓できない
      if (player && (player.isRiichi || player.isDoubleRiichi)) {
        console.warn(`Player ${playerId} is in Riichi and cannot declare Kakan.`);
        return;
      }
      if (!player || !tileToKakan) {
        console.error("Kakan declaration invalid. Player or tile not found.");
        return;
      }
      console.log(`gameStore: Player ${playerId} declares Kakan with ${tileToKakan.id}`);
      // 既存のポンをカンに更新
      const ponMeldIndex = player.melds.findIndex(m => m.type === 'pon' && mahjongLogic.getTileKey(m.tiles[0]) === mahjongLogic.getTileKey(tileToKakan));
      if (ponMeldIndex === -1) {
        console.error("Kakan failed: Corresponding Pon meld not found.");
        return;
      }
      player.melds[ponMeldIndex].type = 'kakan'; // または 'chakan'
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
      this.chankanTile = tileToKakan;
      this.waitingForPlayerResponses = []; // 槍槓応答待ちリストを初期化
      this.playerResponses = {}; // 応答状態をリセット
      this.players.forEach(p => {
        if (p.id !== playerId) {
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
      this.lastActionPlayerId = playerId;

      // 鳴き（加槓含む）が入ったので、全プレイヤーの同巡フリテンは解除
      this.players.forEach(p => this.isDoujunFuriTen[p.id] = false);
      this.players.forEach(p => this.isIppatsuChance[p.id] = false); // 加カンは一発を消す
      if (this.playerTurnCount[playerId] !== undefined) {
        this.playerTurnCount[playerId]++;
      }
      if (this.turnCount < this.players.length) {
        this.anyPlayerMeldInFirstRound = true;
      }
      // 常に他プレイヤーの応答待ちフェーズに入り、次の応答者を設定する
      // 応答待ちリストが空の場合、setNextActiveResponderは最終的にprocessPendingActionsを呼び出し、
      // そこで嶺上牌がツモられる
      this.gamePhase = GAME_PHASES.AWAITING_KAKAN_RESPONSE;
      this.setNextActiveResponder();
      console.log(`gameStore: Player ${playerId} declared Kakan. Checking for Chankan response from: ${this.waitingForPlayerResponses.join(', ') || 'no one'}.`);
    },
    
    // 加カン後、槍槓されなかった場合に嶺上牌をツモるアクション
    drawRinshanAfterKakan(playerId) {
      if (this.currentTurnPlayerId !== playerId || this.gamePhase !== GAME_PHASES.AWAITING_KAKAN_RESPONSE) { // AWAITING_ACTION_RESPONSE は不要
        // 槍槓されなかったことが確認されてからこのアクションを呼ぶ
        // (例: 他の全プレイヤーがスキップした、またはロンの有効時間が過ぎた)
        console.warn("Cannot draw rinshan tile now for Kakan.");
        return;
      }
      // このアクションは processPendingActions から呼ばれる想定 (槍槓ロンがなかった場合)
      // なので、isChankanChance や他プレイヤーの eligibility は processPendingActions でリセット済みのはず

      // drawRinshanAfterKakan が呼ばれるのは槍槓ロンがなかった場合なので、
      // isChankanChance と chankanTile は processPendingActions でリセットされるべき。
      // ここでは、カンしたプレイヤー以外の eligibility をクリアする。
      this.players.forEach(p => {
        if (p.id !== playerId) {
            this.playerActionEligibility[p.id] = {};
            this.playerResponses[p.id] = undefined; // 応答状態もクリア
        }
      });
      if (this.deadWall.length > 0) {
        this.drawnTile = mahjongLogic.drawRinshanTile(this.deadWall); // 修正: mahjongLogicから呼び出し
        this.rinshanKaihouChance = true;
        this.pendingKanDoraReveal = true; // 打牌後にドラをめくるフラグを立てる
        this._handlePostRinshanDraw(playerId);
        console.log(`gameStore: Player ${playerId} drew Rinshan tile after Kakan: ${this.drawnTile?.id}. Pending Kan Dora reveal.`);
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD;
      } else {
        console.warn("Cannot draw Rinshan tile, dead wall is empty.");
        this.gamePhase = GAME_PHASES.AWAITING_DISCARD; // 打牌は必要
      }
    },
    handleAgari(agariPlayerId, agariTile, isTsumo, ronTargetPlayerId = null) {
      this.actionResponseQueue = []; // 和了が発生したので他のアクションは無効
      const player = this.players.find(p => p.id === agariPlayerId);
      if (!player) {
        console.error(`[handleAgari] Player not found: ${agariPlayerId}`);
        return;
      }

      // --- 裏ドラ判定 ---
      if (player.isRiichi || player.isDoubleRiichi) {
        this.uraDoraIndicators = mahjongLogic.getUraDoraIndicators(this.deadWall, this.doraIndicators);
        console.log('[handleAgari] Revealed Ura-Dora indicators:', this.uraDoraIndicators.map(t => t?.id));
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
        // チョンボの場合の点数計算
        if (winResult.isChombo) {
          console.log(`[handleAgari] ${player.name} が役なしチョンボ！`);
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
            winningHand: [],
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
          this.resultMessage += `
チョンボのため、親は流れず、1本場となります.`;
          this.honba++;
          this.nextDealerIndex = this.dealerIndex; // 親は継続
          this.shouldAdvanceRound = false; // 局は進めない

          setTimeout(() => {
            this.showResultPopup = true;
            this.stopRiichiBgm();
          }, 1000);
          return;
        }

        // 通常の和了処理
        // 和了アニメーションの状態を即座に設定
        this.animationState = { type: isTsumo ? 'tsumo' : 'ron', playerId: agariPlayerId };

        console.log(`[handleAgari] ${player.name} が和了しました！`, winResult);

        const pointChanges = {};
        this.players.forEach(p => pointChanges[p.id] = 0);
        if (isTsumo) {
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
          // ロン和了の場合
          pointChanges[ronTargetPlayerId] = -winResult.score;
          pointChanges[agariPlayerId] = winResult.score;
        }
        
        // 供託リーチ棒の処理
        pointChanges[agariPlayerId] += this.riichiSticks * 1000;

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
        // アニメーション表示から1秒後にリザルトポップアップを表示
        setTimeout(() => {
          this.showResultPopup = true;
          this.stopRiichiBgm(); // リザルトポップアップ表示時にBGMを元に戻す
        }, 1000);
        
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
        console.log(`[handleAgari] ${player.name} の和了宣言は役がありませんでした。または和了形ではありません。`);
        // チョンボ処理など
      }
    },
    handleGameEnd() {
      this.gamePhase = GAME_PHASES.GAME_OVER;
      console.log('gameStore: Game has ended.');
      // プレイヤーをランク付け
      const rankedPlayers = getRankedPlayers(this.players);

      // 全操作モードでない場合のみ連勝数を更新
      if (this.gameMode !== 'allManual') {
        // ユーザープレイヤー ('player1') が1位か判定し、連勝数を更新
        const myPlayerRank = rankedPlayers.find(p => p.id === 'player1')?.rank;
        if (myPlayerRank === 1) {
          this.finalResultDetails.consecutiveWins++; // 1位なら連勝数をインクリメント
        } else {
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
      this.updateCatCoins();
      this.showFinalResultPopup = true;
    },
    returnToTitle() {
      console.log('gameStore: Returning to title.');
      this.showFinalResultPopup = false;
      this.resetGameForNewSession(); // ゲーム状態を完全にリセット
      // ここでVue Routerなどを使ってタイトル画面へ遷移する処理を呼び出す (UI側で実装)
    },
    // 新しいゲームセッションのために状態をリセットするアクション
    resetGameForNewSession(options = { keepStreak: false }) {
      console.log('gameStore: Resetting game state for new session.');
      const wins = options.keepStreak ? this.finalResultDetails.consecutiveWins : 0;

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
      this.currentRound = { wind: 'east', number: 1 };
      this.honba = 0;
      this.riichiSticks = 0;
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
        this.isDeclaringRiichi[p.id] = false;
        this.activeActionPlayerId = null;
      });
      this.shouldEndGameAfterRound = false; // タイトルに戻るのでリセット
      this.animationState = { type: null, playerId: null }; // アニメーション状態をリセット
      this.pendingKanDoraReveal = false; // フラグをリセット
      // isInitialized フラグなどがあればそれもリセット
    },
    // フリテン状態を更新するヘルパーアクション
    updateFuriTenState(playerId) {
      const player = this.players.find(p => p.id === playerId);
      if (!player) {
        this.isFuriTen[playerId] = false;
        return;
      }

      // リーチ中のプレイヤーが既に永続フリテンの場合、状態を維持し、再計算しない
      if ((player.isRiichi || player.isDoubleRiichi) && this.isFuriTen[playerId] === true) {
        return;
      }

      const tenpaiResult = mahjongLogic.checkYonhaiTenpai(player.hand, this.createGameContextForPlayer(player, false));
      if (!tenpaiResult.isTenpai) {
        this.isFuriTen[playerId] = false;
        return;
      }

      const waitingTileKeys = new Set(tenpaiResult.waits.map(mahjongLogic.getTileKey));
      const discardTileKeys = new Set(player.discards.map(mahjongLogic.getTileKey));

      const isFuriten = [...waitingTileKeys].some(waitKey => discardTileKeys.has(waitKey));
      this.isFuriTen[playerId] = isFuriten;
      if (isFuriten) console.log(`Player ${playerId} is now in FuriTen.`);
    },
    // 役判定やアクション判定のためのゲームコンテキストを生成するヘルパー
    createGameContextForPlayer(player, isTsumo, agariTile = null) {
      if (!player) return null;
      return {
          playerWind: player.seatWind,
          roundWind: this.currentRound.wind === 'east' ? mahjongLogic.PLAYER_WINDS.EAST : mahjongLogic.PLAYER_WINDS.SOUTH,
          doraIndicators: this.doraIndicators,
          uraDoraIndicators: (player.isRiichi || player.isDoubleRiichi) ? this.uraDoraIndicators : [],
          turnCount: this.turnCount,
          playerTurnCount: this.playerTurnCount[player.id],
          isRiichi: player.isRiichi,
          isDoubleRiichi: player.isDoubleRiichi,
          isIppatsu: this.isIppatsuChance[player.id],
          isHaitei: isTsumo && this.wall.length === 0 && !this.rinshanKaihouChance,
          isHoutei: !isTsumo && this.wall.length === 0 && agariTile && this.lastDiscardedTile && agariTile.id === this.lastDiscardedTile.id,
          isChankan: this.isChankanChance && agariTile && this.chankanTile && agariTile.id === this.chankanTile.id,
          isTenho: player.isDealer && (this.playerTurnCount[player.id] || 0) === 1 && isTsumo && this.turnCount === 0 && (player.melds || []).length === 0, // 自身の鳴きなし
          isChiho: !player.isDealer && (this.playerTurnCount[player.id] || 0) === 1 && isTsumo && this.turnCount < this.players.length && !this.anyPlayerMeldInFirstRound,
          isRenho: !player.isDealer && !isTsumo && (this.playerTurnCount[player.id] || 0) === 0 && this.turnCount < this.players.length && !this.anyPlayerMeldInFirstRound,
          melds: player.melds,
          isParent: player.isDealer,
          remainingTilesCount: this.wall.length,
          currentPlayerTurnCount: this.playerTurnCount[player.id] || 0 // 現在のプレイヤーのツモ回数を追加
      };
    }
    ,
    loadCatCoins() {
      const coins = localStorage.getItem('mahjongCatCoins');
      this.catCoins = coins ? parseInt(coins, 10) : 9999; // デバッグ用: ローカルストレージにない場合は9999
    },
    updateCatCoins() {
      const player1 = this.players.find(p => p.id === 'player1');
      if (player1) {
        const gain = Math.floor(player1.score / 500);
        this.lastCoinGain = gain;
        this.catCoins = Math.min(9999, this.catCoins + gain);
        localStorage.setItem('mahjongCatCoins', this.catCoins.toString());
      }
    },
    deductCatCoins(amount) {
      if (this.catCoins >= amount) {
        this.catCoins -= amount;
        localStorage.setItem('mahjongCatCoins', this.catCoins.toString());
        return true;
      }
      return false;
    },
    _handlePostRinshanDraw(playerId) {
      const player = this.players.find(p => p.id === playerId);
      if (!player || !this.drawnTile) return;

      // 鳴きが入ったので、全プレイヤーの一発は消える
      this.players.forEach(p => this.isIppatsuChance[p.id] = false);

      const eligibility = {}; // ここでeligibilityを定義

      // ツモ和了可能かチェック (嶺上開花)
      const gameContextForTsumo = this.createGameContextForPlayer(player, true);
      const tsumoWinResult = mahjongLogic.checkYonhaiWin([...player.hand, this.drawnTile], this.drawnTile, true, gameContextForTsumo);
      eligibility.canTsumoAgari = tsumoWinResult.isWin;

      // リーチ中でなければ、さらにカンができるかチェック
      if (!player.isRiichi && !player.isDoubleRiichi) {
          // 海底牌では暗槓・加槓はできない
          if (this.wall.length > 0) {
              const ankanOptions = mahjongLogic.checkCanAnkan(player.hand, this.drawnTile);
              eligibility.canAnkan = ankanOptions.length > 0 ? ankanOptions : null;

              const kakanOptions = mahjongLogic.checkCanKakan(player.hand, player.melds, this.drawnTile);
              eligibility.canKakan = kakanOptions.length > 0 ? kakanOptions : null;
          }
      }
      
      this.playerActionEligibility[playerId] = eligibility;
      this.canDeclareAnkan[playerId] = eligibility.canAnkan; // 古いstateも更新
      this.canDeclareKakan[playerId] = eligibility.canKakan; // 古いstateも更新

      // AI対戦モードで、かつ現在のプレイヤーがAIの場合、自動で打牌処理を呼び出す
      if (this.gameMode === 'vsCPU' && player.id !== 'player1') {
          // ツモ和了もできず、カンもできない場合、自動で打牌
          if (!eligibility.canTsumoAgari && !eligibility.canAnkan && !eligibility.canKakan) {
            const fullHand = [...player.hand, this.drawnTile];
            const tileToDiscard = fullHand[Math.floor(Math.random() * fullHand.length)];
            const isFromDrawnTile = tileToDiscard.id === this.drawnTile.id;
            console.log(`AI ${player.id} auto-discarding after Rinshan draw: ${tileToDiscard.id}`);
            this.discardTile(player.id, tileToDiscard.id, isFromDrawnTile);
          }
      }
    }
    ,
    // AIプレイヤーの打牌処理
    handleAiDiscard() {
      if (this.gameMode !== 'vsCPU' || this.gamePhase !== GAME_PHASES.AWAITING_DISCARD) {
        return;
      }

      const aiPlayerId = this.currentTurnPlayerId;
      const player = this.players.find(p => p.id === aiPlayerId);

      // プレイヤーが 'player1' (人間) の場合は何もしない
      if (!player || player.id === 'player1') {
        return;
      }

      console.log(`AI turn for ${aiPlayerId}. Thinking...`);

      // 0.5秒後に思考・実行
      setTimeout(() => {
        // ツモ和了可能かチェック
        if (this.playerActionEligibility[aiPlayerId]?.canTsumoAgari) {
          console.log(`AI ${aiPlayerId} declares Tsumo!`);
          this.handleAgari(aiPlayerId, this.drawnTile, true);
          return; // 和了したので打牌はしない
        }

        // ツモ牌がない場合は打牌できない（ありえないはずだが念のため）
        if (!this.drawnTile) return;

        // AIの手牌とツモ牌を結合
        const fullHand = [...player.hand, this.drawnTile];

        // ランダムに捨てる牌を選択
        const tileToDiscard = fullHand[Math.floor(Math.random() * fullHand.length)];
        const isFromDrawnTile = tileToDiscard.id === this.drawnTile.id;

        console.log(`AI ${aiPlayerId} decided to discard ${tileToDiscard.id}`);
        this.discardTile(aiPlayerId, tileToDiscard.id, isFromDrawnTile);
      }, 500);
    },
    // AIプレイヤーの応答処理 (他家の打牌に対して)
    handleAiResponse(aiPlayerId) {
      console.log(`AI ${aiPlayerId} is responding...`);

      // 0秒後に思考・実行
      setTimeout(() => {
        // タイムアウト後もまだこのAIの応答待ちか確認
        if (this.activeActionPlayerId === aiPlayerId) {
          // ロン可能かチェック
          if (this.playerActionEligibility[aiPlayerId]?.canRon) {
            console.log(`AI ${aiPlayerId} declares Ron!`);
            // playerDeclaresCall は内部で応答待ちを進めるので、直接呼び出す
            this.playerDeclaresCall(aiPlayerId, 'ron', null); // tileは内部で解決される
          } else {
            // ポン・カンはしない想定なので、それ以外はスキップ
            console.log(`AI ${aiPlayerId} chooses to skip.`);
            this.playerSkipsCall(aiPlayerId);
          }
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
        // 供託リーチ棒をリセット
        if (Object.values(this.agariResultDetails.pointChanges).some(v => v > 0)) {
            this.riichiSticks = 0;
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
