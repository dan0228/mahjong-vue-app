<template>
  <div v-if="showCountdown" class="countdown-overlay">
    <div class="countdown-container">
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: countdownProgress + '%' }"></div>
      </div>
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

const countdownProgress = computed(() => {
  // カウントダウンの初期値は1.5秒
  const initialCountdown = 1.5;
  // 現在のカウントダウン値から進捗率を計算
  // 0秒に近づくほど100%に近づくようにする (ゲージが減っていく表示)
  return (gameStore.stockSelectionCountdown / initialCountdown) * 100;
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

.progress-bar-container {
  width: 200px; /* ゲージの幅 */
  height: 20px;
  background-color: #555;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background-color: #4caf50; /* プログレスバーの色（緑） */
  width: 100%; /* 初期幅 */
  transition: width 0.1s linear; /* プログレスバーの滑らかなアニメーション */
}

.countdown-message {
  font-size: 1.2em;
}
</style>