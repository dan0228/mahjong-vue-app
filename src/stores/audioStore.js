// src/stores/audioStore.js
// オーディオ再生に関する状態とロジックを管理するPiniaストア
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    volume: localStorage.getItem('volume') === null ? 0.3 : parseFloat(localStorage.getItem('volume')), // 統一された音量
    isAudioEnabled: localStorage.getItem('isAudioEnabled') === null ? true : localStorage.getItem('isAudioEnabled') === 'true', // 統一された有効フラグ
    currentBgm: null, // 現在再生中のBGMのファイル名 (例: 'NES-JP-A01-2(Title-Loop115).mp3')
    audioPlayers: new Map(), // プリロードされたAudioオブジェクトを格納するMap (URL -> Audioオブジェクト)
    isSwitchingBgm: false, // BGM切り替え処理中かどうかのフラグ
    isBgmPlaybackAllowed: false, // BGMの再生が許可されているかどうかのフラグ
    isWaitingForSilentEnd: false, // 遅延再生用の無音オーディオ再生中フラグ
    // 特定のBGMの音量倍率を定義
    bgmVolumeMultipliers: {
      'takibi.mp3': 0.8, // 焚き火の音量に倍率を設定
      'NES-JP-A02-2(Stage1-Loop110).mp3': 0.3, // マッチング画面のBGMを少し小さく
    },
    loopingSoundEffects: new Map(), // ループ中の効果音を管理
  }),
  actions: {
    stopAllLoopingSounds() {
      this.loopingSoundEffects.forEach((soundData) => {
        soundData.player.pause();
        soundData.player.currentTime = 0;
      });
      this.loopingSoundEffects.clear();
    },
    /**
     * 指定されたURLのオーディオファイルをプリロードします。
     * 読み込みの進捗状況をコールバック関数で報告できます。
     * @param {Array<string>} urls - プリロードするオーディオファイルのURLの配列。
     * @param {Function} [onProgress] - 各ファイルが読み込まれるたびに呼び出されるコールバック関数。
     *                                  引数として現在の進捗率（0から1の間の数値）を受け取ります。
     * @returns {Promise<void>} 全てのオーディオファイルが正常に読み込まれた場合に解決されるPromise。
     *                          いずれかのファイルの読み込みに失敗した場合は拒否されます。
     */
    async preloadAudio(urls, onProgress = () => {}) {
      let loadedCount = 0;
      const promises = urls.map(url => {
        return new Promise((resolve, reject) => {
          const audio = new Audio(url);
          audio.preload = 'auto'; // 自動プリロード設定
          audio.oncanplaythrough = () => {
            this.audioPlayers.set(url, audio); // 読み込み完了したAudioオブジェクトをMapに保存
            loadedCount++;
            onProgress(loadedCount / urls.length); // 進捗を報告
            resolve();
          };
          audio.onerror = () => {
            console.error(`オーディオの読み込みに失敗しました: ${url}`);
            loadedCount++;
            onProgress(loadedCount / urls.length);
            reject();
          };
          audio.load(); // オーディオの読み込みを開始
        });
      });
      await Promise.all(promises); // 全てのPromiseが解決するのを待つ
    },

    /**
     * 全ての音声の有効/無効を切り替えます。
     */
    toggleAudio() {
      this.isAudioEnabled = !this.isAudioEnabled;
      localStorage.setItem('isAudioEnabled', this.isAudioEnabled);

      if (!this.isAudioEnabled) {
        // Disable audio: pause everything
        this.audioPlayers.forEach(audio => {
          if (!audio.paused) {
            audio.pause();
          }
        });
      } else {
        // Enable audio: resume what should be playing
        const bgmAudio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
        if (bgmAudio && this.isBgmPlaybackAllowed) {
          bgmAudio.play().catch(e => console.error("BGM resume failed", e));
        }
        this.loopingSoundEffects.forEach(soundData => {
          soundData.player.play().catch(e => console.error("Looping SE resume failed", e));
        });
      }
    },

    /**
     * 全ての音声の音量を設定します。
     * @param {number} newVolume - 新しい音量 (0.0から1.0)
     */
    setVolume(newVolume) {
      this.volume = Math.max(0, Math.min(1, newVolume));
      localStorage.setItem('volume', this.volume);

      // Update BGM volume
      const bgmAudio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
      if (bgmAudio) {
        const multiplier = this.bgmVolumeMultipliers[this.currentBgm] || 1;
        bgmAudio.volume = Math.min(1, this.volume * multiplier);
      }

      // Update looping sound effects volume
      this.loopingSoundEffects.forEach((soundData) => {
        soundData.player.volume = Math.min(1, this.volume * soundData.volume);
      });
    },

    /**
     * BGMの再生が許可されているかどうかを設定します。
     * @param {boolean} allowed - 再生を許可する場合はtrue、しない場合はfalse。
     */
    setBgmPlaybackAllowed(allowed) {
      this.isBgmPlaybackAllowed = allowed;
      // 再生が許可されていない場合は、現在のBGMを一時停止
      if (!allowed) {
        const audio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
        if (audio && !audio.paused) {
          audio.pause();
        }
      }
    },

    /**
     * 現在のBGMを新しいBGMに切り替えて再生します。
     * 同じBGMが指定された場合は、再生位置をリセットして再開します。
     * @param {string|null} newBgmName - 新しいBGMのファイル名 (例: 'bgm.mp3')。nullを指定すると現在のBGMを停止します。
     * @returns {Promise<void>} BGMの切り替えが完了したときに解決されるPromise。
     */
    async setBgm(newBgmName) {
      // 遅延再生待機中の場合は、この関数による即時再生をブロック
      if (this.isWaitingForSilentEnd) {
        return;
      }
      if (this.isSwitchingBgm) {
        return; // 既に切り替え処理中の場合は何もしない
      }
      this.isSwitchingBgm = true; // 切り替え処理中フラグを立てる

      const oldBgmName = this.currentBgm;
      const oldAudio = oldBgmName ? this.audioPlayers.get(`/assets/sounds/${oldBgmName}`) : null;

      // 現在再生中のBGMがあれば停止し、再生位置をリセット
      if (oldAudio && !oldAudio.paused) {
        oldAudio.pause();
        oldAudio.currentTime = 0;
      }

      this.currentBgm = newBgmName; // 現在のBGMを更新
      
      if (!newBgmName) {
        this.isBgmPlaybackAllowed = false; // BGMが停止されるので再生は許可しない
        this.isSwitchingBgm = false;
        return;
      }

      const newAudio = this.audioPlayers.get(`/assets/sounds/${newBgmName}`);

      // 新しいBGMのAudioオブジェクトが存在する場合
      if (newAudio) {
        const multiplier = this.bgmVolumeMultipliers[newBgmName] || 1;
        newAudio.volume = Math.min(1, this.volume * multiplier); // 倍率を考慮した音量を設定
        newAudio.loop = true; // ループ再生を有効化

        // オーディオが有効で、かつ再生が許可されている場合のみ再生
        if (this.isAudioEnabled && this.isBgmPlaybackAllowed) {
          try {
            if (newAudio.paused) { // 念のため、停止している場合のみ再生
              await newAudio.play();
            }
          } catch (e) {
            console.error("BGMの再生に失敗しました:", e);
          }
        }
      }
      
      this.isSwitchingBgm = false; // 切り替え処理完了
    },

    /**
     * BGMを指定された遅延時間後に再生する準備をします。
     * 無音オーディオを再生し、その終了をトリガーにしてBGMを再生します。
     * @param {string} bgmName - 再生するBGMのファイル名。
     */
    prepareDelayedBgm(bgmName) {
      if (!this.isAudioEnabled) return;

      this.isWaitingForSilentEnd = true;
      
      // 無音ファイル
      const silentSoundUrl = '/assets/sounds/NoBGM4sec.mp3';
      let audio = this.audioPlayers.get(silentSoundUrl);
      
      if (!audio) {
        audio = new Audio(silentSoundUrl);
        this.audioPlayers.set(silentSoundUrl, audio);
      }

      // 'ended'イベントリスナーを一度だけ実行するように設定
      const playBgmOnEnd = () => {
        this.isWaitingForSilentEnd = false;
        this.setBgm(bgmName);
        // リスナーを削除する必要はありません。{ once: true } が自動的に行います。
      };
      
      audio.addEventListener('ended', playBgmOnEnd, { once: true });

      audio.volume = this.volume; // BGMと同じ音量で再生（無音ファイルなので問題なし）
      audio.play().catch(e => {
        console.error("Silent audio for delay failed:", e);
        // 再生に失敗した場合は、待機状態を解除して即座にBGM再生を試みる
        this.isWaitingForSilentEnd = false;
        this.setBgm(bgmName);
      });
    },

    /**
     * 指定された効果音を再生します。
     * @param {string} sound - 再生する効果音のファイル名 (例: 'se.mp3')。
     * @param {object} [options] - 再生オプション。
     * @param {boolean} [options.loop=false] - ループ再生するかどうか。
     * @param {number} [options.volume=1] - グローバル音量に対する倍率。
     */
    playSound(sound, options = {}) {
      const { loop = false } = options;

      if (this.isAudioEnabled) {
        let audio = this.audioPlayers.get(`/assets/sounds/${sound}`);
        if (!audio) {
          audio = new Audio(`/assets/sounds/${sound}`);
          this.audioPlayers.set(`/assets/sounds/${sound}`, audio);
        }
        
        // bgmVolumeMultipliersを唯一の音量倍率のソースとする
        const volumeMultiplier = this.bgmVolumeMultipliers[sound] || 1;

        audio.currentTime = 0;
        audio.volume = Math.min(1, this.volume * volumeMultiplier);
        audio.loop = loop;
        
        audio.play().catch(e => console.error(`効果音の再生に失敗しました: ${sound}`, e));

        if (loop) {
          // 後で全体の音量を変更した際に再適用できるよう、倍率を保存しておく
          this.loopingSoundEffects.set(sound, { player: audio, volume: volumeMultiplier });
        }
      }
    },

    /**
     * ブラウザのタブの表示状態が変更されたときに呼び出されるハンドラ。
     * ページが非表示になったら全てのオーディオを一時停止し、
     * 再び表示されたら有効なBGMを再生再開します。
     */
    handleVisibilityChange() {
      if (document.hidden) {
        // ページが非表示になったらすべてのオーディオを一時停止
        this.audioPlayers.forEach(audio => {
          if (!audio.paused) {
            audio.pause();
          }
        });
      } else if (this.isAudioEnabled) {
        // ページが再び表示されたら、再生すべきものを再開
        const bgmAudio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
        if (bgmAudio && this.isBgmPlaybackAllowed) {
          bgmAudio.play().catch(e => console.error("BGM resume on visibility change failed", e));
        }
        this.loopingSoundEffects.forEach(soundData => {
          soundData.player.play().catch(e => console.error("Looping SE resume on visibility change failed", e));
        });
      }
    },
  },
});