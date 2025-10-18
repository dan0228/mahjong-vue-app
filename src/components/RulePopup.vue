<template>
  <transition name="popup">
    <div class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-content">
        <h2>{{ $t('rulePopup.title') }}</h2>
        <p class="subtitle">{{ $t('rulePopup.subtitle') }}</p>
        <div class="popup-body">
          <div v-for="section in ruleSections" :key="section" class="section">
            <h3>{{ $t(`rulePopup.sections.${section}.title`) }}</h3>
            <p>{{ $t(`rulePopup.sections.${section}.description`) }}</p>
          </div>
        </div>
        <div class="close-button-container">
          <button @click="$emit('close')" class="close-button">{{ $t('rulePopup.closeButton') }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

/**
 * コンポーネントが発行するイベントを定義。
 * @event close - ポップアップを閉じる際に発行されます。
 */
defineEmits(['close']);

// 表示するルールセクションのキーリスト
const ruleSections = ref([
  'basics',
  'scoring',
  'dora',
  'calls',
  'riichi',
  'draws',
  'priority',
  'points',
  'endCondition'
]);
</script>

<style scoped>
/* HowToPlayPopup.vue のスタイルをベースに適用 */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 90%;
  max-height: 80%;
  overflow-y: auto;
  text-align: center;
  font-family: 'M PLUS 1', sans-serif;
}
.popup-content h2 {
  margin-top: 0;
  margin-bottom: 5px;
}
.subtitle {
  margin-top: 0;
  margin-bottom: 20px;
  color: #555;
  font-size: 0.9em;
}
.popup-body {
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: left;
  font-size: 14px;
  line-height: 1.6;
}
.section {
  margin-bottom: 20px;
}
.section h3 {
  font-size: 1.1em; /* 少し小さめに調整 */
  text-align: left;
  margin-bottom: 8px;
  color: #586810;
  border-bottom: 2px solid #d8c8a0;
  padding-bottom: 5px;
}
.section p {
  margin-left: 10px;
  margin-right: 10px;
}
.close-button-container {
  text-align: center;
  margin-top: 20px;
}
.close-button {
  padding: 10px 30px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

/* トランジション用スタイル */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.popup-enter-from, .popup-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>