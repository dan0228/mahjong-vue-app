<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content">
      <h2>終局</h2>
      <div class="final-results-list">
        <div v-for="player in finalResultDetails.rankedPlayers" :key="player.name" class="player-rank-item">
          <span class="rank">{{ player.rank }}位</span>
          <span class="player-name">{{ player.name }}</span>
          <span class="score">{{ player.score }}点</span>
        </div>
      </div>
      <p class="consecutive-wins">
        {{ finalResultDetails.consecutiveWins }}連勝中！
      </p>
      <div class="actions">
        <button @click="startNewGame" class="action-button">
          <span>新しいゲームを開始</span>
          <span>(連勝継続)</span>
        </button>
        <button @click="backToTitle" class="action-button">
          <span>タイトルに戻る</span>
          <span>(連勝リセット)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  finalResultDetails: { // gameStore.finalResultDetails を想定
    type: Object,
    required: true,
    // rankedPlayers: [{ rank, name, score }], consecutiveWins: number
    default: () => ({ rankedPlayers: [], consecutiveWins: 0 }), // デフォルト値をオブジェクトに変更
  },
});

const emit = defineEmits(['start-new-game', 'back-to-title']);

function startNewGame() {
  emit('start-new-game');
}

function backToTitle() {
  emit('back-to-title');
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050; /* ResultPopupより手前に表示する場合 */
}
.popup-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  min-width: 350px;
  max-width: 90%;
  text-align: center;
  transform: scale(0.85); /* ポップアップ全体を縮小して画面に収める */
  box-shadow: 0 5px 20px rgba(0,0,0,0.25);
}
.popup-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.8em;
}
.final-results-list {
  margin-bottom: 25px;
  color: #444;
  font-size: 1.1em;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  max-height: 300px;
  overflow-y: auto;
}
.player-rank-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dashed #eee;
}
.player-rank-item:last-child {
  border-bottom: none;
}
.rank { font-weight: bold; width: 40px; text-align: left;}
.player-name { flex-grow: 1; text-align: left; margin-left: 10px;}
.score { font-weight: bold; color: #007bff; width: 80px; text-align: right;}
.consecutive-wins {
  font-size: 1.2em;
  font-weight: bold;
  color: #ff9800; /* オレンジ色 */
  margin-top: 15px;
  margin-bottom: 25px;
}
.actions {
  display: flex;
  justify-content: space-around;
  gap: 15px;
}
.action-button { /* actions button から action-button にクラス名を変更 */
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
  display: flex; /* テキストを縦に並べるため */
  flex-direction: column; /* テキストを縦に並べるため */
  align-items: center; /* テキストを中央揃え */
  justify-content: center; /* テキストを中央揃え */
  line-height: 1.2; /* 行間調整 */
}
.action-button:first-child { /* 新しいゲームを開始 */
  background-color: #4CAF50;
  color: white;
}
.action-button:first-child:hover {
  background-color: #45a049;
}
.action-button:last-child { /* タイトルに戻る */
  background-color: #f44336;
  color: white;
}
.action-button:last-child:hover {
  background-color: #da190b;
}
</style>
