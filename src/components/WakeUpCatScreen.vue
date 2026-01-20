<template>
  <div class="wake-up-screen-overlay">
    <div class="content-container">
      <img v-if="isSleeping" src="/assets/images/back/sleeping.gif" alt="Sleeping Cat" class="cat-gif" />
      <img v-if="isWakingUp" :src="wakeupGifSrc" alt="Waking Up Cat" class="cat-gif" />
      
      <button v-if="isSleeping" @click="wakeUp" class="wake-up-button">
        {{ $t('wakeUpCat.button') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAudioStore } from '@/stores/audioStore';

const { t } = useI18n();



const emit = defineEmits(['finished']);

const audioStore = useAudioStore();

const isSleeping = ref(true);
const isWakingUp = ref(false);
const wakeupGifSrc = ref('');

const wakeUp = () => {
  isSleeping.value = false;
  isWakingUp.value = true;
  // GIFを最初から再生するためにキャッシュを無効化する
  wakeupGifSrc.value = `/assets/images/back/wakeup.gif?t=${Date.now()}`;
  
  // 効果音を再生
  audioStore.playSound('Kagura_Suzu01-7.mp3');

  // GIFの再生時間（仮に2.5秒）後に 'finished' イベントを発行
  setTimeout(() => {
    emit('finished');
  }, 2500);
};
</script>



<style scoped>
.wake-up-screen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9998; /* ローディング画面の直下 */
}

.content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.cat-gif {
  max-width: 90vw;
  max-height: 70vh;
  border-radius: 10px;
}

.wake-up-button {
  background-image: url('/assets/images/button/board_hand.png');
  background-size: 100% 100%;
  background-color: transparent;
  border: none;
  color: #4a2c12;
  font-weight: bold;
  text-shadow: none;
  filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.4));
  transition: all 0.1s ease-out;
  padding: 12px 24px;
  font-size: 1.2em;
  cursor: pointer;
  font-family: 'Yuji Syuku', serif;
}

.wake-up-button:hover {
  filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.4)) brightness(1.1);
}

.wake-up-button:active {
  transform: translateY(1px);
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5));
}
</style>
