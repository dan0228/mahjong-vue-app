<template>
  <div v-if="show" class="notification-popup-overlay">
    <div class="notification-popup-content">
      <h2>{{ $t('notificationPopup.title') }}</h2>
      <div>
        <p><b>{{ $t('notificationPopup.heading') }}</b></p>
        <p>{{ $t('notificationPopup.body') }}</p>
      </div>
      <div class="buttons">
        <button @click="closePopup">{{ $t('notificationPopup.closeButton') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAudioStore } from '@/stores/audioStore';

const { t } = useI18n(); // i18nの翻訳関数を取得

/**
 * コンポーネントのプロパティを定義。
 * @property {boolean} show - ポップアップの表示/非表示を制御します。
 */
const props = defineProps({
  show: Boolean,
});

/**
 * コンポーネントが発行するイベントを定義。
 * @event close - ポップアップを閉じる際に発行されます。
 */
const emit = defineEmits(['close']);

const audioStore = useAudioStore(); // オーディオストアのインスタンスを取得

/**
 * ポップアップを閉じ、BGMをタイトル画面のBGMに設定します。
 */
const closePopup = () => {
  audioStore.setBgm('NES-JP-A01-2(Title-Loop115).mp3'); // 音楽再生
  emit('close'); // 'close'イベントを発行してポップアップを閉じる
};
</script>

<style scoped>
.notification-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.notification-popup-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  max-width: 80%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #333;
}

h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.2em; /* 文字サイズを小さく調整 */
}

p {
  margin-bottom: 10px;
}

.note {
  font-size: 0.8em;
  color: #666;
}

.buttons {
  margin-top: 20px;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  margin: 0 5px;
}

button:hover {
  background-color: #45a049;
}
</style>
