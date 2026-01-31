<template>
  <div class="matchmaking-container">
    
    <!-- スケーリングされるコンテンツのラッパー -->
    <div class="scaler" :style="scalerStyle">
      <!-- 透明なコンテンツラッパー -->
      <div class="content-wrapper">
        <!-- ユーザー情報 -->
        <div class="user-stats">
          <img :src="boardImageSrc" alt="Board" class="board-image" />
          <span class="rating-number-on-board">{{ userStore.profile?.rating ?? 1500 }}</span>
          <span class="cat-coins-number-on-board">{{ userStore.profile?.cat_coins || 0 }}</span>
        </div>

        <!-- タイトルへ戻るボタン -->
        <div class="back-to-title-container">
          <router-link to="/">
            <img src="/assets/images/button/buckToTitle.png" alt="Back to Title" class="back-to-title-image" />
          </router-link>
        </div>

        <!-- 煙アニメーションのコンテナ -->
        <div class="smoke-container">
          <img v-for="i in 10" :key="i" src="/assets/images/back/smoke.png" class="smoke-particle" :style="{ '--i': i }" />
        </div>

        <!-- 火の粉アニメーションのコンテナ -->
        <div class="fire-container">
          <div v-for="i in 20" :key="i" class="fire-particle" :style="fireParticleStyles[i-1]"></div>
        </div>

        <div class="status-box">
          <h1 class="status-text">{{ $t('matchmaking.status.searching') }}</h1>
        </div>
        
        <!-- プレイヤーアイコンをデータに基づいて配置 -->
        <div 
          v-for="player in players"
          :key="player.id"
          :id="'player-' + player.id"
          class="player-slot"
          @click="openPlayerInfoPopup(player)"
        >
          <img :src="player.avatar_url" alt="Player Avatar" class="player-avatar" />
        </div>

        <!-- プレイヤー情報ポップアップ -->
        <PlayerInfoPopup 
          :show="showPlayerInfoPopup" 
          :player="selectedPlayer" 
          @close="closePlayerInfoPopup" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/userStore';
import PlayerInfoPopup from '@/components/PlayerInfoPopup.vue';

const { t, locale } = useI18n();
const userStore = useUserStore();

// --- ポップアップ関連 ---
const showPlayerInfoPopup = ref(false);
const selectedPlayer = ref(null);

const openPlayerInfoPopup = (player) => {
  selectedPlayer.value = player;
  showPlayerInfoPopup.value = true;
};

const closePlayerInfoPopup = () => {
  showPlayerInfoPopup.value = false;
};

// --- プレイヤーデータ ---
const players = computed(() => {
  const mainPlayer = {
    id: 1,
    username: userStore.profile?.username || 'Player 1',
    rating: userStore.profile?.rating || 1500,
    avatar_url: userStore.profile?.avatar_url || '/assets/images/info/hito_icon_1.png',
    cat_coins: userStore.profile?.cat_coins || 0,
  };
  const dummyPlayers = [
    { id: 2, username: 'くろ', rating: 1500, avatar_url: '/assets/images/info/cat_icon_3.png', cat_coins: 100 },
    { id: 3, username: 'たま', rating: 1500, avatar_url: '/assets/images/info/cat_icon_2.png', cat_coins: 200 },
    { id: 4, username: 'とら', rating: 1500, avatar_url: '/assets/images/info/cat_icon_1.png', cat_coins: 300 },
  ];
  return [mainPlayer, ...dummyPlayers].sort((a, b) => a.id - b.id);
});

// --- i18n関連の算出プロパティ ---
const boardImageSrc = computed(() =>
  locale.value === 'en'
    ? '/assets/images/info/board_en.png'
    : '/assets/images/info/board.png'
);

// --- 火の粉アニメーションのスタイル ---
const fireParticleStyles = ref([]);

const generateFireParticleStyles = () => {
  const styles = [];
  for (let i = 0; i < 20; i++) {
    // ランダムな遅延を生成
    const randomDelay = Math.random() * 0.9 + 1.8;
    styles.push({ animationDelay: `${randomDelay * (i + 1)}s` });
  }
  fireParticleStyles.value = styles;
};


// --- スケーリング処理 ---
const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 640;

const calculateScaleFactor = () => {
  if (typeof window === 'undefined') return 1;
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const scaleX = currentWidth / DESIGN_WIDTH;
  const scaleY = currentHeight / DESIGN_HEIGHT;
  return Math.min(scaleX, scaleY);
};

const scaleFactor = ref(calculateScaleFactor());

const scalerStyle = computed(() => ({
  transform: `translate(-50%, -50%) scale(${scaleFactor.value})`,
}));

