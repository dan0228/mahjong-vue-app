<template>
  <div v-if="showCountdown" class="countdown-overlay">
    <div class="countdown-container">
      <svg class="progress-ring" :width="size" :height="size">
        <circle
          class="progress-ring-circle-bg"
          :stroke-width="strokeWidth"
          :r="radius"
          :cx="center"
          :cy="center"
        />
        <circle
          class="progress-ring-circle"
          :stroke-width="strokeWidth"
          :r="radius"
          :cx="center"
          :cy="center"
          :style="{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }"
        />
      </svg>
      <div class="countdown-text">{{ gameStore.stockSelectionCountdown.toFixed(1) }}</div>
      <div class="countdown-message">{{ $t('stockCountdown.message') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import { useGameStore, GAME_PHASES } from '@/stores/gameStore';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  showCountdown: { type: Boolean, default: false },
});

const gameStore = useGameStore();
const { t } = useI18n();

// 円ゲージのサイズ設定
const size = 60; // SVG全体の幅と高さ
const strokeWidth = 8; // 線の太さ
const center = size / 2;
const radius = size / 2 - strokeWidth / 2;
const circumference = 2 * Math.PI * radius;

const countdownProgress = computed(() => {
  const initialCountdown = 1.3; // カウントダウンの初期値
  // 残り時間に基づいて0から100のパーセンテージを計算
  // ゲージが減っていく表示なので、残り時間が少ないほどパーセンテージも小さくなる
  return Math.max(0, (gameStore.stockSelectionCountdown / initialCountdown) * 100);
});

const strokeDashoffset = computed(() => {
  // 進捗率が0%のときに完全に表示され、100%のときに完全に非表示になるように調整
  // ゲージが減っていく表示なので、100% - progress で計算
  return circumference - (countdownProgress.value / 100) * circumference;
});
</script>

<style scoped>
.countdown-overlay {
  position: absolute; /* 親要素に対して絶対配置 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 中央寄せ */
  z-index: 1; /* ストック牌より手前に表示 */
  pointer-events: none; /* クリックイベントを透過させる */
}

.countdown-container {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%; /* 円形にする */
  width: 80px; /* コンテナのサイズを小さく */
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  position: relative; /* SVGとテキストの配置のため */
}

.progress-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg); /* 上から開始するように回転 */
}

.progress-ring-circle-bg {
  stroke: #555; /* 背景色 */
  fill: transparent;
}

.progress-ring-circle {
  stroke: #4caf50; /* プログレスバーの色（緑） */
  fill: transparent;
  transition: stroke-dashoffset 0.1s linear; /* 滑らかなアニメーション */
}

.countdown-text {
  font-size: 1.5em; /* 数値表示を小さく */
  font-weight: bold;
  line-height: 1em;
  position: relative; /* SVGの上に表示 */
  z-index: 1;
}

.countdown-message {
  font-size: 0.5em; /* メッセージも小さく */
  position: relative;
  z-index: 1;
}
</style>