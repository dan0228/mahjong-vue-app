<template>
  <transition name="fade">
    <div v-if="show" class="player-info-popup-overlay" @click.self="closePopup">
      <div class="player-info-popup-content">
        <button class="close-button" @click="closePopup">×</button>
        <div class="player-info-header">
          <img :src="playerIconSrc" alt="Player Avatar" class="player-avatar" />
          <h2 class="player-name">{{ player.name }}</h2>
        </div>
        <div class="player-stats">
          <div class="stat-item stat-item-main">
            <img :src="statBoardImageSrc" alt="Player Stats Board" class="stat-board-image" />
            <div class="stat-values-overlay">
              <div class="stat-value-row rating-row">
                <span class="stat-value">{{ player.rating }}</span>
              </div>
              <div class="stat-value-row cat-coins-row">
                <span class="stat-value">{{ player.cat_coins }}</span>
              </div>
            </div>
          </div>
          <div class="stat-item stat-item-empty">
            <!-- 右側の枠は一旦空欄 -->
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useI18n } from 'vue-i18n'; // useI18nをインポート // ユーザーのデフォルトアイコン取得用

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  player: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['close']);
const userStore = useUserStore();
const { locale } = useI18n(); // localeを取得

const closePopup = () => {
  emit('close');
};

const playerIconSrc = computed(() => {
  if (props.player.avatar_url) {
    return props.player.avatar_url;
  }
  // ゲストプレイヤーやAIプレイヤーのデフォルトアイコン
  if (props.player.originalId === 'kuro') return '/assets/images/info/cat_icon_3.png';
  if (props.player.originalId === 'tama') return '/assets/images/info/cat_icon_2.png';
  if (props.player.originalId === 'tora') return '/assets/images/info/cat_icon_1.png';
  if (props.player.originalId === 'janneko') return '/assets/images/info/cat_icon_4.png';
  // ユーザー自身のデフォルトアイコン
  return '/assets/images/info/hito_icon_1.png';
});

const statBoardImageSrc = computed(() => {
  return locale.value === 'en'
    ? '/assets/images/info/board_en.png'
    : '/assets/images/info/board.png';
});

// ポップアップ表示時にbodyのスクロールを制御
watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.player-info-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* 半透明の黒いオーバーレイ */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 最前面に表示 */
}

.player-info-popup-content {
  background-color: #fdf8e1; /* 和風なクリーム色 */
  border: 5px solid #8b4513; /* 茶色の枠線 */
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  text-align: center;
  position: relative;
  width: 80%;
  max-width: 300px;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  color: #333;
  animation: popup-scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2em;
  color: #8b4513;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.close-button:hover {
  color: #a0522d;
}

.player-info-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.player-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #a0522d; /* アイコンの縁取り */
  object-fit: cover;
  margin-bottom: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.player-name {
  font-size: 1.8em;
  color: #4a2c1a;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.player-stats {
  display: flex;
  justify-content: space-around;
  gap: 15px;
  margin-top: 15px;
}

.stat-item {
  background-color: #fff; /* デフォルトの背景色を維持 */
  border: 2px solid #d2b48c;
  border-radius: 10px;
  padding: 10px; /* 内部パディングを調整 */
  min-width: 100px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative; /* 内部の絶対配置の基準 */
  display: flex; /* 内部要素の配置用 */
  justify-content: center;
  align-items: center;
}

.stat-item-main {
  flex: 2; /* メインの枠を大きく */
  min-width: 180px; /* 適切なサイズに調整 */
  height: 120px; /* 適切なサイズに調整 */
  padding: 0; /* 画像が枠いっぱいに広がるようにパディングを0に */
  overflow: hidden; /* はみ出しを隠す */
}

.stat-board-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 枠いっぱいに画像を拡大 */
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.stat-values-overlay {
  position: absolute; /* 親要素に対して絶対配置 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2; /* 画像の上に表示 */
  display: flex; /* flexboxは維持しつつ、個別の位置調整を可能にする */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white; /* 数値の色を白に */
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8); /* 読みやすくするための影 */
}

.stat-value-row {
  position: absolute; /* 個別に位置調整できるように絶対配置 */
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 右寄せに変更 */
  width: 100%; /* 親の幅いっぱいに広げる */
  padding-right: 20%; /* 右からの余白を調整 */
}

.rating-row {
  top: 19%; /* 上からの位置を調整 */
  right: -4%;
  transform: translateY(-50%); /* 垂直方向の中央寄せ */
}

.cat-coins-row {
  top: 73%; /* 上からの位置を調整 */
  right: -4%;
  transform: translateY(-50%); /* 垂直方向の中央寄せ */
}

.stat-value {
  margin-left: 56px;
  font-family: 'Yuji Syuku', serif;
  font-size: 1.7em; /* 数値を大きく */
  font-weight: bold;
  color: white; /* 数値の色を白に */
}

.stat-item-empty {
  flex: 1; /* 空の枠は小さく */
  min-width: 80px; /* 適切なサイズに調整 */
  height: 120px; /* メインの枠と高さを合わせる */
  background-color: #f0e6d2; /* 空欄の背景色 */
  border: 2px dashed #d2b48c; /* 破線にするなど、空欄であることを示す */
}

/* フェードトランジション */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* ポップアップのスケールインアニメーション */
@keyframes popup-scale-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
