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
          // 初回取得時にlocalStorageからデータ移行を試みる
          await migrateDataFromLocalStorage(data);
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
   */
  async function updateUserProfile(updates) {
    if (!profile.value) return;

    try {
      loading.value = true;
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;

      // ローカルのstateも更新
      Object.assign(profile.value, updates);

    } catch (error) {
      console.error('プロフィール更新エラー:', error.message);
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
   */
  async function recordGameResult(rank) {
    if (!profile.value) return;

    const recentGames = profile.value.recent_games || [];
    recentGames.push(rank);
    if (recentGames.length > 10) {
      recentGames.shift(); // 古いものから削除して10件に保つ
    }
    await updateUserProfile({ recent_games: recentGames });
  }

  /**
   * 連勝数を更新します。
   * @param {Object} streaks - { current: number, max: number }
   */
  async function updateWinStreaks({ current, max }) {
    if (!profile.value) return;
    await updateUserProfile({ current_win_streak: current, max_win_streak: max });
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
   */
  async function updateRevealedSaying(sayingId) {
    if (!profile.value) return;
    const revealed = { ...(profile.value.revealed_sayings || {}) };
    if (!revealed[sayingId]) {
      revealed[sayingId] = true;
      await updateUserProfile({ revealed_sayings: revealed });
    }
  }

  /**
   * 猫コインを更新します。
   * @param {number} amount - 更新する猫コインの量（加算または減算）
   */
  async function updateCatCoins(amount) {
    if (!profile.value) return;

    const newCatCoins = Math.max(0, (profile.value.cat_coins || 0) + amount); // 0未満にならないように
    await updateUserProfile({ cat_coins: newCatCoins });
  }

  /**
   * ゲーム中に達成した役をまとめてSupabaseに保存します。
   */
  async function saveAchievedYaku() {
    if (Object.keys(newlyAchievedYaku.value).length === 0) {
      return; // 新しく達成した役がなければ何もしない
    }

    if (!profile.value) return;

    const currentAchievements = profile.value.yaku_achievements || {};
    const updatedAchievements = { ...currentAchievements, ...newlyAchievedYaku.value };

    // updateUserProfile を直接呼ぶ代わりに、Supabaseに直接書き込む
    try {
      loading.value = true;
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
      loading.value = false;
    }
  }

  /**
   * 新しいゲームセッションのために一時データをリセットします。
   */
  function resetTemporaryData() {
    newlyAchievedYaku.value = {};
  }

  return {
    profile,
    loading,
    fetchUserProfile,
    updateUserProfile,
    recordGameResult,
    updateWinStreaks,
    updateYakuAchievement,
    updateRevealedSaying,
    updateCatCoins,
    saveAchievedYaku,
    resetTemporaryData,
  };
});