<template>
  <transition name="popup">
    <div class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-content">
        <h2>{{ $t('rulePopup.title') }}</h2>
        <p>{{ $t('rulePopup.subtitle') }}</p>
        <table class="rules-table">
          <tbody>
            <tr v-for="section in ruleSections" :key="section">
              <td class="rule-category">{{ $t(`rulePopup.sections.${section}.title`) }}</td>
              <td class="rule-description">{{ $t(`rulePopup.sections.${section}.description`) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="close-button-container">
          <button @click="$emit('close')" class="close-button">{{ $t('rulePopup.closeButton') }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineEmits(['close']);

const { t } = useI18n();

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
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup-content {
  background-color: white;
  padding: 5px;
  border-radius: 8px;
  max-width: 100%;
  max-height: 85vh; /* ポップアップの最大高さを画面の85%に制限 */
  font-family: 'M PLUS 1', sans-serif; /* フォントをM PLUS 1に統一 */
  font-size: small; /* フォントサイズを小さくして全体を縮小 */
  overflow-y: auto; /* 内容が多い場合にスクロール可能にする */
  transform: scale(0.85); /* ポップアップ全体を縮小して画面に収める */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  touch-action: pan-y;
}

/* Transition styles */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.popup-enter-from, .popup-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
.popup-content h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}
.popup-content p {
  margin-bottom: 15px;
  color: #555;
}
.rules-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 0.95em; /* 少しフォントサイズを調整 */
}
.rules-table td {
  border: 1px solid #e0e0e0;
  padding: 8px 10px;
  text-align: left;
  line-height: 1.6; /* 行間を少し広げて読みやすく */
}
.rule-category {
  font-weight: bold;
  background-color: #f8f9fa;
  color: #333;
  width: 100px; /* カテゴリ列の幅を固定 */
  vertical-align: top; /* 内容が多い場合に上揃え */
}
.rule-description {
  color: #444;
}
.close-button-container {
  margin-top: 20px;
  text-align: center;
}
.close-button {
  padding: 8px 25px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}
</style>