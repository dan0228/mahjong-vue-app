<template>
  <div v-if="props.showCountdown" class="countdown-overlay" :style="overlayStyle">
    <div :class="['countdown-container', { 'ai-player': props.isAiPlayer }]">
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
      <div v-if="!props.isAiPlayer" class="countdown-message">{{ $t('stockCountdown.message') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import { useGameStore, GAME_PHASES } from '@/stores/gameStore';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  showCountdown: { type: Boolean, default: false },
  isAiPlayer: { type: Boolean, default: false }, // AIプレイヤーかどうか
  position: { type: String, default: 'bottom' }, // プレイヤーの位置
});

const gameStore = useGameStore();
const { t } = useI18n();

// 円ゲージのサイズ設定
const size = computed(() => props.isAiPlayer ? 50 : 80); // AIなら小さく、人間なら通常サイズ
const strokeWidth = computed(() => props.isAiPlayer ? 5 : 8); // AIなら細く
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
  if (props.position === 'top') {
    // topプレイヤーの場合
    return {
      bottom: '20px', // 下端から少し上に
      left: '-13px',   // 左端から少し左に
      transform: 'none',
    };
  } else if (props.position === 'right') {
    // rightプレイヤーの場合
    return {
      top: '-14px',
      left: '-8px',
      transform: 'none',
    };
  } else if (props.position === 'left') {
    // leftプレイヤーの場合
    return {
      top: '-12px',
      right: '-7px',
      transform: 'none',
    };
  } else {
    // bottomプレイヤーの場合
    return {
      top: '-6px',
      right: '-15px',
      transform: 'none',
    };
  }
});
</script>

<style scoped>
.countdown-overlay {
  position: absolute; /* 親要素に対して絶対配置 */
  z-index: 101; /* ストック牌より手前に表示 */
  pointer-events: none; /* クリックイベントを透過させる */
}

.countdown-container {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%; /* 円形にする */
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'M PLUS 1', sans-serif;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  position: relative; /* SVGとテキストの配置のため */
}

.countdown-container.ai-player {
  width: 50px; /* AIプレイヤー用の小さいサイズ */
  height: 50px;
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
  font-size: 1.5em;
  font-weight: bold;
  line-height: 1em;
  position: relative; /* SVGの上に表示 */
  z-index: 1;
}

.countdown-container.ai-player .countdown-text {
  font-size: 1em; /* AIプレイヤー用の小さいフォントサイズ */
}

.countdown-message {
  font-size: 0.5em;
  position: relative;
  z-index: 1;
}
</style>