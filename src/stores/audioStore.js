// src/stores/audioStore.js
// オーディオ再生に関する状態とロジックを管理するPiniaストア
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    volume: localStorage.getItem('volume') === null ? 0.6 : parseFloat(localStorage.getItem('volume')), // 統一された音量
    isAudioEnabled: localStorage.getItem('isAudioEnabled') === null ? true : localStorage.getItem('isAudioEnabled') === 'true', // 統一された有効フラグ
    currentBgm: null, // 現在再生中のBGMのファイル名 (例: 'NES-JP-A01-2(Title-Loop115).mp3')
    audioPlayers: new Map(), // プリロードされたAudioオブジェクトを格納するMap (URL -> Audioオブジェクト)
    isSwitchingBgm: false, // BGM切り替え処理中かどうかのフラグ
  }),
  actions: {
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
      const audio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
      if (audio) {
        if (this.isAudioEnabled) {
          audio.play();
        } else {
          audio.pause();
        }
      }
    },

    /**
     * 全ての音声の音量を設定します。
     * @param {number} newVolume - 新しい音量 (0.0から1.0)
     */
    setVolume(newVolume) {
      this.volume = Math.max(0, Math.min(1, newVolume));
      localStorage.setItem('volume', this.volume);
      const audio = this.currentBgm ? this.audioPlayers.get(`/assets/sounds/${this.currentBgm}`) : null;
      if (audio) {
        audio.volume = this.volume;
      }
    },

    /**
     * 現在のBGMを新しいBGMに切り替えて再生します。
     * 同じBGMが指定された場合は、再生位置をリセットして再開します。
     * @param {string|null} newBgmName - 新しいBGMのファイル名 (例: 'bgm.mp3')。nullを指定すると現在のBGMを停止します。
     * @returns {Promise<void>} BGMの切り替えが完了したときに解決されるPromise。
     */
    async setBgm(newBgmName) {
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
        this.isSwitchingBgm = false;
        return;
      }

      const newAudio = this.audioPlayers.get(`/assets/sounds/${newBgmName}`);

      // 新しいBGMのAudioオブジェクトが存在する場合
      if (newAudio) {
        newAudio.volume = this.volume; // 音量を設定
        newAudio.loop = true; // ループ再生を有効化

        // オーディオが有効な場合のみ再生
        if (this.isAudioEnabled) {
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
     * 指定された効果音を再生します。
     * @param {string} sound - 再生する効果音のファイル名 (例: 'se.mp3')。
     */
    playSound(sound) {
      if (this.isAudioEnabled) { // isAudioEnabled を使用
        let audio = this.audioPlayers.get(`/assets/sounds/${sound}`);
        if (!audio) {
          // プリロードされていない場合、新しいAudioオブジェクトを作成して保存
          audio = new Audio(`/assets/sounds/${sound}`);
          this.audioPlayers.set(`/assets/sounds/${sound}`, audio);
        }
        audio.currentTime = 0; // 再生位置を先頭にリセット
        audio.volume = this.volume; // 音量を設定
        audio.play().catch(e => console.error("効果音の再生に失敗しました:", e)); // 再生を開始 (エラーハンドリング)
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
      } else {
        // ページが再び表示されたら、有効なオーディオを再生再開
        this.audioPlayers.forEach((audio, url) => {
          // BGMの場合
          if (url.includes(this.currentBgm) && this.isAudioEnabled) {
            audio.play().catch(e => console.error("BGMの再生に失敗しました:", e));
          }
          // SEの場合 (BGMと異なるURLで、かつSEが有効な場合)
          else if (!url.includes(this.currentBgm) && this.isAudioEnabled) {
            // 効果音は通常ループしないため、再生中のものだけを再開
            // ここでは、効果音は短いため、再開の必要はないと判断し、BGMのみを対象とする
            // もし効果音も長時間再生されるものがある場合は、別途状態管理が必要
          }
        });
      }
    },
  },
});