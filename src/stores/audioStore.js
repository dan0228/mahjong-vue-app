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
      if (this.isSwitchingBgm) {
        return;
      }
      this.isSwitchingBgm = true;

      // 同じBGMが指定された場合でも、再生位置をリセットして再生し直す
      if (this.currentBgm === newBgmName) {
        const audio = this.audioPlayers.get(`/assets/sounds/${newBgmName}`);
        if (audio) {
          audio.currentTime = 0;
          if (!audio.paused && this.isBgmEnabled) {
            // 既に再生中であれば、そのまま再生を続ける（最初からになる）
            // そうでなければ、play()で再生を開始
            try {
              await audio.play();
            } catch (e) {
              console.error("BGMの再生に失敗しました:", e);
            }
          }
        }
        this.isSwitchingBgm = false;
        return;
      }

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
        } catch (e) {
          console.error("BGMの再生に失敗しました:", e);
        }
      }
      
      this.isSwitchingBgm = false;
    },
    playSound(sound) {
      if (this.isSeEnabled) {
        let audio = this.audioPlayers.get(`/assets/sounds/${sound}`);
        if (!audio) {
          // プリロードされていない場合、新しいAudioオブジェクトを作成して保存
          audio = new Audio(`/assets/sounds/${sound}`);
          this.audioPlayers.set(`/assets/sounds/${sound}`, audio);
        }
        audio.currentTime = 0;
        audio.volume = this.volume;
        audio.play().catch(e => console.error("効果音の再生に失敗しました:", e));
      }
    },
    handleVisibilityChange() {
      if (document.hidden) {
        // ページが非表示になったらすべてのオーディオを一時停止
        this.audioPlayers.forEach(audio => {
          if (!audio.paused) {
            audio.pause();
          }
        });
      } else {
        // ページが再び表示されたら、有効なオーディオを再生再開
        this.audioPlayers.forEach((audio, url) => {
          // BGMの場合
          if (url.includes(this.currentBgm) && this.isBgmEnabled) {
            audio.play().catch(e => console.error("BGMの再生に失敗しました:", e));
          }
          // SEの場合 (BGMと異なるURLで、かつSEが有効な場合)
          else if (!url.includes(this.currentBgm) && this.isSeEnabled) {
            // 効果音は通常ループしないため、再生中のものだけを再開
            // ここでは、効果音は短いため、再開の必要はないと判断し、BGMのみを対象とする
            // もし効果音も長時間再生されるものがある場合は、別途状態管理が必要
          }
        });
      }
    },
    
  },
});