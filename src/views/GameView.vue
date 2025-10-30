<template>
  <div class="game-view-container" :style="{ height: viewportHeight }">
    <!-- Loading Indicator -->
    <div v-if="isWaitingForGameStart" class="loading-overlay">
      <div class="loading-box">
        <p>{{ $t('game.waitingForSync') }}</p>
        <div class="spinner"></div>
      </div>
    </div>
    <GameBoard v-else />
    <StockSelectionCountdown />
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
import { onMounted, computed } from 'vue'; // onMountedをインポート
import { useGameStore, GAME_PHASES } from '@/stores/gameStore';
import StockSelectionCountdown from '@/components/StockSelectionCountdown.vue';
import { useI18n } from 'vue-i18n'; // ローディングメッセージ用にインポート

const { viewportHeight } = useViewportHeight();
const gameStore = useGameStore();
const { t } = useI18n(); // ローディングメッセージ用に初期化

// ゲーム開始待ちかどうかを判定するcomputedプロパティ
const isWaitingForGameStart = computed(() => 
  gameStore.isGameOnline && gameStore.gamePhase === GAME_PHASES.WAITING_TO_START
);

onMounted(() => {
  // オンラインゲームで、かつ自分がホストの場合、ゲームの初期化処理をキックする
  if (gameStore.isGameOnline && gameStore.isHost) {
    console.log("ホストとしてゲーム初期化を開始します。");
    gameStore.initializeOnlineGame();
  }
});
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

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.loading-box {
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  text-align: center;
  font-family: 'M PLUS Rounded 1c', sans-serif;
}

.loading-box p {
  font-size: 1.2em;
  color: #333;
  margin-bottom: 20px;
}

.spinner {
  margin: 0 auto;
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #4caf50;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
