<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-container">
      <button class="close-button" @click="$emit('close')">×</button>
      <div class="popup-content">
        <div class="mode-option mode-left" @click="selectMode('classic')">
          <div class="mode-title">{{ t('gameModeSelection.classic') }}</div>
          <div class="mode-description" v-html="t('gameModeSelection.classicDescription')"></div>
        </div>
        <div class="mode-option mode-right" @click="selectMode('stock')">
          <div class="mode-title">{{ t('gameModeSelection.stock') }}</div>
          <div class="mode-description" v-html="t('gameModeSelection.stockDescription')"></div>
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
  background-image: url('/assets/images/back/mode_back.png');
  background-size: cover;
  background-position: center;
  border-radius: 0px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  width: 650px;
  height: 180px;
  position: relative;
  font-family: 'Yuji Syuku', serif;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* 勢いよく登場するアニメーション */
  animation: slap-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(122, 106, 83, 0.6);
  color: rgba(255, 255, 255, 0.8);
  border: 0px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 1.2em;
  line-height: 22px;
  cursor: pointer;
  box-shadow: none;
  z-index: 10;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.close-button:hover {
  background: rgba(122, 106, 83, 0.8);
  color: white;
}

.popup-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.mode-option {
  width: 130px; /* コンテナの幅を固定してテキストを改行させる */
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-family: 'Yuji Syuku', serif;
  color: #4a2c1a;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 10px 0px;
  transition: transform 0.2s, color 0.2s;
  text-align: center;
  box-shadow: none;
}

.mode-left {
  left: 10px; /* この値を調整して左側のモードの位置を変更 */
  top: 80px;
}

.mode-right {
  right: 20px; /* この値を調整して右側のモードの位置を変更 */
  top: 80px;
}

.mode-option:hover {
  transform: translateY(-50%) scale(1.05); /* Y軸方向の変異を維持しつつ拡大 */
  color: #7a6a53;
  text-shadow: 0px 0px 8px rgba(255, 255, 255, 1);
}

.mode-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 5px;
  color: #4a2c1a;
}

.mode-description {
  font-size: 0.9em;
  line-height: 1.2;
  color: #6d5f4b;
}

/* 勢いよく登場するアニメーションのキーフレーム */
@keyframes slap-in {
  0% {
    opacity: 0;
    transform: scale(1.5); /* 手前にある状態 */
  }
  60% {
    opacity: 1;
    transform: scale(0.95); /* 勢い余って少し行き過ぎる（机にめり込むイメージ） */
  }
  80% {
    transform: scale(1.02); /* 反動で少し浮く */
  }
  100% {
    transform: scale(1);    /* 定位置 */
  }
}
</style>
