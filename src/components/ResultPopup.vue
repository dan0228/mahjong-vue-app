<template>
  <div v-if="show" class="popup-overlay" @click.self="closePopup">
    <div class="popup-content">
      <h2>結果</h2>
      <p>{{ message }}</p>
      <button @click="proceedToNext">次の局へ</button>
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
    default: '結果はありません。',
  },
});

const emit = defineEmits(['close', 'proceed']);

function closePopup() {
  emit('close');
}

function proceedToNext() {
  emit('proceed');
}
</script>

<style scoped>
/* RulePopup.vue と同様のスタイルを使用できます */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup-content {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  max-width: 80%;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.popup-content h2 {
  margin-top: 0;
  color: #333;
}
.popup-content p {
  margin-bottom: 20px;
  color: #555;
  white-space: pre-wrap; /* メッセージ内の改行を有効にする */
}
.popup-content button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}
.popup-content button:hover {
  background-color: #45a049;
}
</style>
