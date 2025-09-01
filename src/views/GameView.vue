<template>
  <div class="game-view-container" :style="{ height: viewportHeight }">
    <GameBoard />
  </div>
</template>

<script setup>
/**
 * ゲーム画面のメインコンポーネント。
 * 主にゲームボード(`GameBoard`)をラップし、
 * ビューポート全体の高さを調整する役割を担います。
 */
import GameBoard from '@/components/GameBoard.vue';
import { useViewportHeight } from '@/composables/useViewportHeight';

const { viewportHeight } = useViewportHeight();
</script>

<style scoped>
.game-view-container {
  background-color: #000; /* 上下の余白を黒く塗りつぶす */
  display: flex;
  align-items: center; /* ゲームボードを中央寄せにする */
  justify-content: center; /* ゲームボードを中央寄せにする */
  width: 100vw;
  /* height: 100vh; */ /* 動的な高さ指定に置き換え */
  position: relative;
}
</style>