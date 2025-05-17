<template>
    <div :class="['player-hand-container', { 'my-turn-active': isMyHand && canDiscard }]">
      <div
        class="hand-tiles-area player-hand"
      >
        <div
          v-for="tile in handTiles"
          :key="tile.id"
          :class="['tile', { 'my-tile': isMyHand, 'selectable': isMyHand && canDiscard }]"
          @click="selectTile(tile, false)"
        >
          <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
        </div>
      </div>
      <div v-if="isMyHand && drawnTileDisplay" class="drawn-tile-area player-hand">
        <div :class="['tile', 'my-tile', 'drawn-tile', { 'selectable': canDiscard }]" @click="selectTile(drawnTileDisplay, true)">
          <img :src="getTileImageUrl(drawnTileDisplay)" :alt="tileToString(drawnTileDisplay)" />
          <span class="drawn-tile-label">ツモ</span>
        </div>
      </div>
    </div>
</template>

<script setup>
  import { defineProps, defineEmits } from 'vue';

  const props = defineProps({
    handTiles: {
      type: Array,
      default: () => []
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
    }
  });

  const emit = defineEmits(['tile-selected']);

  // 牌の画像URLを取得する関数
  // isRevealed: 副露などで公開されている牌か (他家の手牌表示用)
  //             自分の手牌やツモ牌は常に表向き
  function getTileImageUrl(tile) {
    if (!props.isMyHand && !tile.isRevealed) {
        return `/assets/images/tiles/ura.png`;
    }
    if (tile && tile.suit && tile.rank) {
        return `/assets/images/tiles/${tile.suit}${tile.rank}.png`;
    }
    console.warn('画像表示のための牌データが無効です:', tile);
    return `/assets/images/tiles/ura.png`;
  }

  function tileToString(tile) {
    if (tile && tile.suit && tile.rank){
        return `${tile.suit}${tile.rank}`;
    } else {
        return '不明な牌';
    }
  }

  function selectTile(tile, isFromDrawnTile) {
    if (props.isMyHand && props.canDiscard && tile) {
      emit('tile-selected', { tile, isFromDrawnTile });
    }
  }
</script>

<style scoped>
  .player-hand-container {
    display: flex;
    align-items: flex-start; /* 手牌とツモ牌の上端を揃える */
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

  .drawn-tile-area {
    margin-left: 15px; /* 手牌とツモ牌の間隔 */
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
</style>
