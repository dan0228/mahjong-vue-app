import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/supabaseClient';

export const useUserStore = defineStore('user', () => {
  // --- State ---
  const profile = ref(null); // ユーザープロフィール情報を保持
  const loading = ref(false); // データ読み込み中のフラグ

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
          migrateDataFromLocalStorage(data);
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
  function migrateDataFromLocalStorage(supabaseProfile) {
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
    if (Object.keys(localYaku).length > Object.keys(supabaseProfile.yaku_achievements || {}).length) {
      updates.yaku_achievements = localYaku;
      needsUpdate = true;
    }

    // おみくじ解放状況の移行
    const localSayings = JSON.parse(localStorage.getItem('mahjongRevealedSayings') || '{}');
    if (Object.keys(localSayings).length > Object.keys(supabaseProfile.revealed_sayings || {}).length) {
      updates.revealed_sayings = localSayings;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('ローカルストレージからデータを移行します...', updates);
      updateUserProfile(updates);
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

  return {
    profile,
    loading,
    fetchUserProfile,
    updateUserProfile,
    recordGameResult,
  };
});
