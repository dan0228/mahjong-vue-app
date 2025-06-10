import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useGameStore, GAME_PHASES } from './stores/gameStore'; // gameStore と GAME_PHASES をインポート
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia();

app.use(pinia); // Piniaを先に有効化

// Piniaストアが利用可能になった後に gameStore を取得
// この時点ではまだストアの準備ができていない可能性があるため、router.isReady() 内で取得する方が安全

// リロード時にゲームが進行中であればタイトルに戻す
router.isReady().then(() => {
  const gameStore = useGameStore(); // ストアインスタンスをここで取得
  if (router.currentRoute.value.path === '/game' && gameStore.gamePhase !== GAME_PHASES.WAITING_TO_START) {
    // ゲーム画面にいて、かつゲームが開始待機状態でない（＝進行中または終了後）場合
    // 強制的にタイトルに戻し、ゲーム状態をリセット
    gameStore.resetGameForNewSession(); // ゲーム状態を完全にリセット (連勝数もリセットされる)
    router.replace('/'); // replace を使うとブラウザの履歴に残らない
    console.log('Browser reloaded during game, redirecting to title and resetting game.');
  }
});

app.use(router) // Vue Routerを有効化
app.mount('#app') // アプリケーションをマウント