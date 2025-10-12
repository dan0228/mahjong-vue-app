<template>
  <div v-if="showCountdown" class="countdown-overlay">
    <div class="countdown-container">
      <div class="countdown-text">{{ gameStore.stockSelectionCountdown }}</div>
      <div class="countdown-message">{{ $t('stockCountdown.message') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore, GAME_PHASES } from '@/stores/gameStore';
import { useI18n } from 'vue-i18n';

const gameStore = useGameStore();
const { t } = useI18n();

const showCountdown = computed(() => {
  return gameStore.gamePhase === GAME_PHASES.AWAITING_STOCK_SELECTION_TIMER &&
         gameStore.currentTurnPlayerId === 'player1'; // 人間プレイヤーのターンのみ表示
});
</script>

<style scoped>
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 900; /* ポップアップよりは下、ゲームボードよりは上 */
  pointer-events: none; /* クリックイベントを透過させる */
}

.countdown-container {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  padding: 20px 30px;
  text-align: center;
  color: white;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.countdown-text {
  font-size: 4em;
  font-weight: bold;
  line-height: 1em;
  margin-bottom: 5px;
}

.countdown-message {
  font-size: 1.2em;
}
</style>