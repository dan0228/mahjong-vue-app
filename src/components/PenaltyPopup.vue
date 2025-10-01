<template>
  <transition name="popup">
    <div v-if="userStore.showPenaltyPopup" class="penalty-popup-overlay">
      <div class="penalty-popup-content">
        <h2 class="popup-title">{{ $t('penaltyPopup.title') }}</h2>
        <div class="penalty-details">
          <p class="popup-message win-streak-reset">{{ $t('penaltyPopup.message2') }}</p>
          <div class="coin-penalty-display">
            <img src="/assets/images/info/cat_coin.png" alt="Cat Coin" class="cat-coin-icon" crossorigin="anonymous">
            <span class="negative-gain">-390</span>
          </div>
        </div>
        <button @click="closePopup" class="popup-button">{{ $t('penaltyPopup.closeButton') }}</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore';
import { useI18n } from 'vue-i18n';

const userStore = useUserStore();
const { t } = useI18n();

const closePopup = () => {
  userStore.setShowPenaltyPopup(false);
  // ポップアップを閉じた後に最新のユーザーデータを再フェッチ
  // これにより、UIに最新の連勝数や猫コインが反映される
  userStore.fetchUserProfile({ showLoading: false });
};
</script>

<style scoped>
.penalty-popup-overlay {
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

.penalty-popup-content {
  background-color: white;
  padding:10px; /* パディングを小さく */
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 350px; /* 最大幅を小さく */
  width: 90%;
  color: #333;
  font-family: 'M PLUS Rounded 1c', sans-serif; /* プロジェクトのフォントに合わせる */
}

.popup-title {
  font-size: 2.1em; /* タイトルフォントを少し小さく */
  color: #b34d4a; /* 赤系の色で警告感を出す */
  margin-bottom: 15px; /* マージンを調整 */
  font-weight: bold;
  white-space: pre-line; /* 改行を反映 */
}

.penalty-details {
  margin-bottom: 15px; /* マージンを調整 */
}

.popup-message {
  font-size: 1em; /* メッセージフォントを少し小さく */
  margin-bottom: 8px;
  line-height: 1.5;
}

.win-streak-reset {
  font-size: 1.8em; /* 猫コインの増減値と同じサイズに */
  font-weight: bold;
  color: #f44336; /* 赤色 */
  margin-top: 10px; /* マージンを調整 */
  margin-bottom: 10px; /* マージンを調整 */
}

.coin-penalty-display {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
}

.cat-coin-icon {
  width: 50px; /* アイコンサイズを少し小さく */
  height: 50px;
  margin-right: 8px;
}

.negative-gain {
  font-size: 1.8em; /* 猫コインの増減値 */
  font-weight: bold;
  color: #f44336; /* 赤色 */
}

.popup-button {
  background-color: #f44336; /* 赤系の色で警告感を出す */
  color: white;
  border: none;
  padding: 10px 20px; /* パディングを調整 */
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em; /* ボタンフォントを少し小さく */
  margin-top: 15px; /* マージンを調整 */
  transition: background-color 0.3s ease;
}

.popup-button:hover {
  background-color: #da190b;
}

/* Transition styles */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.popup-enter-from, .popup-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
</style>