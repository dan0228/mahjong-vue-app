<template>
  <div :class="['discard-pile', `discard-pile-${position}`]">
    <div
      v-for="(tile, index) in tiles"
      :key="tile.id + '-' + index"
      class="tile"
    >
      <!-- 牌の向きはCSSで制御 -->
      <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { getTileImageUrl, tileToString } from '@/utils/tileUtils';

const props = defineProps({
  tiles: {
    type: Array,
    default: () => []
  },
  position: { // 'bottom', 'right', 'top', 'left'
    type: String,
    default: 'bottom'
  },
});
</script>

<style scoped>
.discard-pile {
  display: grid;
  grid-template-columns: repeat(6, 1fr); /* 1行に6枚表示する例 */
  gap: 2px;
  padding: 5px;
  background-color: #d0d0d0;
  border-radius: 4px;
  min-height: 50px;
  position: relative; /* 回転の基点や調整のため */
  /* デフォルトは自分(bottom)の捨て牌レイアウト */
  width: calc(35px * 6 + 2px * 5 + 10px); /* 牌幅*6 + 隙間*5 + padding*2 */
}

/* プレイヤーの位置に応じた捨て牌のレイアウト調整 */
.discard-pile-top {
  /* 対面は自分と同じレイアウトで牌が180度回転 */
}
.discard-pile-top .tile img {
  transform: rotate(180deg); /* 対面は180度回転 */
}
.discard-pile-left, .discard-pile-right {
  grid-template-columns: repeat(3, 1fr); /* 左右は3列表示 */
  width: calc(35px * 3 + 2px * 2 + 10px); /* 牌幅*3 + 隙間*2 + padding*2 */
}
.discard-pile-left .tile img {
  transform: rotate(90deg); /* 下家(左側表示)は90度回転 */
}
.discard-pile-right .tile img {
  transform: rotate(-90deg); /* 上家(右側表示)は-90度回転 */
}

/* スマホ縦画面など、スペースが限られる場合の調整 */
@media (max-width: 400px) { /* 例: 画面幅400px以下 */
  .discard-pile {
    grid-template-columns: repeat(3, 1fr); /* 自分も3列に */
    width: calc(35px * 3 + 2px * 2 + 10px);
  }
  .discard-pile-left, .discard-pile-right {
    grid-template-columns: repeat(2, 1fr); /* 左右は2列に */
    width: calc(35px * 2 + 2px * 1 + 10px);
  }
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
