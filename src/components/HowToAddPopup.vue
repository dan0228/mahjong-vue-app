<template>
  <div v-if="show" class="how-to-add-popup-overlay">
    <div class="how-to-add-popup-content">
      <h2>{{ $t('howToAddPopup.title') }}</h2>

      <h3>{{ $t('howToAddPopup.iphone.title') }}</h3>
      <ol>
        <li>{{ $t('howToAddPopup.iphone.step1') }}</li>
        <li>{{ $t('howToAddPopup.iphone.step2') }}</li>
        <li>{{ $t('howToAddPopup.iphone.step3') }}</li>
      </ol>

      <h3>{{ $t('howToAddPopup.android.title') }}</h3>
      <ol>
        <li v-html="$t('howToAddPopup.android.step1')"></li>
        <li>{{ $t('howToAddPopup.android.step2') }}</li>
        <li>{{ $t('howToAddPopup.android.step3') }}</li>
      </ol>

      <div class="buttons">
        <button @click="closePopup">{{ $t('howToAddPopup.closeButton') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';

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

/**
 * ポップアップを閉じる処理を行います。
 */
const closePopup = () => {
  emit('close'); // 'close'イベントを発行してポップアップを閉じる
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
