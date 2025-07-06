<template>
  <div :class="['discard-pile', `discard-pile-${position}`]">
    <div
      v-for="(tile, index) in tiles"
      :key="tile.id + '-' + index"
      :class="['tile', { 'rotated-riichi-tile-container': tile.id === riichiDiscardedTileId }]"
      :style="{ order: index }"
    >
      <!-- 牌の向きはCSSで制御 -->
      <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" class="discard-tile-image" />
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
  riichiDiscardedTileId: { // リーチ宣言牌のID
    type: String,
    default: null
  }
});
</script>

<style scoped>
.discard-pile {
  display: grid;
  /* 3行9列にするために、列数を9に設定 */
  grid-template-columns: repeat(9, 1fr);
  gap: 0px;
  padding: 0px;
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
  width: calc(9 * 16px + 2 * 3px); /* 牌9枚分の幅 */
}
.discard-pile-top .tile img {
  transform: rotate(180deg); /* 対面は180度回転 */
}
/* 左右プレイヤーの捨て牌は同じレイアウトなのでスタイルを共通化 */
.discard-pile-left,
.discard-pile-right {
  display: flex; /* GridからFlexboxに変更 */
  flex-wrap: wrap; /* 複数行になった場合に、新しい行が上に追加される */
  flex-direction: row; /* 牌が右から左へ追加されるように */
  justify-content: flex-start; /* 右端から配置を開始 */
  align-content: flex-start; /* 複数行になった場合、上から詰める */
  grid-auto-flow: row dense;
  direction: ltr; /* 左から右へ */
  align-content: start; /* 複数行をコンテナの上部に詰める */
  width: calc(9 * 16px + 2 * 3px); /* 牌9枚分の幅 */
}
.discard-pile-bottom {
  /* 自家プレイヤーの捨て牌 */
  display: flex; /* GridからFlexboxに変更 */
  flex-wrap: wrap; /* 複数行になった場合に、新しい行が上に追加される */
  flex-direction: row; /* 牌が右から左へ追加されるように */
  justify-content: flex-start; /* 右端から配置を開始 */
  align-content: flex-start; /* 複数行になった場合、上から詰める */
  grid-auto-rows: auto;
  width: calc(9 * 16px + 2 * 3px); /* 牌9枚分の幅 */
}

.tile {
  width: 16px; /* 3行9列に合わせた牌の幅 */
  height: 21px; /* 3行9列に合わせた牌の高さ */
  display: flex;
  justify-content: center;
  align-items: center;
}
.tile img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.rotated-riichi-tile-container {
  width: 21px; /* 横向きになった牌の幅 (元の高さ) */
  height: 21px; /* 横向きになった牌の高さ (元の幅) */
  margin-left: 1px; /* 次の牌との間にスペースを確保 */
  position: relative;
  overflow: visible; /* 牌がはみ出しても表示されるように */
}

.rotated-riichi-tile-container .discard-tile-image {
  transform: rotate(-90deg); /* 牌を横向きにする */
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
}

.discard-pile-top .rotated-riichi-tile-container .discard-tile-image {
  transform: rotate(90deg); /* 対面は180度回転しているので、さらに90度回転 */
}
</style>
