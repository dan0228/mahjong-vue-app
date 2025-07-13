<template>
  <div class="game-view-container" :style="{ height: viewportHeight }">
    <GameBoard />
    <ParentDecisionPopup 
      :show="showParentDecisionPopup"
      :dealerDeterminationResults="dealerDeterminationResults"
      @close="handleParentDecisionClose"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import GameBoard from '@/components/GameBoard.vue';
import ParentDecisionPopup from '@/components/ParentDecisionPopup.vue';
import { useViewportHeight } from '@/composables/useViewportHeight';

const { viewportHeight } = useViewportHeight();

const gameStore = useGameStore();
const showParentDecisionPopup = ref(false);
const dealerDeterminationResults = ref([]);

onMounted(() => {
  // 親決め結果のデータをgameStoreから取得
  dealerDeterminationResults.value = gameStore.players.map(p => ({
    id: p.id,
    name: p.name,
    seatWind: p.seatWind,
    score: p.score,
  }));
  showParentDecisionPopup.value = true;
});

function handleParentDecisionClose() {
  showParentDecisionPopup.value = false;
  gameStore.startGameFlow(); // ポップアップが閉じた後にゲームフローを開始
}
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
