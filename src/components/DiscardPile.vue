<template>
  <div :class="['discard-pile', `discard-pile-${position}`]">
    <div
      v-for="(tile, index) in tiles"
      :key="tile.id + '-' + index"
      :class="[
        'tile',
        { 'rotated-riichi-tile-container': tile.id === riichiDiscardedTileId },
        { 'highlighted-discard': tile.id === highlightedTileId }
      ]"
      :style="{ order: index }"
    >
      <!-- 牌の向きはCSSで制御 -->
      <img
        :src="getTileImageUrl(tile)"
        :alt="tileToString(tile)"
        class="discard-tile-image"
      >
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { getTileImageUrl, tileToString } from '@/utils/tileUtils';

/**
 * コンポーネントのプロパティを定義。
 * @property {Array<Object>} tiles - 表示する捨て牌の配列。
 * @property {string} position - 捨て牌の表示位置 ('bottom', 'right', 'top', 'left')。
 * @property {string|null} riichiDiscardedTileId - リーチ宣言牌のID。この牌は横向きに表示されます。
 * @property {string|null} highlightedTileId - ハイライト表示する牌のID。
 */
defineProps({
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
  },
  highlightedTileId: { // ハイライト対象の牌ID
    type: String,
    default: null
  }
});
</script>

<style scoped>
/* ハイライトアニメーションのキーフレーム */
@keyframes red-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 80, 80, 0.9);
  }
  70% {
    box-shadow: 0 0 4px 8px rgba(255, 80, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 80, 80, 0);
  }
}

/* ハイライト表示される捨て牌のスタイル */
.highlighted-discard .discard-tile-image {
  animation: red-pulse 1.5s infinite; /* 赤いパルスアニメーション */
  border-radius: 2px; /* 影の形を整える */
}

/* 捨て牌エリアの基本スタイル */
.discard-pile {
  display: grid;
  /* 3行9列にするために、列数を9に設定 */
  grid-template-columns: repeat(9, 1fr);
  gap: 0px; /* 牌間の隙間 */
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

/* 各捨て牌のコンテナスタイル */
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

/* 横向きリーチ牌のコンテナスタイル */
.rotated-riichi-tile-container {
  width: 21px; /* 横向きになった牌の幅 (元の高さ) */
  height: 21px; /* 横向きになった牌の高さ (元の幅) */
  margin-left: 1px; /* 次の牌との間にスペースを確保 */
  position: relative;
  overflow: visible; /* 牌がはみ出しても表示されるように */
}

/* 横向きリーチ牌の画像スタイル */
.rotated-riichi-tile-container .discard-tile-image {
  transform: rotate(-90deg); /* 牌を横向きにする */
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
}

/* 対面プレイヤーの横向きリーチ牌の画像スタイル */
.discard-pile-top .rotated-riichi-tile-container .discard-tile-image {
  transform: rotate(90deg); /* 対面は180度回転しているので、さらに90度回転 */
}
</style>
