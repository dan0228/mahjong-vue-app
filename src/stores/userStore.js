import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/supabaseClient';

export const useUserStore = defineStore('user', () => {
  // --- State ---
  const profile = ref(null); // ユーザープロフィール情報を保持
  const loading = ref(false); // データ読み込み中のフラグ
  const newlyAchievedYaku = ref({}); // 今回のゲームで新たに達成した役を一時的に保持

  // --- Actions ---

  /**
   * Supabaseから現在のユーザーのプロフィール情報を取得します。
   */
  async function fetchUserProfile() {
    try {
      loading.value = true;
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error, status } = await supabase
          .from('users')
          .select(`*`)
          .eq('id', user.id)
          .single();

        if (error && status !== 406) throw error;

        if (data) {
          profile.value = data;
          // Xアカウント関連のロジックは削除

          // 初回取得時にlocalStorageからデータ移行を試みる
          await migrateDataFromLocalStorage(data);

          // アプリ再起動時にゲームが進行中だった場合、連勝数をリセットし、ゲーム進行中フラグを解除
          if (profile.value.is_game_in_progress) {
            await resetWinStreak(); // 連勝数をリセット
            await setGameInProgress(false); // ゲーム進行中フラグを解除
          }
        }
      } else {
        // ユーザーがいない場合はプロフィールをnullに設定
        profile.value = null;
      }
    } catch (error) {
      console.error('プロフィールの取得エラー:', error.message);
    } finally {
      loading.value = false;
    }
  }

  /**
   * ユーザーのプロフィール情報を更新します。
   * @param {Object} updates - 更新するデータのオブジェクト。例: { username: '新しい名前' }
   * @param {Object} options - { showLoading: boolean } ローディング表示を制御するオプション
   */
  async function updateUserProfile(updates, options = { showLoading: true }) {
    if (!profile.value) return;

    try {
      if (options.showLoading) loading.value = true;
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;

      // ローカルのstateも更新
      Object.assign(profile.value, updates);

    } catch (error) {
      console.error('プロフィール更新エラー:', error.message);
    } finally {
      if (options.showLoading) loading.value = false;
    }
  }

  /**
   * アバター画像をアップロードし、ユーザーのプロフィールを更新します。
   * @param {File} file - アップロードする画像ファイル。
   */
  async function uploadAvatar(file) {
    if (!file) {
      console.error('アップロードするファイルがありません。');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('ユーザーが見つかりません。');
      return;
    }

    try {
      loading.value = true;
      const fileExt = file.name.split('.').pop();
      const filePath = `public/${user.id}/avatar.${fileExt}`;

      // Supabase Storageにファイルをアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // 存在する場合は上書き
        });

      if (uploadError) throw uploadError;

      // アップロードしたファイルの公開URLを取得
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (!urlData) {
        throw new Error('URLの取得に失敗しました。');
      }
      
      const publicUrl = urlData.publicUrl;

      // usersテーブルのavatar_urlを更新
      await updateUserProfile({ avatar_url: publicUrl }, { showLoading: false });

    } catch (error) {
      console.error('アバターのアップロードに失敗しました:', error.message);
    } finally {
      loading.value = false;
    }
  }

  /**
   * localStorageに古いデータが存在する場合、Supabaseに移行します。
   * @param {Object} supabaseProfile - Supabaseから取得した現在のプロフィール
   */
  async function migrateDataFromLocalStorage(supabaseProfile) {
    const updates = {};
    let needsUpdate = false;

    // 最大連勝数の移行
    const localMaxWins = parseInt(localStorage.getItem('mahjongMaxConsecutiveWins') || '0');
    if (localMaxWins > (supabaseProfile.max_win_streak || 0)) {
      updates.max_win_streak = localMaxWins;
      needsUpdate = true;
    }

    // 役達成状況の移行
    const localYaku = JSON.parse(localStorage.getItem('mahjongYakuAchieved') || '{}');
    // Supabaseのデータが空、またはlocalStorageのデータの方が新しい場合
    if (Object.keys(localYaku).length > Object.keys(supabaseProfile.yaku_achievements || {}).length) {
      updates.yaku_achievements = localYaku;
      needsUpdate = true;
    }

    // おみくじ解放状況の移行
    const localSayings = JSON.parse(localStorage.getItem('mahjongRevealedSayings') || '{}');
    // Supabaseのデータが空、またはlocalStorageのデータの方が新しい場合
    if (Object.keys(localSayings).length > Object.keys(supabaseProfile.revealed_sayings || {}).length) {
      updates.revealed_sayings = localSayings;
      needsUpdate = true;
    }

    // 猫コインの移行
    const localCatCoins = parseInt(localStorage.getItem('mahjongCatCoins') || '0');
    if (localCatCoins > (supabaseProfile.cat_coins || 0)) {
      updates.cat_coins = localCatCoins;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('ローカルストレージからデータを移行します...', updates);
      await updateUserProfile(updates);
      // 移行後、localStorageのデータをクリアすることも検討
      localStorage.removeItem('mahjongMaxConsecutiveWins');
      localStorage.removeItem('mahjongYakuAchieved');
      localStorage.removeItem('mahjongRevealedSayings');
      localStorage.removeItem('mahjongCatCoins');
    }
  }

  /**
   * ゲーム終了時の結果を記録します。
   * @param {number} rank - ゲームの最終順位
   * @param {Object} options - { showLoading: boolean } ローディング表示を制御するオプション
   */
  async function recordGameResult(rank, options = { showLoading: true }) {
    if (!profile.value) return;

    const recentGames = profile.value.recent_games || [];
    recentGames.push(rank);
    if (recentGames.length > 10) {
      recentGames.shift(); // 古いものから削除して10件に保つ
    }
    await updateUserProfile({ recent_games: recentGames }, options);
  }

  /**
   * 連勝数を更新します。
   * @param {Object} streaks - { current: number, max: number }
   * @param {Object} options - { showLoading: boolean } ローディング表示を制御するオプション
   */
  async function updateWinStreaks({ current, max }, options = { showLoading: true }) {
  if (!profile.value) return { current: 0, max: 0 }; // profileがない場合はデフォルト値を返す
  await updateUserProfile({ current_win_streak: current, max_win_streak: max }, options);
  // 更新後のprofile.valueから最新の連勝数を返す
  return {
    current: profile.value.current_win_streak || 0,
    max: profile.value.max_win_streak || 0,
  };
}

  /**
   * 役の達成状況を一時的に記録します。
   * @param {string} yakuKey - 達成した役のキー
   */
  function updateYakuAchievement(yakuKey) {
    if (!profile.value) return;
    // 既存の達成状況と、今回新しく達成した役の両方に含まれていない場合のみ追加
    if (!profile.value.yaku_achievements?.[yakuKey] && !newlyAchievedYaku.value[yakuKey]) {
      newlyAchievedYaku.value[yakuKey] = true;
    }
  }

  /**
   * おみくじの解放状況を更新します。
   * @param {string} sayingId - 解放したおみくじのID
   * @param {Object} options - { showLoading: boolean } ローディング表示を制御するオプション
   */
  async function updateRevealedSaying(sayingId, options = { showLoading: true }) {
    if (!profile.value) return;
    const revealed = { ...(profile.value.revealed_sayings || {}) };
    if (!revealed[sayingId]) {
      revealed[sayingId] = true;
      await updateUserProfile({ revealed_sayings: revealed }, options);
    }
  }

  /**
   * 猫コインを更新します。
   * @param {number} amount - 更新する猫コインの量（加算または減算）
   * @param {Object} options - { showLoading: boolean } ローディング表示を制御するオプション
   */
  async function updateCatCoins(amount, options = { showLoading: true }) {
    if (!profile.value) return;

    const newCatCoins = Math.max(0, (profile.value.cat_coins || 0) + amount); // 0未満にならないように
    await updateUserProfile({ cat_coins: newCatCoins }, options);
  }

  /**
   * ゲーム中に達成した役をまとめてSupabaseに保存します。
   * @param {Object} options - { showLoading: boolean } ローディング表示を制御するオプション
   */
  async function saveAchievedYaku(options = { showLoading: true }) {
    if (Object.keys(newlyAchievedYaku.value).length === 0) {
      return; // 新しく達成した役がなければ何もしない
    }

    if (!profile.value) return;

    const currentAchievements = profile.value.yaku_achievements || {};
    const updatedAchievements = { ...currentAchievements, ...newlyAchievedYaku.value };

    try {
      if (options.showLoading) loading.value = true;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザーが見つかりません");

      const { error } = await supabase.from('users').update({ yaku_achievements: updatedAchievements }).eq('id', user.id);
      if (error) throw error;

      // ローカルのstateも更新
      profile.value.yaku_achievements = updatedAchievements;
      // 保存が完了したら一時リストをクリア
      newlyAchievedYaku.value = {};

    } catch (error) {
      console.error('役達成状況の一括保存エラー:', error.message);
    } finally {
      if (options.showLoading) loading.value = false;
    }
  }

  /**
   * 新しいゲームセッションのために一時データをリセットします。
   */
  function resetTemporaryData() {
    newlyAchievedYaku.value = {};
  }

  /**
   * 現在の連勝数を0にリセットし、Supabaseに保存します。
   */
  async function resetWinStreak() {
    if (!profile.value) return;
    if (profile.value.current_win_streak > 0) {
      await updateUserProfile({ current_win_streak: 0 }, { showLoading: false }); // スピナーなしで更新
    }
  }

  /**
   * ゲームが進行中であるかどうかのフラグを設定し、Supabaseに保存します。
   * @param {boolean} status - ゲームが進行中であればtrue、そうでなければfalse。
   */
  async function setGameInProgress(status) {
    if (!profile.value) return;
    await updateUserProfile({ is_game_in_progress: status }, { showLoading: false }); // スピナーなしで更新
  }

  return {
    profile,
    loading,
    fetchUserProfile,
    updateUserProfile,
    uploadAvatar, // ★追加
    recordGameResult,
    updateWinStreaks,
    updateYakuAchievement,
    updateRevealedSaying,
    updateCatCoins,
    saveAchievedYaku,
    resetTemporaryData,
    resetWinStreak,
    setGameInProgress,
  };
});
