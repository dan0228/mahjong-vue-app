<template>
  <div v-if="show" class="how-to-add-popup-overlay">
    <div class="how-to-add-popup-content">
      <h2>📲ホーム画面に追加する方法📲</h2>

      <h3>【iPhone（Safariの場合）】</h3>
      <ol>
        <li>画面下の共有ボタンをタップ</li>
        <li>「ホーム画面に追加」を選択</li>
        <li>右上の「追加」をタップ</li>
      </ol>

      <h3>【Android（Chromeの場合）】</h3>
      <ol>
        <li>画面右上の「<span class="icon">︙</span>」メニューをタップ</li>
        <li>「ホーム画面に追加」または「アプリをインストール」を選択</li>
        <li>表示された指示に従って追加</li>
      </ol>

      <div class="buttons">
        <button @click="closePopup">閉じる</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close']);

const closePopup = () => {
  emit('close');
};
</script>

<style scoped>
.how-to-add-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001; /* AddToHomeScreenPopupより前面に表示 */
}

.how-to-add-popup-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  text-align: left;
  max-width: 90%;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #333;
}

h2 {
  margin-top: 0;
  text-align: center;
  color: #333;
}

h3 {
  margin-top: 15px;
  margin-bottom: 5px;
  color: #555;
}

ol {
  margin-top: 0;
  margin-bottom: 10px;
  padding-left: 20px;
}

li {
  margin-bottom: 5px;
}

.icon {
  font-weight: bold;
  color: #007bff;
}

.buttons {
  margin-top: 20px;
  text-align: center;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

button:hover {
  background-color: #45a049;
}
</style>
