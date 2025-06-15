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
  /* 3行9列にするために、列数を9に設定 */
  grid-template-columns: repeat(9, 1fr);
  gap: 0px;
  padding: 2px;
  position: relative; /* 回転の基点や調整のため */
  /* デフォルトは自分(bottom)の捨て牌レイアウト */
}

/* プレイヤーの位置に応じた捨て牌のレイアウト調整 */
.discard-pile-top {
  /* 対面は自分と同じレイアウトで牌が180度回転 */
}
.discard-pile-top .tile img {
  transform: rotate(180deg); /* 対面は180度回転 */
}
.discard-pile-left, .discard-pile-right {
}
.discard-pile-left .tile img {
  /* コンテナが90度回転するので、牌は逆向きに回転して正立させる */
  transform: rotate(-90deg);
}
.discard-pile-left {
  transform: rotate(90deg);
  transform-origin: center;
}
.discard-pile-right .tile img {
  transform: rotate(90deg);

}

.discard-pile-right {
  transform: rotate(-90deg);
  transform-origin: center;
}

.tile {
  width: 22px; /* 3行9列に合わせた牌の幅 */
  height: 30px; /* 3行9列に合わせた牌の高さ */
  display: flex;
  justify-content: center;
  align-items: center;
}
.tile img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
