// src/stores/audioStore.js
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    volume: 0.4,
    isBgmEnabled: true, // デフォルトはオン
    isSeEnabled: true,  // デフォルトはオン
    currentBgm: null,
    audioPlayers: new Map(), // プリロードしたAudioオブジェクトを格納
  }),
  actions: {
    async preloadAudio(urls, onProgress = () => {}) {
      let loadedCount = 0;
      const promises = urls.map(url => {
        return new Promise((resolve, reject) => {
          const audio = new Audio(url);
          audio.preload = 'auto';
          audio.oncanplaythrough = () => {
            this.audioPlayers.set(url, audio);
            loadedCount++;
            onProgress(loadedCount / urls.length);
            resolve();
          };
          audio.onerror = () => {
            console.error(`Failed to load audio: ${url}`);
            loadedCount++; // エラーでも進捗を進める
            onProgress(loadedCount / urls.length);
            reject();
          };
          audio.load(); // ロードを開始
        });
      });
      await Promise.all(promises);
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
        const audio = this.audioPlayers.get(`/assets/sounds/${sound}`);
        if (audio) {
          audio.currentTime = 0; // 再生位置を先頭に戻す
          audio.volume = this.volume;
          audio.play().catch(e => console.error("効果音の再生に失敗しました:", e));
        } else {
          console.warn(`Audio not preloaded: /assets/sounds/${sound}`);
          // Fallback: if not preloaded, create new Audio object
          const newAudio = new Audio(`/assets/sounds/${sound}`);
          newAudio.volume = this.volume;
          newAudio.play().catch(e => console.error("効果音の再生に失敗しました:", e));
        }
      }
    },
  },
});