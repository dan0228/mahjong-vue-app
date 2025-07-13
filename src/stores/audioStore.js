// src/stores/audioStore.js
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    volume: 0.4,
    isBgmEnabled: true, // デフォルトはオン
    isSeEnabled: true,  // デフォルトはオン
    currentBgm: null,
  }),
  actions: {
    setVolume(newVolume) {
      this.volume = Math.max(0, Math.min(1, newVolume)); // Clamp between 0 and 1
    },
    toggleBgm() {
      this.isBgmEnabled = !this.isBgmEnabled;
    },
    toggleSe() {
      this.isSeEnabled = !this.isSeEnabled;
    },
    setBgm(bgm) {
      this.currentBgm = bgm;
    },
    playSound(sound) {
      if (this.isSeEnabled) {
        const audio = new Audio(`/assets/sounds/${sound}`);
        audio.volume = this.volume;
        audio.play().catch(e => console.error("効果音の再生に失敗しました:", e));
      }
    },
  },
});