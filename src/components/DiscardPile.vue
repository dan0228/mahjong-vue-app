<template>
  <div class="discard-pile">
    <div
      v-for="(tile, index) in tiles"
      :key="tile.id + '-' + index"
      class="tile"
    >
      <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  tiles: {
    type: Array,
    default: () => []
  }
});

// PlayerHand.vue から getTileImageUrl と tileToString を共通化して
// utils/tileUtils.js などに移動し、ここでもインポートして使うのが理想的です。
// ここでは仮に PlayerHand.js と同様の関数を定義します。
function getTileImageUrl(tile) {
  if (tile && tile.suit && tile.rank) {
    return `/assets/images/tiles/${tile.suit}${tile.rank}.png`;
  }
  return `/assets/images/tiles/ura.png`; // 不明な牌やエラー時
}

function tileToString(tile) {
  if (tile && tile.suit && tile.rank){
    return `${tile.suit}${tile.rank}`;
  }
  return '不明な牌';
}
</script>

<style scoped>
.discard-pile {
  display: grid;
  grid-template-columns: repeat(6, 1fr); /* 1行に6枚表示する例 */
  gap: 2px;
  padding: 5px;
  background-color: #d0d0d0;
  border-radius: 4px;
  width: 250px; /* 仮の幅 */
  min-height: 50px;
}
.tile {
  width: 35px; /* 捨て牌は手牌より少し小さくする例 */
  height: 50px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
}
.tile img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}
</style>
