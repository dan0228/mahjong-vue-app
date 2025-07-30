import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useGameStore, GAME_PHASES } from './stores/gameStore';
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia();

app.use(pinia);

// ページリロード時のゲーム状態のハンドリング
router.isReady().then(() => {
  const gameStore = useGameStore();
  // ゲーム画面にいて、ゲームが開始待機状態でない場合（進行中または終了後）
  if (router.currentRoute.value.path === '/game' && gameStore.gamePhase !== GAME_PHASES.WAITING_TO_START) {
    // タイトルに戻し、ゲーム状態をリセット
    gameStore.resetGameForNewSession();
    router.replace('/');
  }
});

app.use(router);
app.mount('#app');