<template>
  <div class="title-screen">
    <h1>四牌麻雀</h1>
    <nav class="menu">
      <ul>
        <li><button @click="startGame('allManual')">全操作モード</button></li>
        <li><button @click="startGame('vsCPU')" disabled>CPU対戦 (未実装)</button></li>
        <li><button @click="startGame('online')" disabled>オンライン対戦 (未実装)</button></li>
        <li><button @click="showRulesPopup = true">ルール</button></li>
        <li><button @click="showYakuListPopup = true">役一覧</button></li>
      </ul>
    </nav>

    <RulePopup v-if="showRulesPopup" @close="showRulesPopup = false" />
    <YakuListPopup v-if="showYakuListPopup" @close="showYakuListPopup = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import RulePopup from '@/components/RulePopup.vue';
import YakuListPopup from '@/components/YakuListPopup.vue';

const router = useRouter();
const gameStore = useGameStore();

const showRulesPopup = ref(false);
const showYakuListPopup = ref(false);

function startGame(mode) {
  gameStore.setGameMode(mode);
  // ゲーム開始前に状態をリセットまたは初期化する処理が必要な場合、ここかストアの initializeGame で行う
  // 例えば、前回のゲームのプレイヤー情報などが残っている場合など。
  // gameStore.resetGame(); // 必要であれば
  gameStore.gamePhase = 'waitingToStart'; // GameBoard側で初期化をトリガーするため
  router.push('/game');
}
</script>

<style scoped>
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 画面全体の高さを使用 */
  text-align: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #a1f39a 100%); /* 背景に薄いグラデーション */
  font-family: 'Helvetica Neue', Arial, sans-serif; /* モダンなフォントに変更 */
}

h1 {
  font-size: 5em; /* 少し大きく */
  margin-bottom: 30px; /* メニューとの間隔を調整 */
  color: #0f1338; /* 少し濃いめの色に */
  text-shadow: 10px 10px 2px rgba(0,0,0,0.1); /* わずかなテキストシャドウ */
}

.menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu li {
  margin-bottom: 15px;
}

.menu button {
  width: 280px; /* ボタンの幅を統一 */
  padding: 15px 20px; /* パディング調整 */
  font-size: 1.2em;
  cursor: pointer;
  border: none; /* ボーダーを削除 */
  border: 2px solid #586810; /* 元のボーダー色 */
  background-color: rgb(255, 255, 255); /* 元の背景色 */
  color: #586810; /* 元の文字色 */
  border-radius: 5px; /* 元の角丸 */
  transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08); /* ボタンに影を追加 */
}


.menu button:hover:not(:disabled) {
  background-color: #4CAF50; /* 元のホバー時の背景色 */
  color: white; /* 元のホバー時の文字色 */
  transform: translateY(-2px); /* ホバー時に少し浮き上がる効果 */
}

.menu button:active:not(:disabled) {
  transform: translateY(0px); /* クリック時に元の位置に戻す */
  box-shadow: 0 2px 3px rgba(50, 50, 93, 0.09), 0 1px 2px rgba(0, 0, 0, 0.07); /* アクティブ時の影は残すか任意 */
}

.menu button:disabled {
  border-color: #ccc; /* 元の無効化ボーダー色 */
  color: #ccc; /* 元の無効化文字色 */
  cursor: not-allowed;
  box-shadow: none; /* 無効化ボタンの影はなし */
}
</style>