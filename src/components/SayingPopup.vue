<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-content">
      <button class="close-button" @click="$emit('close')">×</button>
      <p v-if="fortune" class="fortune-text"><strong>{{ $t('sayingPopup.fortune') }}</strong>{{ fortune }}</p>
      <p class="saying-text-with-prefix">
        <strong>{{ $t('sayingPopup.oracle') }}</strong>
        <span v-if="sayingNumber !== null">{{ $t('sayingPopup.sayingNo', { n: sayingNumber }) }}</span><span v-if="isNew" class="new-tag">{{ $t('sayingPopup.newTag') }}</span><br>{{ saying }}
      </p>
      <button @click="$emit('close')" class="new-close-button">{{ $t('sayingPopup.closeButton') }}</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n(); // i18nの翻訳関数を取得

/**
 * コンポーネントのプロパティを定義。
 * @property {string} saying - 表示する名言のテキスト。
 * @property {string} fortune - 表示する運勢のテキスト。
 * @property {string} sayingId - 名言のID（例: 's001'）。
 * @property {boolean} isNew - 新しく解放された名言かどうか。
 */
const props = defineProps({
  saying: String,
  fortune: String,
  sayingId: String,
  isNew: Boolean,
});

/**
 * コンポーネントが発行するイベントを定義。
 * @event close - ポップアップを閉じる際に発行されます。
 */
defineEmits(['close']);

/**
 * `sayingId` から名言の番号を抽出して返します。
 * 例: 's001' -> 1
 */
const sayingNumber = computed(() => {
  if (props.sayingId) {
    const match = props.sayingId.match(/s(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
  return null;
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');

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

.popup-content {
  /* 背景画像を設定 */
  background: url('/assets/images/back/omikuji_back.png') no-repeat center 20%; /* 垂直位置を20%（少し上）に調整 */
  background-size: contain;
  
  /* 既存のボーダーや背景色は不要に */
  border: none;
  
  /* テキストを画像内に配置するための調整 */
  padding: 120px 40px 25px; /* 上の余白を増やして文字を下に移動 */
  
  /* 画像のアスペクト比に合わせてサイズを調整 (要調整) */
  width: 90vw;
  max-width: 400px;
  aspect-ratio: 3 / 4;

  /* その他スタイル */
  border-radius: 15px;
  text-align: center;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fortune-text {
  font-family: 'Yuji Syuku', serif;
  font-size: 1.25rem;
  color: #4d2c1c; /* 色を濃い茶色に変更 */
  margin-bottom: 15px;
  text-align: left;
}

.saying-text-with-prefix {
  font-family: 'Yuji Syuku', serif;
  font-size: 1rem;
  color: #4d2c1c; /* 色を濃い茶色に変更 */
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
  text-align: left;
}

.new-tag {
  font-size: 0.8em;
  color: #e53935;
  font-weight: bold;
  margin-left: 15px;
  vertical-align: super;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2.5rem;
  cursor: pointer;
  color: #5a4a42;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.new-close-button {
  position: absolute;
  bottom: 90px;
  right: 35px;
  background: none;
  border: none;
  font-family: 'Yuji Syuku', serif;
  font-size: 0.85rem;
  color: #4d2c1c;
  cursor: pointer;
  padding: 5px;
  opacity: 0.9;
}
</style>
