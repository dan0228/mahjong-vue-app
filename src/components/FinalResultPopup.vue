<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content">
      <h2>最終結果</h2>
      <pre class="result-text">{{ message }}</pre>
      <div class="actions">
        <button @click="startNewGame">新しいゲームを開始</button>
        <button @click="backToTitle">タイトルに戻る</button>
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
  message: {
    type: String,
    default: '最終結果はありません。',
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
  box-shadow: 0 5px 20px rgba(0,0,0,0.25);
}
.popup-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.8em;
}
.result-text {
  margin-bottom: 25px;
  color: #444;
  font-size: 1.1em;
  text-align: left;
  white-space: pre-wrap; /* メッセージ内の改行を有効にする */
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  max-height: 300px;
  overflow-y: auto;
}
.actions {
  display: flex;
  justify-content: space-around;
  gap: 15px;
}
.actions button {
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s ease;
}
.actions button:first-child { /* 新しいゲームを開始 */
  background-color: #4CAF50;
  color: white;
}
.actions button:first-child:hover {
  background-color: #45a049;
}
.actions button:last-child { /* タイトルに戻る */
  background-color: #f44336;
  color: white;
}
.actions button:last-child:hover {
  background-color: #da190b;
}
</style>
