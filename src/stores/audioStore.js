// src/stores/audioStore.js
// オーディオ再生に関する状態とロジックを管理するPiniaストア
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    volume: 0.4,
    isBgmEnabled: true,
    isSeEnabled: true,
    currentBgm: null,
    audioPlayers: new Map(),
    isSwitchingBgm: false,
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
            loadedCount++;
            onProgress(loadedCount / urls.length);
            reject();
          };
          audio.load();
        });
      });
      await Promise.all(promises);
    },
    toggleBgm() {
      this.isBgmEnabled = !this.isBgmEnabled;
      const audio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
      if (audio) {
        if (this.isBgmEnabled) {
          audio.play();
        } else {
          audio.pause();
        }
      }
    },
    toggleSe() {
      this.isSeEnabled = !this.isSeEnabled;
    },
    async setBgm(newBgmName) {
      console.log(`setBgm called: ${newBgmName}, currentBgm: ${this.currentBgm}, isSwitchingBgm: ${this.isSwitchingBgm}`);
      if (this.isSwitchingBgm || this.currentBgm === newBgmName) {
        return;
      }
      this.isSwitchingBgm = true;

      const oldBgmName = this.currentBgm;
      const oldAudio = oldBgmName ? this.audioPlayers.get(`/assets/sounds/${oldBgmName}`) : null;

      if (oldAudio && !oldAudio.paused) {
        oldAudio.pause();
        oldAudio.currentTime = 0;
      }

      this.currentBgm = newBgmName;
      const newAudio = newBgmName ? this.audioPlayers.get(`/assets/sounds/${newBgmName}`) : null;

      if (newAudio && this.isBgmEnabled) {
        if (!newAudio.paused) {
          newAudio.pause();
          newAudio.currentTime = 0;
        }
        newAudio.volume = this.volume;
        newAudio.loop = true;
        try {
          await newAudio.play();
          console.log(`Successfully played BGM: ${newBgmName}`);
        } catch (e) {
          console.error("BGMの再生に失敗しました:", e);
        }
      }
      
      this.isSwitchingBgm = false;
    },
    playSound(sound) {
      if (this.isSeEnabled) {
        const audio = this.audioPlayers.get(`/assets/sounds/${sound}`);
        if (audio) {
          audio.currentTime = 0;
          audio.volume = this.volume;
          audio.play().catch(e => console.error("効果音の再生に失敗しました:", e));
        } else {
          console.warn(`Audio not preloaded: /assets/sounds/${sound}`);
          // プリロードされていない場合、新しいAudioオブジェクトを作成して再生
          const newAudio = new Audio(`/assets/sounds/${sound}`);
          newAudio.volume = this.volume;
          newAudio.play().catch(e => console.error("効果音の再生に失敗しました:", e));
        }
      }
    },
    handleVisibilityChange() {
      const audio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
      if (audio) {
        if (document.hidden) {
          audio.pause();
        } else {
          if (this.isBgmEnabled) {
            audio.play().catch(e => console.error("BGMの再生に失敗しました:", e));
          }
        }
      }
    },
    
  },
});