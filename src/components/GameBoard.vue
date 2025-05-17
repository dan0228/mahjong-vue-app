<template>
    <div class="game-board">
      <div class="player-area top-player">
        <!-- PlayerHand for top player -->
        <DiscardPile v-if="playerAtTop" :tiles="playerAtTop.discards" />
        <PlayerHand v-if="playerAtTop"
          :hand-tiles="playerAtTop.hand"
          :is-my-hand="determineIsMyHand(playerAtTop.id)"
          :drawn-tile-display="drawnTileForPlayer(playerAtTop.id)"
          :can-discard="canPlayerDiscard(playerAtTop.id)"
          @tile-selected="handleTileSelection" />
        <p v-if="!playerAtTop">対面のプレイヤーエリア</p>
        <!-- 例: <DiscardPile :tiles="opponent1Discards" /> -->
      </div>
      <div class="middle-row">
        <div class="player-area left-player">
          <!-- PlayerHand for top player -->
          <DiscardPile v-if="playerAtLeft" :tiles="playerAtLeft.discards" />
          <!-- プレイヤー3 (左側) の手牌、捨て牌、副露 -->
          <PlayerHand v-if="playerAtLeft"
            :hand-tiles="playerAtLeft.hand"
            :is-my-hand="determineIsMyHand(playerAtLeft.id)"
            :drawn-tile-display="drawnTileForPlayer(playerAtLeft.id)"
            :can-discard="canPlayerDiscard(playerAtLeft.id)"
            @tile-selected="handleTileSelection" />
          <p v-if="!playerAtLeft">左側のプレイヤーエリア</p>
          <!-- 例: <DiscardPile :tiles="opponent2Discards" /> -->
        </div>
        <div class="center-table">
          <CenterTableInfo />  
            <!-- 例: <Wall :remaining-tiles-count="wallCount" /> -->
            <!-- 例: <DoraIndicator :dora-tiles="doraTiles" /> -->
        </div>
        <div class="player-area right-player">
          <!-- PlayerHand for top player -->
          <DiscardPile v-if="playerAtRight" :tiles="playerAtRight.discards" />
          <PlayerHand v-if="playerAtRight"
            :hand-tiles="playerAtRight.hand"
            :is-my-hand="determineIsMyHand(playerAtRight.id)"
            :drawn-tile-display="drawnTileForPlayer(playerAtRight.id)"
            :can-discard="canPlayerDiscard(playerAtRight.id)"
            @tile-selected="handleTileSelection" />
          <p v-if="!playerAtRight">右側のプレイヤーエリア</p>
          <!-- 例: <DiscardPile :tiles="opponent3Discards" /> -->
        </div>
      </div>
      <div class="player-area bottom-player">
        <!-- プレイヤー0 (自分) の手牌、捨て牌、副露、操作パネル -->
        <PlayerHand v-if="playerAtBottom"
          :hand-tiles="playerAtBottom.hand"
          :is-my-hand="determineIsMyHand(playerAtBottom.id)"
          :drawn-tile-display="drawnTileForPlayer(playerAtBottom.id)"
          :can-discard="canPlayerDiscard(playerAtBottom.id)"
          @tile-selected="handleTileSelection" />
        <DiscardPile v-if="playerAtBottom" :tiles="playerAtBottom.discards" />
        <!-- 将来的にはここに ControlPanel.vue なども配置 -->
        <!-- 例: <DiscardPile :tiles="myDiscards" /> -->
        <!-- 例: <GameActions :available-actions="myActions" @action-selected="handleAction" /> -->
      </div>
    </div>
</template>
  
