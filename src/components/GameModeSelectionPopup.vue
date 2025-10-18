<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-container">
      <div class="popup-header">
        <h2 class="popup-title">{{ t('gameModeSelection.title') }}</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      <div class="popup-content">
        <div class="mode-selection-cards">
          <!-- Classic Rule Card -->
          <div class="rule-card classic" @click="selectMode('classic')">
            <div class="rule-title">{{ t('gameModeSelection.classic') }}</div>
            <div class="rule-description" v-html="t('gameModeSelection.classicDescription')"></div>
          </div>

          <!-- Stock Rule Card -->
          <div class="rule-card stock" @click="selectMode('stock')">
            <div class="badge">{{ t('gameModeSelection.recommended') }}</div>
            <div class="rule-title">{{ t('gameModeSelection.stock') }}</div>
            <div class="rule-description" v-html="t('gameModeSelection.stockDescription')"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const emit = defineEmits(['close', 'mode-selected']);

const selectMode = (mode) => {
  emit('mode-selected', mode);
};
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
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-container {
  background: linear-gradient(180deg, #ffffff, #ffffff);
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  border: 2px solid #7a6a53;
  position: relative;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  padding: 20px;
}

.popup-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.popup-title {
  font-size: 1.6em;
  color: #5c4b33;
  font-weight: 700;
  margin: 0;
}

.close-button {
  position: absolute;
  top: -15px;
  right: -15px;
  background: #7a6a53;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 1.5em;
  line-height: 26px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.mode-selection-cards {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.rule-card {
  position: relative;
  width: 150px;
  height: 180px;
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.rule-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* --- Classic Card Style --- */
.rule-card.classic {
  background: linear-gradient(145deg, #fffbf0, #f8f2e0);
  border: 2px solid #c8bda5;
}

.rule-card.classic .rule-title {
  color: #6d5f4b;
}

.rule-card.classic .rule-description {
  color: #8c7d6b;
}

/* --- Stock Card Style --- */
.rule-card.stock {
  background: linear-gradient(145deg, #eef7ff, #dbeffa);
  border: 2px solid #b0cde0;
}

.rule-card.stock .rule-title {
  color: #3a5a70;
}

.rule-card.stock .rule-description {
  color: #5a7a90;
}


.rule-title {
  font-size: 1.4em;
  font-weight: bold;
  margin-bottom: 10px;
}

.rule-description {
  font-size: 0.85em;
  line-height: 1.5;
}

.badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #e74c3c;
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.8em;
  font-weight: bold;
  transform: rotate(15deg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>