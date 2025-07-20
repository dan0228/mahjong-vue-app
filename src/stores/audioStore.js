// src/stores/audioStore.js
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    volume: 0.4,
    isBgmEnabled: true, // デフォルトはオン
    isSeEnabled: true,  // デフォルトはオン
    currentBgm: null,
    audioPlayers: new Map(), // プリロードしたAudioオブジェクトを格納
    isSwitchingBgm: false, // BGM切り替え中フラグ
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
    async setBgm(newBgmName, fadeDuration = 100) {
      if (this.isSwitchingBgm || this.currentBgm === newBgmName) {
        return;
      }
      this.isSwitchingBgm = true;

      const oldBgmName = this.currentBgm;
      const oldAudio = oldBgmName ? this.audioPlayers.get(`/assets/sounds/${oldBgmName}`) : null;

      // Fade out
      if (oldAudio && !oldAudio.paused) {
        await new Promise(resolve => {
          let currentVolume = oldAudio.volume;
          const fadeStep = currentVolume / (fadeDuration / 50);
          const fadeOutInterval = setInterval(() => {
            currentVolume -= fadeStep;
            if (currentVolume <= 0) {
              clearInterval(fadeOutInterval);
              oldAudio.pause();
              oldAudio.currentTime = 0;
              oldAudio.volume = this.volume; // Reset volume for next time
              resolve();
            } else {
              oldAudio.volume = currentVolume;
            }
          }, 50);
        });
      }

      this.currentBgm = newBgmName;
      const newAudio = newBgmName ? this.audioPlayers.get(`/assets/sounds/${newBgmName}`) : null;

      // Fade in
      if (newAudio && this.isBgmEnabled) {
        newAudio.currentTime = 0;
        newAudio.volume = 0; // Set volume to 0 before playing
        newAudio.loop = true;
        newAudio.play().catch(e => console.error("BGMの再生に失敗しました:", e));
        
        let targetVolume = this.volume;
        let currentVolume = 0;
        const fadeStep = targetVolume / (fadeDuration / 50);
        const fadeInInterval = setInterval(() => {
          if (document.hidden) return; // タブが非表示の場合はフェードインを一時停止
          currentVolume += fadeStep;
          if (currentVolume >= targetVolume) {
            clearInterval(fadeInInterval);
            newAudio.volume = targetVolume;
          } else {
            newAudio.volume = currentVolume;
          }
        }, 50);
      }
      
      // Allow new BGM changes after the transition is complete
      setTimeout(() => {
        this.isSwitchingBgm = false;
      }, fadeDuration);
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
    playBgmOnInteraction() {
      const audio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
      if (audio && audio.paused && this.isBgmEnabled) {
        audio.play().catch(e => console.error("BGMの再生に失敗しました:", e));
      }
    },
  },
});