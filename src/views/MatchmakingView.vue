<template>
  <div class="matchmaking-container">
    
    <!-- スケーリングされるコンテンツのラッパー -->
    <div class="scaler" :style="scalerStyle">
      <!-- 透明なコンテンツラッパー -->
      <div class="content-wrapper">
        <!-- 煙アニメーションのコンテナ -->
        <div class="smoke-container">
          <img v-for="i in 10" :key="i" src="/assets/images/back/smoke.png" class="smoke-particle" :style="{ '--i': i }" />
        </div>

        <div class="status-box">
          <h1 class="status-text">{{ $t('matchmaking.status.searching') }}</h1>
        </div>
        
        <!-- プレイヤーアイコンを個別に配置 -->
        <div id="player-1" class="player-slot">
          <img src="/assets/images/info/cat_icon_1.png" alt="Player Avatar" class="player-avatar" />
        </div>
        <div id="player-2" class="player-slot">
          <img src="/assets/images/info/cat_icon_2.png" alt="Player Avatar" class="player-avatar" />
        </div>
        <div id="player-3" class="player-slot">
          <img src="/assets/images/info/cat_icon_3.png" alt="Player Avatar" class="player-avatar" />
        </div>
        <div id="player-4" class="player-slot">
          <img src="/assets/images/info/hito_icon_1.png" alt="Player Avatar" class="player-avatar" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// --- スケーリング処理 (TitleView.vueと同一) ---
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
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
});
</script>

<style scoped>
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
  /* 背景は外側で指定するため、ここは透明 */
  background: transparent; 
  overflow: hidden;
}

/* status-textを囲む半透明のボックス */
.status-box {
  position: absolute;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.4);
  padding: 10px 40px;
  border-radius: 10px;
  z-index: 5; /* 煙より手前に表示 */
}

.status-text {
  color: white;
  font-size: 24px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
}

.player-slot {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 5; /* 煙より手前に表示 */
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
  width: 60px; /* 煙の基本サイズ */
  height: auto;
  transform-origin: center bottom;
  animation-name: rise;
  animation-duration: 12s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0;
  /* カスタムプロパティを使って遅延をばらけさせる */
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
    /* 右上に向かって移動 */
    transform: translate(0px, -150px) scale(1.5) rotate(60deg);
    opacity: 0;
  }
}
</style>
