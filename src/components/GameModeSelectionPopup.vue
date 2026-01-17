<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-container">
      <button class="close-button" @click="$emit('close')">×</button> <!-- Close button moved here -->
      <div class="popup-content">
        <div class="mode-option" @click="selectMode('classic')">
          <div class="mode-title">{{ t('gameModeSelection.classic') }}</div>
          <div class="mode-description" v-html="t('gameModeSelection.classicDescription')"></div>
        </div>
        <div class="mode-option" @click="selectMode('stock')">
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
  background-image: url('/assets/images/back/mode_back.png'); /* 背景画像に変更 */
  background-size: cover;
  background-position: center;
  border-radius: 0px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  width: 600px;
  height: 180px;
  position: relative;
  font-family: 'Yuji Syuku', serif;
  padding: 20px;
  display: flex; /* Flexboxを使ってコンテンツを中央に配置 */
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.close-button {
  position: absolute;
  top: 8px; /* 位置を微調整 */
  right: 8px; /* 位置を微調整 */
  background: rgba(122, 106, 83, 0.6); /* 半透明の背景色 */
  color: rgba(255, 255, 255, 0.8); /* 文字色も半透明に */
  border: 0px solid rgba(255, 255, 255, 0.5); /* 細く、半透明の枠線 */
  border-radius: 50%;
  width: 24px; /* 小さく */
  height: 24px; /* 小さく */
  font-size: 1.2em; /* 文字サイズも小さく */
  line-height: 22px; /* 行の高さを調整 */
  cursor: pointer;
  box-shadow: none; /* 影を削除 */
  z-index: 10;
  transition: background 0.2s, color 0.2s, border-color 0.2s; /* ホバー効果のためのトランジション */
}

.close-button:hover {
  background: rgba(122, 106, 83, 0.8); /* ホバーで少し濃く */
  color: white; /* ホバーで文字を白に */
}

.popup-content {
  display: flex;
  flex-direction: row; /* 左右に配置 */
  justify-content: center; /* 中央揃え */
  gap: 22px; /* オプション間のスペースを広げる */
  margin-top: 0px; /* 上部の余白 */
  margin-right: 18px;
}

.mode-option {
  background: none; /* 背景を削除 */
  border: none; /* 枠線を削除 */
  font-family: 'Yuji Syuku', serif;
  color: #4a2c1a;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 10px 15px; /* パディングを調整 */
  margin-bottom: 10px;
  transition: transform 0.2s, color 0.2s; /* box-shadowのトランジションは不要 */
  position: relative;
  text-align: center;
  box-shadow: none; /* 影を削除 */
}

.mode-option:hover {
  transform: scale(1.05); /* 少し拡大 */
  color: #7a6a53; /* ホバーで色変更 */
  text-shadow: 0px 0px 8px rgba(255, 255, 255, 1); /* より強い光彩効果 */
}

.mode-title {
  font-size: 1.5em; /* タイトルを大きく */
  font-weight: bold;
  margin-bottom: 5px; /* タイトルと説明文の間隔 */
  color: #4a2c1a; /* タイトルの色 */
}

.mode-description {
  font-size: 0.9em; /* 説明文のサイズ */
  line-height: 1.4;
  color: #6d5f4b; /* 説明文の色 */
}

</style>