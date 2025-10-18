<template>
  <transition name="popup">
    <div class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-content">
        <h2>{{ $t('rulePopup.title') }}</h2>

        <!-- Tab Buttons -->
        <div class="tab-buttons">
          <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">
            {{ $t('rulePopup.tabs.basic') }}
          </button>
          <button :class="{ active: activeTab === 'stock' }" @click="activeTab = 'stock'">
            {{ $t('rulePopup.tabs.stock') }}
          </button>
        </div>

        <div class="popup-body">
          <!-- Basic Rules Content -->
          <div v-if="activeTab === 'basic'">
            <p class="subtitle">{{ $t('rulePopup.subtitle') }}</p>
            <div v-for="section in basicRuleSections" :key="section" class="section">
              <h3>{{ $t(`rulePopup.sections.${section}.title`) }}</h3>
              <p>{{ $t(`rulePopup.sections.${section}.description`) }}</p>
            </div>
          </div>

          <!-- Stock Rules Content -->
          <div v-if="activeTab === 'stock'">
            <div class="section">
              <h3>{{ $t('rulePopup.stockTitle') }}</h3>
              <p>{{ $t('rulePopup.stockDescription') }}</p>
            </div>
            <div class="section">
              <h3>{{ $t('rulePopup.stockConditionsTitle') }}</h3>
              <ul>
                <li v-for="item in $tm('rulePopup.stockConditions')" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div class="section">
              <h3>{{ $t('rulePopup.stockUsageTitle') }}</h3>
              <ul>
                <li v-for="item in $tm('rulePopup.stockUsage')" :key="item">{{ item }}</li>
              </ul>
            </div>
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

defineEmits(['close']);

const activeTab = ref('basic'); // 'basic' or 'stock'

// 表示するルールセクションのキーリスト
const basicRuleSections = ref([
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
  display: flex;
  flex-direction: column;
}
.popup-content h2 {
  margin-top: 0;
  margin-bottom: 15px; /* タブとの間隔 */
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
  flex-grow: 1; /* 内容部分が残りの高さを埋めるように */
  overflow-y: auto; /* 内容が多ければスクロール */
}
.section {
  margin-bottom: 20px;
}
.section h3 {
  font-size: 1.1em;
  text-align: left;
  margin-bottom: 8px;
  color: #586810;
  border-bottom: 2px solid #d8c8a0;
  padding-bottom: 5px;
}
.section p, .section ul {
  margin-left: 10px;
  margin-right: 10px;
}
.section ul {
  padding-left: 20px;
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

/* Tab styles */
.tab-buttons {
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
}
.tab-buttons button {
  padding: 10px 15px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 1em;
  color: #666;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px; /* 下線を親のborderに重ねる */
}
.tab-buttons button.active {
  color: #000;
  font-weight: bold;
  border-bottom-color: #586810;
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
