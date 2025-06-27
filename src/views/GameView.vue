<template>
  <div class="game-view-container">
    <GameBoard />
  </div>
</template>

<script setup>
import GameBoard from '@/components/GameBoard.vue';
</script>

<style scoped>
.game-view-container {
  background-color: #000; /* 上下の余白を黒く塗りつぶす */
  display: flex;
  align-items: flex-end; /* ゲームボードを下寄せにする */
  justify-content: center; /* ゲームボードを中央寄せにする */
  width: 100vw;
  height: 100vh;
}
</style>