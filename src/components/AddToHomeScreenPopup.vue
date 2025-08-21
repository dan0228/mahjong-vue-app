<template>
  <div v-if="show" class="add-to-home-screen-popup-overlay">
    <div class="add-to-home-screen-popup-content">
      <h2>{{ $t('addToHomeScreenPopup.title') }}</h2>
      <div v-if="isMobile">
        <p><b>{{ $t('addToHomeScreenPopup.mobile.heading') }}</b></p>
        <p>{{ $t('addToHomeScreenPopup.mobile.body') }}</p>
      </div>
      <div v-else>
        <p><b>{{ $t('addToHomeScreenPopup.desktop.heading') }}</b></p>
        <p>{{ $t('addToHomeScreenPopup.desktop.body') }}</p>
      </div>
      <p class="note">{{ $t('addToHomeScreenPopup.note') }}</p>
      <div class="buttons">
        <button @click="closePopup">{{ $t('addToHomeScreenPopup.closeButton') }}</button>
        <button v-if="isMobile" @click="showInstructions">{{ $t('addToHomeScreenPopup.howToAddButton') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAudioStore } from '@/stores/audioStore';

const { t } = useI18n();

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close', 'showInstructions']);

const audioStore = useAudioStore();

const isMobile = ref(false);

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
});

const closePopup = () => {
  audioStore.setBgm('NES-JP-A01-2(Title-Loop115).mp3'); // 音楽再生
  emit('close');
};

const showInstructions = () => {
  audioStore.setBgm('NES-JP-A01-2(Title-Loop115).mp3'); // 音楽再生
  emit('showInstructions');
};
</script>

<style scoped>
.add-to-home-screen-popup-overlay {
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

.add-to-home-screen-popup-content {
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

button:last-child {
  background-color: #007bff; /* 青系の色に変更 */
}

button:last-child:hover {
  background-color: #0056b3; /* ホバー時の色 */
}
</style>