<script setup>
  import { computed, onMounted } from 'vue';
  import PlayerHand from './PlayerHand.vue';
  import { useGameStore } from '@/stores/gameStore';
  import CenterTableInfo from './CenterTableInfo.vue';
  import DiscardPile from './DiscardPile.vue';
  // import Wall from './Wall.vue'; // 将来的に使用
  // import DoraIndicator from './DoraIndicator.vue'; // 将来的に使用
  // import GameActions from './GameActions.vue'; // 将来的に使用

  const gameStore = useGameStore(); // ストアのインスタンスを取得
  // UIの各位置に表示するプレイヤーを固定的に割り当てる (4人麻雀前提)
  // player1 (ID: 'player1') が常に下、player2が右、player3が対面、player4が左と仮定
  // gameStore.players の初期化順序とIDに依存します。
  const playerAtBottom = computed(() => gameStore.players.find(p => p.id === 'player1'));
  const playerAtRight = computed(() => gameStore.players.find(p => p.id === 'player2'));
  const playerAtTop = computed(() => gameStore.players.find(p => p.id === 'player3'));
  const playerAtLeft = computed(() => gameStore.players.find(p => p.id === 'player4'));

  const gameMode = computed(() => gameStore.gameMode);

  function determineIsMyHand(playerId) {
    if (gameMode.value === 'allManual') {
      return true; // 全操作モードでは全ての牌を表向きに
    }
    // CPU対戦モードやオンライン対戦モードの場合のロジック (将来実装)
    // 例: 自分のプレイヤーIDと一致する場合のみtrue
    // return gameStore.myActualPlayerId === playerId;
    // 現状は、全操作モード以外はplayer1のみ操作可能とする（仮）
    return playerAtBottom.value?.id === playerId;
  }

  // 渡されたプレイヤーIDに対応するツモ牌を取得
  function drawnTileForPlayer(playerId) {
    if (gameStore.currentTurnPlayerId === playerId) {
      return gameStore.drawnTile;
    }
    return null;
  }

  // 渡されたプレイヤーIDが打牌可能か判定
  function canPlayerDiscard(playerId) {
    return gameStore.currentTurnPlayerId === playerId && gameStore.gamePhase === 'awaitingDiscard';
  }

  onMounted(() => {
    // ゲームの初期化処理などをストア経由で実行
    // 例: プレイヤー情報の設定、山牌の準備、配牌など
    // gameStore内で初期化済みフラグ (例: isInitialized) を持ち、
    // それをチェックする方がより堅牢かもしれません。
    // if (!gameStore.isInitialized) {
    if (gameStore.gamePhase === 'waitingToStart') { // gameStore.myPlayer のチェックは initializeGame 内で行う方が適切
      gameStore.initializeGame(); // ストアのアクションを呼び出す
      // 初期化後、最初のプレイヤーがツモる
      if (gameStore.currentTurnPlayerId && gameStore.gamePhase === 'playerTurn') {
        gameStore.drawTile();
      }
    }
  });

  function handleTileSelection(payload) { // payload は { tile: Object, isFromDrawnTile: Boolean }
    console.log('Selected tile for discard:', payload.tile, 'Is from drawn:', payload.isFromDrawnTile);
    // どのプレイヤーの操作かに関わらず、現在のターンプレイヤーが打牌可能な状態であれば実行
    if (gameStore.currentPlayer && gameStore.currentTurnPlayerId === gameStore.currentPlayer.id && gameStore.gamePhase === 'awaitingDiscard') {
+      gameStore.discardTile(payload.tile.id, payload.isFromDrawnTile);
    } else {
      console.log("It's not your turn or you cannot discard now.");
    }
  }

  // function handleAction(action) {
  //   console.log('Action selected:', action);
  //   // ポン、ロンなどのアクション処理
  // }

</script>
  
<style scoped>
  .game-board {
    display: flex;
    flex-direction: column;
    width: 90vw; /* 例: ビューポート幅の90% */
    max-width: 800px; /* 例: 最大幅 */
    height: 80vh; /* 例: ビューポート高さの80% */
    max-height: 700px; /* 例: 最大高さ */
    border: 2px solid #333;
    margin: 20px auto;
    padding: 10px;
    background-color: #f0f0f0; /* ボードの薄い灰色の背景 */
  }
  
  .middle-row {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;
    margin: 10px 0;
  }
  
  .player-area {
    border: 1px dashed #666;
    padding: 10px;
    min-height: 100px; /* 視認性のための最小の高さ */
    display: flex; /* 子要素を柔軟に配置するため */
    flex-direction: column; /* 基本は縦積み */
    align-items: center; /* 中央揃え */
  }
  
  .center-table {
    padding: 10px;
    flex-grow: 1;
    margin: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .current-turn-indicator.central-indicator {
    position: absolute; /* 中央テーブル内で位置調整しやすくする */
    bottom: 10px; /* 例: 中央テーブルの下部に表示 */
    font-weight: bold;
    color: #2c3e50;
  }

  /* .top-player, .bottom-player は player-area の基本スタイルを継承しつつ、
    必要に応じて個別のスタイル調整（例：手牌の向きなど）を行う */

  /*
  .top-player {
    background-color: lightblue;
  }
  .bottom-player {
    background-color: lightgreen;
  }
  .left-player, .right-player {
    width: 150px;
    background-color: lightcoral;
  }
  */
</style>
