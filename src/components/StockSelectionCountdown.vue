<template>
  <div
    v-if="props.showCountdown"
    class="countdown-overlay"
    :style="overlayStyle"
  >
    <div
      :class="['countdown-container', { 'ai-player': props.position !== 'bottom' }]"
      :style="{ width: containerSize, height: containerSize }"
    >
      <svg
        class="progress-ring"
        :width="size"
        :height="size"
      >
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
      <img
        src="/assets/images/button/stock_in.png"
        alt="Stock Icon"
        class="stock-icon"
        :style="{ width: iconSize, height: iconSize }"
      >
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import { useGameStore } from '@/stores/gameStore';


const props = defineProps({
  showCountdown: { type: Boolean, default: false },
  isAiPlayer: { type: Boolean, default: false }, // AIプレイヤーかどうか
  position: { type: String, default: 'bottom' }, // プレイヤーの位置
});

const gameStore = useGameStore();


// 円ゲージのサイズ設定
const gaugeSize = computed(() => props.position === 'bottom' ? 80 : 40); // SVG size
const gaugeStrokeWidth = computed(() => props.position === 'bottom' ? 8 : 4); // SVG stroke width

const containerSize = computed(() => `${gaugeSize.value}px`); // Container size in px
const iconSize = computed(() => {
  const multiplier = props.position === 'bottom' ? 1.2 : 1.2;
  return `${gaugeSize.value * multiplier}px`;
});

const size = computed(() => gaugeSize.value); // For SVG width/height
const strokeWidth = computed(() => gaugeStrokeWidth.value); // For SVG stroke-width
const center = computed(() => size.value / 2);
const radius = computed(() => size.value / 2 - strokeWidth.value / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);

const countdownProgress = computed(() => {
  const initialCountdown = 1.3; // カウントダウンの初期値
  return Math.max(0, (gameStore.stockSelectionCountdown / initialCountdown) * 100);
});

const strokeDashoffset = computed(() => {
  return circumference.value - (countdownProgress.value / 100) * circumference.value;
});

const overlayStyle = computed(() => {
  const baseTransform = 'translate(-50%, -50%)';
  let adjustmentTransform = '';

  // 各ポジションごとの微調整（ここを調整します）
  if (props.position === 'top') {
    adjustmentTransform = 'translateY(-4px)';
  } else if (props.position === 'right') {
    adjustmentTransform = 'translateX(0px)';
  } else if (props.position === 'left') {
    adjustmentTransform = 'translateX(0px)';
  }
  // 'bottom' は中央揃えで問題ないため調整不要

  return {
    transform: `${baseTransform} ${adjustmentTransform}`.trim()
  };
});

</script>

<style scoped>
.countdown-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  /* transformはoverlayStyleで動的に設定されます */
  z-index: 101;
  pointer-events: none;
}

.countdown-container {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%; /* 円形にする */
  /* widthとheightはテンプレートで動的に設定 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'M PLUS 1', sans-serif;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  position: relative; /* SVGとテキストの配置のため */
  /* border: 1px solid red; */ /* 一時的なボーダーを削除 */
}

/* .countdown-container.ai-player は不要 */

.progress-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg); /* 上から開始するように回転 */
}

.progress-ring-circle-bg {
  stroke: #f8f8e0; /* 残り時間の部分を薄いベージュに */
  fill: transparent; 
}

.progress-ring-circle {
  stroke: #4a2c1a; /* プログレスの色をこげ茶色に */
  fill: transparent;
}

.stock-icon {
  position: absolute;
  object-fit: contain;
  z-index: 1; /* SVGの上に表示 */
  /* widthとheightはテンプレートで動的に設定 */
}

</style>