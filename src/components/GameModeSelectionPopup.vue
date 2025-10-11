<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-container">
      <div class="popup-header">
        <h2 class="popup-title">{{ $t('gameModeSelection.title') }}</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      <div class="popup-content">
        <p class="description">{{ $t('gameModeSelection.description') }}</p>
        <div class="mode-selection-buttons">
          <button class="mode-button classic-button" @click="selectMode('classic')">
            <span class="button-text">{{ $t('gameModeSelection.classic') }}</span>
            <span class="button-description">{{ $t('gameModeSelection.classicDescription') }}</span>
          </button>
          <button class="mode-button stock-button" @click="selectMode('stock')">
            <span class="button-text">{{ $t('gameModeSelection.stock') }}</span>
            <span class="button-description">{{ $t('gameModeSelection.stockDescription') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ゲームモード選択ポップアップコンポーネント。
 * 'classic' または 'stock' ルールを選択します。
 */
import { defineEmits } from 'vue';

const emit = defineEmits(['close', 'mode-selected']);

/**
 * 選択されたモードを親コンポーネントに通知します。
 * @param {string} mode - 'classic' または 'stock'
 */
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
  background: linear-gradient(180deg, #f3f0e9, #e4e0d7);
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 340px;
  border: 2px solid #7a6a53;
  position: relative;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  padding: 20px;
}

.popup-header {
  text-align: center;
  margin-bottom: 15px;
  position: relative;
}

.popup-title {
  font-size: 1.5em;
  color: #5c4b33;
  font-weight: 700;
  margin: 0;
}

.close-button {
  position: absolute;
  top: -15px;
  right: -10px;
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

.popup-content .description {
  font-size: 0.9em;
  color: #6d5f4b;
  text-align: center;
  margin-bottom: 20px;
}

.mode-selection-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mode-button {
  padding: 10px;
  border-radius: 10px;
  border: 2px solid #a4957d;
  background-color: #fff;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mode-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.classic-button {
  background: linear-gradient(180deg, #ffffff, #f8f8f0);
}

.stock-button {
  background: linear-gradient(180deg, #e8e8e8, #dcdcdc);
}

.button-text {
  font-size: 1.3em;
  font-weight: bold;
  color: #586810;
}

.button-description {
  font-size: 0.8em;
  color: #6d5f4b;
  margin-top: 5px;
}
</style>
