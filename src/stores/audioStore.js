// src/stores/audioStore.js
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    volume: 0.4,
  }),
  actions: {
    setVolume(newVolume) {
      this.volume = Math.max(0, Math.min(1, newVolume)); // Clamp between 0 and 1
    },
  },
});