const updateScaleFactor = () => {
  scaleFactor.value = calculateScaleFactor();
};

onMounted(() => {
  window.addEventListener('resize', updateScaleFactor);
  generateFireParticleStyles(); // コンポーネントマウント時にランダムなスタイルを生成
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
});
</script>

<style scoped>
/* (Previous styles remain the same) */

/* 1. 外側の背景コンテナ */
.matchmaking-container {
  width: 100vw;
  height: 100vh;
  background-image: url('/assets/images/back/matching.png');
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  font-family: 'Yuji Syuku', serif;
}

/* 2. スケーリングされる「キャンバス」 */
.scaler {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 640px;
  transform-origin: center center;
}

/* 3. 透明なコンテンツラッパー */
.content-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent; 
  overflow: hidden;
}

/* --- ここから追加 --- */
.user-stats {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
}

.board-image {
  width: 90px;
  height: auto;
}

.rating-number-on-board {
  position: absolute;
  top: 6px;
  right: 12px;
  font-family: 'Yuji Syuku', serif;
  font-size: 13px;
  color: rgb(255, 255, 255);
  text-shadow: 3px 3px 3px #5a3b22;
}

.cat-coins-number-on-board {
  position: absolute;
  top: 37px;
  right: 12px;
  font-family: 'Yuji Syuku', serif;
  font-size: 13px;
  color: rgb(255, 255, 255);
  text-shadow: 3px 3px 3px #5a3b22;
}
/* --- ここまで追加 --- */


/* タイトルへ戻るボタン */
.back-to-title-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
}

.back-to-title-image {
  width: 62px;
  height: auto;
  cursor: pointer;
  transition: transform 0.2s ease;
  filter: drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.8));
}

.back-to-title-image:hover {
  transform: translateY(-3px);
}

/* status-textを囲む半透明のボックス */
.status-box {
  position: absolute;
  top: 170px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 40px;
  border-radius: 10px;
  z-index: 5;
}

.status-text {
  color: white;
  font-size: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
}

.player-slot {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
  cursor: pointer;
}

.player-slot::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 18px;
  background-color: rgba(0, 0, 0, 0.95);
  border-radius: 50%;
  filter: blur(4px);
  z-index: -1;
}

.player-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgb(41, 2, 2);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  object-fit: cover;
}

/* 各プレイヤーのアイコンの位置とサイズをCSSで個別に指定 */
#player-1 {
  top: 450px;
  left: 130px;
  width: 60px;
  height: 60px;
}

#player-2 {
  top: 450px;
  left: 240px;
  width: 60px;
  height: 60px;
}

#player-3 {
  top: 415px;
  left: 45px;
  width: 55px;
  height: 55px;
}

#player-4 {
  top: 415px;
  left: 320px;
  width: 55px;
  height: 55px;
}

/* 煙アニメーション */
.smoke-container {
  position: absolute;
  bottom: 35%;
  left: 52%;
  width: 1px;
  height: 1px;
}

.smoke-particle {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: auto;
  transform-origin: center bottom;
  animation-name: rise;
  animation-duration: 12s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0;
  animation-delay: calc(var(--i) * 1.2s);
}

@keyframes rise {
  0% {
    transform: translate(-50%, 20px) scale(0.2);
    opacity: 0;
  }
  20% {
    opacity: 0.4;
  }
  100% {
    transform: translate(0px, -150px) scale(1.5) rotate(60deg);
    opacity: 0;
  }
}

/* 火の粉アニメーション */
.fire-container {
  position: absolute;
  top: 59%;
  left: 52%;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%);
}

.fire-particle {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 1px;
  height: 1px;
  background: #ffc400;
  border-radius: 50%;
  box-shadow: 0 0 10px #ffc400, 0 0 20px #ffc400, 0 0 40px #ff8c00, 0 0 80px #ff8c00;
  animation: crackle 7.0s infinite;
  opacity: 0;
  /* animation-delayはscriptでインラインスタイルとして設定される */
}

.fire-particle:nth-child(2n) {
  animation-name: crackle-2;
  width: 1px;
  height: 1px;
  animation-duration: 6.2s;
}

@keyframes crackle {
  0% {
    transform: translateY(-2px) translateX(3px);
    opacity: 1;
  }
  100% {
    transform: translateY(-30px) translateX(-10px);
    opacity: 0;
  }
}

@keyframes crackle-2 {
  0% {
    transform: translateY(0) translateX(7px);
    opacity: 1;
  }
  100% {
    transform: translateY(-30px) translateX(15px);
    opacity: 0;
  }
}
</style>