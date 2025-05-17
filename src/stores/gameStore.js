// src/stores/gameStore.js
import { defineStore } from 'pinia';
import * as mahjongLogic from '@/services/mahjongLogic';

export const useGameStore = defineStore('game', {
  state: () => ({
    players: [
      { id: 'player1', name: '自分', hand: [], discards: [], melds: [], isDealer: true, score: 25000 },
      { id: 'player2', name: '上家', hand: [], discards: [], melds: [], isDealer: false, score: 25000 },
      { id: 'player3', name: '対面', hand: [], discards: [], melds: [], isDealer: false, score: 25000 },
      { id: 'player4', name: '下家', hand: [], discards: [], melds: [], isDealer: false, score: 25000 }
    ],
    wall: [], // 山牌
    deadWall: [], // 王牌 (嶺上牌、ドラ表示牌など)
    doraIndicators: [], // ドラ表示牌 (めくれているもの)
    uraDoraIndicators: [], // 裏ドラ表示牌 (リーチ和了時のみ)
    currentTurnPlayerId: null, // 現在のターンプレイヤーID
    gamePhase: 'waitingToStart', // ゲームの進行状況
    lastDiscardedTile: null, // 直前に捨てられた牌
    drawnTile: null, // 現在のプレイヤーがツモった牌 (手牌に加える前)
    currentRound: { wind: 'east', number: 1 }, // 例: 東1局
    honba: 0, // 本場
    riichiSticks: 0, // 供託リーチ棒
    gameMode: 'allManual', // 'allManual', 'vsCPU', 'online'
  }),
  getters: {
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
    // myPlayer getter は全操作モードでは役割が変わるため、一旦コメントアウトまたは削除を検討。
    // UI側で currentPlayer を操作対象として扱う。
    // 例: 他のプレイヤーの手牌の枚数を取得 (裏向き表示用)
    opponentHandsInfo: (state) => {
      return state.players
        .filter(p => p.id !== 'player1') // 自分以外のプレイヤー
        .map(p => ({ id: p.id, handSize: p.hand.length }));
    }
  },
  actions: {
    initializeGame() {
      // TODO: ここでmahjongLogicを呼び出し、山牌生成、配牌などを行う
      console.log('gameStore: initializeGame action started');
      // ゲームモードに応じて初期設定を変更する場合、ここで this.gameMode を参照できる
      // 例: if (this.gameMode === 'vsCPU') { /* CPUプレイヤーのセットアップ */ }

      let fullWall = mahjongLogic.getAllTiles();
      fullWall = mahjongLogic.shuffleWall(fullWall); 

      // 山牌と王牌を分ける
      const deadWallSize = 14;
      // 王牌をfullWallの先頭から取得
      this.deadWall = fullWall.slice(0, deadWallSize);
      // 配牌に使用する山牌は、王牌を除いた残り
      const liveWallForDealing = fullWall.slice(deadWallSize);

      // mahjongLogic.dealInitialHands は手牌と更新された山牌を返すと仮定
      const { hands: initialHands, wall: updatedLiveWall } = mahjongLogic.dealInitialHands(this.players.length, liveWallForDealing, 4);
      this.wall = updatedLiveWall; // 配牌後の山牌でストアを更新

      this.players.forEach((player, index) => {
        player.hand = initialHands[index] || []; // 配牌結果をセット、失敗時は空配列
        player.discards = []; // 捨て牌をリセット
        player.melds = []; // 副露
        // player.score = 25000; // スコアは初期化時に設定済み
        // 必要であれば、他のラウンド毎のプレイヤー状態もリセット (例: リーチ状態)
      });

      // ドラ表示牌を王牌からめくる
      this.doraIndicators = [mahjongLogic.revealDora(this.deadWall)].filter(Boolean); // nullを除外

      this.currentTurnPlayerId = this.players.find(p => p.isDealer)?.id || this.players[0]?.id; // 親または最初のプレイヤー
      this.gamePhase = 'playerTurn'; // ゲームフェーズをプレイヤーのターンにする
      console.log('gameStore: initializeGame action finished. Player hands:', this.players.map(p => ({ id: p.id, hand: p.hand.map(t => t?.id) })), 'Wall size:', this.wall.length, 'DeadWall size:', this.deadWall.length);
    },
    drawTile() {
      // プレイヤーがツモるアクション
      // 自分のターンで、かつ山牌があり、かつゲームフェーズがツモ待ちの時のみ実行
      if (this.wall.length > 0 &&
          this.currentTurnPlayerId &&
          this.gamePhase === 'playerTurn') { // gamePhaseのチェックを追加
        const wallSizeBeforeDraw = this.wall.length;
        const tile = this.wall.pop(); // 山の最後からツモる想定
        console.log(`gameStore: [drawTile] Player ${this.currentTurnPlayerId} is drawing. Tile: ${tile?.id}. Wall before: ${wallSizeBeforeDraw}, Wall after: ${this.wall.length}`);
        this.drawnTile = tile; // ツモった牌をセット
        this.gamePhase = 'awaitingDiscard'; // プレイヤーの打牌待ち
        console.log(`gameStore: Player ${this.currentTurnPlayerId} drew tile: ${tile?.id}. Phase: ${this.gamePhase}. Wall: ${this.wall.length}`);
        // TODO: リーチ後のツモなど、特殊なケースの処理
      } else {
        if (this.wall.length === 0) {
          console.warn('gameStore: Cannot draw tile. Wall is empty.');
          this.gamePhase = 'roundOver'; // 例: 山切れでラウンド終了
        } else { // wall.length > 0 だが、他の条件が満たされない場合
          console.warn(`gameStore: Cannot draw tile. Conditions not met. Player: ${this.currentTurnPlayerId}, Phase: ${this.gamePhase}, Wall: ${this.wall.length}`);
        }
      }
    },
    discardTile(tileIdToDiscard, isFromDrawnTile) {
      const player = this.currentPlayer; // currentPlayer getter があると便利
      // 打牌可能な条件: プレイヤーが存在し、打牌待ちフェーズであること。
      // さらに、ツモ切りでない場合は、手牌から切るためのツモ牌(this.drawnTile)が存在すること。
      if (!player || this.gamePhase !== 'awaitingDiscard' || (!isFromDrawnTile && !this.drawnTile)) {
        console.warn('gameStore: Cannot discard tile now. Conditions not met.', { playerId: player?.id, phase: this.gamePhase, isFromDrawnTile, drawnTile: this.drawnTile });
        return;
      }

      let discardedTileActual;

      if (isFromDrawnTile) {
        if (!this.drawnTile || this.drawnTile.id !== tileIdToDiscard) {
          console.error('Mismatch: Trying to discard drawn tile, but IDs do not match or no drawn tile.');
          return; // ツモ牌と指定された牌が一致しない場合はエラー
        }
        discardedTileActual = this.drawnTile;
        player.discards.push(discardedTileActual);
        this.drawnTile = null;
        console.log(`gameStore: Player ${player.id} discarded drawn tile: ${discardedTileActual?.id}`);
      } else {
        const tileIndex = player.hand.findIndex(t => t.id === tileIdToDiscard);
        if (tileIndex === -1) {
          console.error('Tile to discard not found in hand:', tileIdToDiscard);
          return;
        }
        discardedTileActual = player.hand.splice(tileIndex, 1)[0];
        const tileAddedToHand = this.drawnTile; // 手牌に加えるツモ牌を一時保存
        player.discards.push(discardedTileActual);
        player.hand.push(tileAddedToHand); // ツモ牌を手牌に加える
        player.hand = mahjongLogic.sortHand(player.hand); // 手牌をソート
        this.drawnTile = null;
        console.log(`gameStore: Player ${player.id} discarded from hand: ${discardedTileActual?.id}, added drawn tile ${tileAddedToHand?.id} to hand. Hand size: ${player.hand.length}`);
      }

      this.lastDiscardedTile = discardedTileActual;
      // TODO: 他のプレイヤーのアクションチェック (ロン、ポンなど)
      // アクションがなければ次のプレイヤーへ
      this.moveToNextPlayer(); // 仮: すぐに次のプレイヤーのターンへ
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
      this.gamePhase = 'playerTurn'; // 次のプレイヤーのターン開始 (ツモ待ち)
      console.log(`gameStore: [moveToNextPlayer] Previous player: ${previousPlayerId}, Next player: ${this.currentTurnPlayerId}, Game phase set to: ${this.gamePhase}`);
      // 次のプレイヤーのターンになったら自動でツモる
      this.drawTile(); 
    },
    setGameMode(mode) {
      this.gameMode = mode;
      console.log(`gameStore: Game mode set to ${mode}`);
    },

    // 新しいゲームセッションのために状態をリセットするアクション (例)
    resetGameForNewSession() {
      console.log('gameStore: Resetting game state for new session.');
      this.players.forEach(player => {
        player.hand = [];
        player.discards = [];
        player.melds = [];
        player.score = 25000; // 初期スコアに戻すなど
        // isDealer も初期状態に戻す必要がある
      });
      // isDealer の再設定 (例: player1 を親にする)
      this.players.forEach((player, index) => {
          player.isDealer = index === 0;
      });

      this.wall = [];
      this.deadWall = [];
      this.doraIndicators = [];
      this.drawnTile = null;
      this.lastDiscardedTile = null;
      this.currentTurnPlayerId = null; // または初期プレイヤーに設定
      this.gamePhase = 'waitingToStart'; // 初期フェーズに戻す
      this.currentRound = { wind: 'east', number: 1 };
      this.honba = 0;
      this.riichiSticks = 0;
      // isInitialized フラグなどがあればそれもリセット
    }
  }
});
