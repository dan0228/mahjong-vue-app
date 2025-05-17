<template>
  <div class="game-view-container">
    <div class="game-header" v-if="showReturnButton">
      <button @click="returnToTitle" class="return-button">タイトルへ戻る</button>
    </div>
    <GameBoard />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import GameBoard from '@/components/GameBoard.vue';

const router = useRouter();
const gameStore = useGameStore();

const showReturnButton = computed(() => {
  return gameStore.gameMode === 'allManual' || gameStore.gameMode === 'vsCPU';
});

function returnToTitle() {
  gameStore.resetGameForNewSession(); // ゲーム状態をリセット
  router.push('/');
}
</script>

<style scoped>
.game-header {
  padding: 10px;
  text-align: right; /* ボタンを右寄せにする例 */
}
.return-button {
  padding: 8px 15px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
.return-button:hover {
  background-color: #e0e0e0;
}
</style>