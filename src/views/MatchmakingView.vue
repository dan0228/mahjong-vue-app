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
          <h1 class="status-text">{{ statusText }}</h1>
          <h2 v-if="showCountdown" class="countdown-text">
            {{ t('matchmaking.status.countdown', { count: countdown }) }}
          </h2>
        </div>
        
        <!-- プレイヤーアイコンをデータに基づいて配置 -->
        <div 
          v-for="player in foundPlayers"
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
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import PlayerInfoPopup from '@/components/PlayerInfoPopup.vue';

const { t, locale } = useI18n();
const userStore = useUserStore();
const router = useRouter();

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

// --- マッチングロジック ---
const allPlayers = computed(() => {
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

const foundPlayers = ref([]);
const statusKey = ref('searching'); // 'searching' or 'ready'
const statusText = computed(() => t(`matchmaking.status.${statusKey.value}`));
const countdown = ref(3);
const showCountdown = ref(false);
let countdownInterval = null;

const startFinalSequence = () => {
  statusKey.value = 'ready'; // テキストのキーを変更
  showCountdown.value = true;

  countdownInterval = setInterval(() => {
    countdown.value--;
    if (countdown.value === 0) {
      clearInterval(countdownInterval);
      router.push('/game');
    }
  }, 1000);
};

const simulateMatchmaking = () => {
  const playersToFind = [...allPlayers.value];
  let delay = 0;
  playersToFind.forEach((player, index) => {
    delay += Math.random() * 1500 + 500; // 0.5秒から2秒のランダムな遅延
    setTimeout(() => {
      foundPlayers.value.push(player);
      if (foundPlayers.value.length === 4) {
        startFinalSequence();
      }
    }, delay);
  });
};

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
    const randomDelay = Math.random() * 4;
    styles.push({ animationDelay: `${randomDelay}s` });
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
  generateFireParticleStyles();
  simulateMatchmaking(); // マッチングシミュレーションを開始
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
  clearInterval(countdownInterval); // コンポーネント離脱時にタイマーをクリア
});
</script>

<style scoped>
/* (Previous styles remain the same) */
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
.scaler {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 640px;
  transform-origin: center center;
}
.content-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent; 
  overflow: hidden;
}
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
.back-to-title-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
}

.back-to-title-container a { /* router-link (a tag) */
  display: block;
  width: 62px; /* Match image width */
  height: 62px; /* Match image height (assuming square) */
  cursor: pointer;
}
.back-to-title-image {
  width: 62px;
  height: auto;
  cursor: pointer;
  transition: all 0.2s ease; /* transformとfilterの両方をアニメーション */
  filter: drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.8));
}
.back-to-title-image:hover {
  transform: translateY(-4px);
  filter: drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.8));
}
.status-box {
  position: absolute;
  top: 170px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 40px;
  border-radius: 10px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.status-text {
  color: white;
  font-size: 18px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
}
.countdown-text {
  color: #ffd700;
  font-size: 18px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 1);
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
  animation: crackle 4.0s infinite;
  opacity: 0;
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
    transform: translateY(-25px) translateX(-10px);
    opacity: 0;
  }
}
@keyframes crackle-2 {
  0% {
    transform: translateY(0) translateX(7px);
    opacity: 1;
  }
  100% {
    transform: translateY(-25px) translateX(15px);
    opacity: 0;
  }
}
</style>
