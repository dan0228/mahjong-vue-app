<template>
    <div :class="['player-hand-container', { 'my-turn-active': isMyHand && canDiscard }]">
      <!-- プレイヤー情報は PlayerArea に移動済みと仮定 -->
      <div
        class="hand-tiles-area player-hand"
      >
        <div
          v-for="tile in playerDisplayHand"
          :key="tile.id"
          :class="['tile', { 'my-tile': isMyHand, 'selectable': canSelectTile(tile, false) && isMyHand && canDiscard, 'disabled': !canSelectTile(tile, false) && isMyHand && gameStore.gamePhase === 'awaitingRiichiDiscard' }]"
          @click="selectTile(tile, false)"
        >
          <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
        </div>
      </div>
      <div v-if="isMyHand && drawnTileDisplay" class="drawn-tile-area player-hand">
        <div
          :class="['tile', 'my-tile', 'drawn-tile', { 'selectable': canSelectTile(drawnTileDisplay, true) && canDiscard, 'disabled': !canSelectTile(drawnTileDisplay, true) && gameStore.gamePhase === 'awaitingRiichiDiscard' }]"
          @click="selectTile(drawnTileDisplay, true)"
        >
          <img :src="getTileImageUrl(drawnTileDisplay)" :alt="tileToString(drawnTileDisplay)" />
          <span class="drawn-tile-label">ツモ</span>
        </div>
      </div>
    </div>
</template>

<script setup>
  import { defineProps, defineEmits, computed } from 'vue';
  import { useGameStore } from '@/stores/gameStore'; // gameStore をインポート
  import { getTileImageUrl, tileToString } from '@/utils/tileUtils'; // 共通ユーティリティをインポート
  const props = defineProps({
    player: { // handTiles から player オブジェクト全体を受け取るように変更
      type: Object,
      default: () => null
    },
    isMyHand: {
      type: Boolean,
      default: false
    },
    // gameStoreから渡されるツモ牌 (自分の手番で、かつツモった後のみ表示)
    drawnTileDisplay: { // 名前を drawnTileDisplay に変更して、ストアの drawnTile と区別
      type: Object,
      default: null
    },
    // 打牌可能な状態か (自分のターンで、ツモ後など)
    canDiscard: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'bottom'
    }
    // PlayerArea から渡される
    // PlayerHand 自身では使用しない場合は削除するか、レイアウト調整に使用する
    // position: { type: String, default: 'bottom' } // 未使用なら削除
  });

  const emit = defineEmits(['tile-selected']);
  const gameStore = useGameStore(); // gameStore を使用

  // player プロパティから手牌を取得する算出プロパティ
  const playerDisplayHand = computed(() => {
    return props.player ? props.player.hand : [];
  });

  function canSelectTile(tile, isFromDrawnTile) {
    if (!props.isMyHand || !props.canDiscard || !tile) return false;

    if (gameStore.gamePhase === 'awaitingRiichiDiscard') {
      return gameStore.riichiDiscardOptions.includes(tile.id);
    }
    // 通常の打牌時は常に選択可能 (canDiscard で制御されている前提)
    return true;
  }

  function selectTile(tile, isFromDrawnTile) {
    if (canSelectTile(tile, isFromDrawnTile)) { // canSelectTile で選択可否を判定
      emit('tile-selected', { tile, isFromDrawnTile });
    }
  }
</script>

<style scoped>
  .player-hand-container {
    display: flex;
    align-items: flex-start; /* 手牌とツモ牌の上端を揃える */
    padding: 2px 5px;
  }

  /* プレイヤーの位置に応じた手牌の向き調整 */
  .player-hand-container.position-bottom,
  .player-hand-container.position-top {
    flex-direction: column; /* 上下プレイヤーは手牌とツモ牌を縦に */
  }
  .player-hand-container.position-left,
  .player-hand-container.position-right {
    flex-direction: row; /* 左右プレイヤーは手牌とツモ牌を横に */
    align-items: center;
  }

  .my-turn-active .selectable:hover {
    transform: translateY(-5px);
    border-color: #ffcc00; /* 選択可能な牌のホバー時のボーダー */
    cursor: pointer;
  }

  .player-hand {
    display: flex;
    gap: 2px; /* 牌同士の間隔 */
    padding: 5px;
    background-color: #e0e0e0; /* 手牌エリアの背景色（仮） */
    border-radius: 4px;
    min-height: 62px; /* 牌の高さ + paddingなど */
  }

  /* 左右プレイヤーの手牌は縦に並べる */
  .position-left .player-hand,
  .position-right .player-hand {
    flex-direction: column;
    min-width: 42px; /* 牌の幅 + padding */
    min-height: auto;
  }

  .drawn-tile-area {
    margin-left: 15px; /* 手牌とツモ牌の間隔 */
  }
  .position-left .drawn-tile-area,
  .position-right .drawn-tile-area {
    margin-left: 0;
    margin-top: 10px; /* 左右プレイヤーのツモ牌は手牌の下に */
  }

  .tile {
    width: 40px; /* 牌の幅（仮） */
    height: 60px; /* 牌の高さ（仮） */
    border: 1px solid #999;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 1px 1px 3px rgba(0,0,0,0.2);
    position: relative; /* ラベル表示のため */
  }
  /* 牌の画像の向き */
  .position-top .tile img {
    transform: rotate(180deg);
  }
  .position-left .tile img {
    transform: rotate(90deg);
  }
  .position-right .tile img {
    transform: rotate(-90deg);
  }

  /* .tile.my-tile {*/
    /* 自分の手牌はデフォルトでポインターなし。canDiscardがtrueの時だけホバーエフェクト */
  /*}*/

  .drawn-tile-label {
    position: absolute;
    bottom: -15px; /* 牌の下に表示 */
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7em;
    color: #333;
  }
  .position-left .drawn-tile-label,
  .position-right .drawn-tile-label {
    bottom: auto;
    top: 50%;
    left: -20px; /* 牌の左側に表示 */
    transform: translateY(-50%) rotate(-90deg);
  }
  .position-right .drawn-tile-label {
    left: auto; right: -20px; transform: translateY(-50%) rotate(90deg);
  }

  .tile img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
  }

  .tile.my-tile.selectable:hover { /* isMyHand と canDiscard が true の場合 */
  transform: translateY(-5px);
  border-color: #ffcc00;
  cursor: pointer;
  }

  .tile.my-tile:not(.selectable) { /* isMyHand は true だが canDiscard が false の場合 */
    cursor: default; /* クリックできないことを示す */
  }

  .tile:not(.my-tile) { /* isMyHand が false の場合 (他家の手牌) */
    /* 裏向き表示などのスタイル */
    cursor: default;
  }
  .tile.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    border-color: #ccc;
  }
</style>
