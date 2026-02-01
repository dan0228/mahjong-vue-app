<template>
  <transition name="popup">
    <div
      v-if="userStore.showPenaltyPopup"
      class="penalty-popup-overlay"
    >
      <div class="penalty-popup-content">
        <!-- メッセージを動的に表示 -->
        <p class="popup-message">
          {{ userStore.penaltyMessage }}
        </p>
        <button
          class="popup-button"
          @click="closePopup"
        >
          {{ $t('penaltyPopup.closeButton') }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

const closePopup = () => {
  userStore.setShowPenaltyPopup(false);
  // 汎用的なポップアップになったため、特定の再フェッチ処理は削除
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
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 350px;
  width: 90%;
  color: #333;
  font-family: 'M PLUS Rounded 1c', sans-serif;
}

.popup-message {
  font-size: 1.2em;
  margin-bottom: 20px;
  line-height: 1.6;
  font-weight: bold;
  white-space: pre-line; /* メッセージ内の改行を反映させる */
}

.popup-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
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
