<template>
  <div class="game-view-container" :style="{ height: viewportHeight }">
    <GameBoard />
    <StockDecisionPopup
      v-if="showStockDecisionPopup"
      @draw-from-wall="handleDrawFromWall"
      @use-stocked-tile="handleUseStockedTile"
    />
  </div>
</template>

<script setup>
/**
 * ゲーム画面のメインコンポーネント。
 * 主にゲームボード(`GameBoard`)をラップし、
 * ビューポート全体の高さを調整する役割を担います。
 */
import GameBoard from '@/components/GameBoard.vue';
import StockDecisionPopup from '@/components/StockDecisionPopup.vue';
import { useViewportHeight } from '@/composables/useViewportHeight';
import { computed } from 'vue';
import { useGameStore, GAME_PHASES } from '@/stores/gameStore';

const { viewportHeight } = useViewportHeight();
const gameStore = useGameStore();

const showStockDecisionPopup = computed(() => {
  return gameStore.gamePhase === GAME_PHASES.AWAITING_STOCK_DECISION &&
         gameStore.currentTurnPlayerId === 'player1'; // 'player1' が人間プレイヤーと仮定
});

const handleDrawFromWall = () => {
  gameStore.drawFromWall('player1');
};

const handleUseStockedTile = () => {
  gameStore.useStockedTile('player1');
};
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