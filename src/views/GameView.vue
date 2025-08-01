<template>
  <div class="game-view-container" :style="{ height: viewportHeight }">
    <GameBoard />
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore';
import GameBoard from '@/components/GameBoard.vue';
import { useViewportHeight } from '@/composables/useViewportHeight';

const { viewportHeight } = useViewportHeight();

const gameStore = useGameStore();

import { useAudioStore } from '@/stores/audioStore';

const audioStore = useAudioStore();
</script>

<style scoped>
.game-view-container {
  background-color: #000; /* 上下の余白を黒く塗りつぶす */
  display: flex;
  align-items: center; /* ゲームボードを中央寄せにする */
  justify-content: center; /* ゲームボードを中央寄せにする */
  width: 100vw;
  /* height: 100vh; */ /* Replaced by dynamic height */
  position: relative; /* audio-toggles の配置基準 */
}
</style>