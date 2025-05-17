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
  min-height: 100vh;
  text-align: center;
}

h1 {
  font-size: 3em;
  margin-bottom: 40px;
  color: #333;
}

.menu ul {
  list-style: none;
  padding: 0;
}

.menu li {
  margin-bottom: 15px;
}

.menu button {
  padding: 12px 25px;
  font-size: 1.2em;
  cursor: pointer;
  border: 2px solid #4CAF50;
  background-color: white;
  color: #4CAF50;
  border-radius: 5px;
  transition: background-color 0.3s, color 0.3s;
}

.menu button:hover:not(:disabled) {
  background-color: #4CAF50;
  color: white;
}

.menu button:disabled {
  border-color: #ccc;
  color: #ccc;
  cursor: not-allowed;
}
</style>