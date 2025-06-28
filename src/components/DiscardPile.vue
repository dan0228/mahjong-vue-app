<template>
  <div :class="['discard-pile', `discard-pile-${position}`]">
    <div
      v-for="(tile, index) in tiles"
      :key="tile.id + '-' + index"
      class="tile"
      :style="{ order: index }"
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
  /* 共通のデフォルトスタイル */
  width: 100%; /* 親コンテナの幅いっぱいに広がる */
  height: auto; /* 高さは内容に合わせる */
}

/* プレイヤーの位置に応じた捨て牌のレイアウト調整 */
.discard-pile-top {
  /* 対面プレイヤーの捨て牌 */
  display: flex; /* GridからFlexboxに変更 */
  flex-wrap: wrap-reverse; /* 複数行になった場合に、新しい行が上に追加される */
  flex-direction: row-reverse; /* 牌が右から左へ追加されるように */
  justify-content: flex-start; /* 右端から配置を開始 */
  align-content: flex-start; /* 複数行になった場合、上から詰める */
  width: calc(9 * 15px + 2 * 2px); /* 牌9枚分の幅 (33px/牌 * 9枚 + 2pxパディング*2) */
}
.discard-pile-top .tile img {
  transform: rotate(180deg); /* 対面は180度回転 */
}
/* 左右プレイヤーの捨て牌は同じレイアウトなのでスタイルを共通化 */
.discard-pile-left,
.discard-pile-right {
  grid-template-columns: repeat(9, 1fr); /* 3行9列 */
  grid-auto-flow: row dense;
  direction: ltr; /* 左から右へ */
  align-content: start; /* 複数行をコンテナの上部に詰める */
  width: calc(9 * 15px + 2 * 2px); /* 牌9枚分の幅 */
  height: calc(3 * 20px + 2 * 2px); /* 牌3行分の高さ */
}
.discard-pile-bottom {
  /* 自家プレイヤーの捨て牌 */
  grid-template-columns: repeat(9, 1fr); /* 3行9列 */
  grid-auto-rows: auto;
}

.tile {
  width: 15px; /* 3行9列に合わせた牌の幅 */
  height: 20px; /* 3行9列に合わせた牌の高さ */
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
