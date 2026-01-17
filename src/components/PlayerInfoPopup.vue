<template>
  <transition name="fade">
    <div v-if="show && player" class="player-info-tooltip" :style="tooltipStyle">
      <div class="player-icon-area">
        <img :src="playerIconSrc" alt="Player Avatar" class="player-avatar-large" />
      </div>
      <div class="player-details-area">
        <h3 class="player-name-large">{{ player.name }}</h3>
        <div class="player-stats-compact">
          <img :src="statBoardImageSrc" alt="Player Stats Board" class="stat-board-image-compact" />
          <div class="stat-values-overlay-compact">
            <div class="stat-value-row-compact rating-row-compact">
              <span class="stat-value-compact">{{ player.rating }}</span>
            </div>
            <div class="stat-value-row-compact cat-coins-row-compact">
              <span class="stat-value-compact">{{ player.cat_coins }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  player: {
    type: Object,
    default: () => ({}),
  },
  x: { // X座標
    type: Number,
    default: 0,
  },
  y: { // Y座標
    type: Number,
    default: 0,
  },
  offsetX: { // 新しいプロパティ: X方向のオフセット
    type: Number,
    default: 0,
  },
  offsetY: { // 新しいプロパティ: Y方向のオフセット
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['close']); // closeイベントは残しておくが、GameBoard側でマウスアウトなどで制御する

const userStore = useUserStore();
const { locale } = useI18n();

const playerIconSrc = computed(() => {
  if (props.player.avatar_url) {
    return props.player.avatar_url;
  }
  if (props.player.originalId === 'kuro') return '/assets/images/info/cat_icon_3.png';
  if (props.player.originalId === 'tama') return '/assets/images/info/cat_icon_2.png';
  if (props.player.originalId === 'tora') return '/assets/images/info/cat_icon_1.png';
  if (props.player.originalId === 'janneko') return '/assets/images/info/cat_icon_4.png';
  return '/assets/images/info/hito_icon_1.png';
});

const statBoardImageSrc = computed(() => {
  return locale.value === 'en'
    ? '/assets/images/info/board_en.png'
    : '/assets/images/info/board.png';
});

const tooltipStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  '--offset-x': `${props.offsetX}px`,
  '--offset-y': `${props.offsetY}px`,
}));

// bodyのスクロール制御は不要になるため削除
// watch(() => props.show, (newVal) => {
//   if (newVal) {
//     document.body.style.overflow = 'hidden';
//   } else {
//     document.body.style.overflow = '';
//   }
// });
</script>

<style scoped>
.player-info-tooltip {
  position: absolute;
  width: 350px; /* さらに横長に */
  height: 180px; /* 高さは維持 */
  background-image: url('/assets/images/back/omikuji_board.png');
  background-size: 100% 100%; /* 画像を要素全体に引き伸ばす */
  background-position: center;
  background-repeat: no-repeat;
  border: none;
  border-radius: 0;
  padding: 43px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5)); /* filter: drop-shadow() を使用 */
  z-index: 1001;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  font-family: 'Yuji Syuku', serif;
  color: #333;
  white-space: nowrap;
  pointer-events: none;
  transform: translate(calc(-50% + var(--offset-x, 0px)), calc(-100% + var(--offset-y, 0px)));
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  box-sizing: border-box;
}

/* 内部要素の調整 */
.player-info-header-compact {
  margin-bottom: 2px; /* 調整 */
}
.player-avatar-large {
  width: 80px; /* 大きく */
  height: 80px;
  border-radius: 50%; /* 丸型 */
  border: 2px solid #a0522d;
  object-fit: cover;
}

.player-details-area {
  flex-grow: 1; /* 残りのスペースを占める */
  display: flex;
  flex-direction: column; /* 名前と統計を縦並びにする */
  align-items: center;
  justify-content: center;
  padding-left: 5px; /* アイコンとの間隔 */
}

.player-name-large {
  font-size: 1.4em; /* 大きく */
  font-weight: bold;
  color: #4a2c1a;;
  margin: 0 0 5px 0; /* マージン調整 */
  text-shadow: 1px 1px 2px rgba(43, 42, 42, 0.3); /* 読みやすくする */
}

.player-stats-compact {
  position: relative;
  width: 160px; /* 横に引き伸ばすために幅を広げる */
  height: 100px; /* 高さは維持 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin-top: -6px;
  margin-bottom: 3px;
}

.stat-board-image-compact {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: fill; /* 画像を横に引き伸ばす */
  z-index: 1;
}

.stat-values-overlay-compact {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end; /* 右寄せ */
  width: 100%;
  height: 100%;
  padding-right: 0px; /* 右からの余白を調整 */
  color: #fff; /* 背景が暗くなる可能性があるので白に変更 */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.stat-value-row-compact {
  display: flex;
  align-items: center;
  margin: 2px 0;
}

.rating-row-compact {
  margin-top: -2px; /* 微調整 */
  margin-bottom: -5px;
}

.cat-coins-row-compact {
  margin-top: 24px; /* 微調整 */
  margin-bottom: 4px;
}

/* 不要になったスタイルを削除 */
/* .player-info-header-compact, .player-avatar-compact, .player-name-compact は新しいものに置き換え */
/* .player-info-header-compact { display: none; } */
/* .player-avatar-compact { display: none; } */
/* .player-name-compact { display: none; } */

.stat-value-compact {
  font-size: 1.3em; /* 数値を小さく */
  font-family: 'Yuji Syuku', serif;
  margin-right: 23px;
}
</style>