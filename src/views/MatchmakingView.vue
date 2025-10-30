<template>
  <div class="matchmaking-container">
    <div class="matchmaking-box">
      <h1 class="title">{{ $t('matchmaking.title') }}</h1>
      <p class="status-text">{{ statusMessage }}</p>
      <div class="spinner"></div>
      <div class="player-count">{{ playerCount }} / 4</div>
      <button @click="cancelMatchmaking" class="cancel-button">{{ $t('matchmaking.cancel') }}</button>
    </div>
  </div>
</template>

<script setup>
/**
 * オンライン対戦のマッチング待機画面コンポーネント。
 * 画面表示時にマッチングキューに参加し、リアルタイムで待機人数を監視します。
 * マッチングが成立すると、自動的にゲーム画面に遷移します。
 */
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { useGameStore } from '@/stores/gameStore';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();
const { t } = useI18n();

const statusMessage = ref(t('matchmaking.status.searching'));
const playerCount = ref(0);
let realtimeChannel = null;

// ユーザーIDをリアクティブな参照として取得
const userId = computed(() => userStore.profile?.id);

/**
 * マッチングキューに参加する
 */
const joinQueue = async () => {
  if (!userId.value) {
    statusMessage.value = t('matchmaking.status.error');
    console.error("User not logged in.");
    return;
  }
  try {
    // 既にキューにいるか確認し、いなければ追加
    const { error } = await supabase.from('match_queue').upsert({ user_id: userId.value });
    if (error) throw error;
    console.log("Successfully joined the matchmaking queue.");
  } catch (error) {
    console.error("Error joining queue:", error);
    statusMessage.value = t('matchmaking.status.error');
  }
};

/**
 * マッチングキューから退出する
 */
const leaveQueue = async () => {
  if (!userId.value) return;
  try {
    const { error } = await supabase.from('match_queue').delete().eq('user_id', userId.value);
    if (error) throw error;
    console.log("Successfully left the matchmaking queue.");
  } catch (error) {
    console.error("Error leaving queue:", error);
  }
};

/**
 * マッチング成立を監視するリアルタイムリスナーを設定
 */
const subscribeToGameCreation = () => {
  if (!userId.value) return;

  // 自分のIDが含まれる新しいゲームが作成されたことを検知
  realtimeChannel = supabase.channel(`public:game_states:player_id=eq.${userId.value}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_states',
        filter: `player_1_id=eq.${userId.value}`
      },
      (payload) => handleGameFound(payload)
    )
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_states',
        filter: `player_2_id=eq.${userId.value}`
      },
      (payload) => handleGameFound(payload)
    )
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_states',
        filter: `player_3_id=eq.${userId.value}`
      },
      (payload) => handleGameFound(payload)
    )
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_states',
        filter: `player_4_id=eq.${userId.value}`
      },
      (payload) => handleGameFound(payload)
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log("Subscribed to game creation events.");
      } else if (err) {
        console.error("Subscription error:", err);
      }
    });
};

/**
 * キューの人数を監視する
 */
const subscribeToQueueChanges = () => {
  const queueChannel = supabase.channel('public:match_queue');
  queueChannel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'match_queue' }, async () => {
      const { count, error } = await supabase.from('match_queue').select('*', { count: 'exact', head: true });
      if (!error) {
        playerCount.value = count;
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // 初期人数を取得
        const { count, error } = await supabase.from('match_queue').select('*', { count: 'exact', head: true });
        if (!error) {
          playerCount.value = count;
        }
      }
    });
}

/**
 * ゲームが見つかった時の処理
 * @param {object} payload - Supabaseからのペイロード
 */
const handleGameFound = (payload) => {
  console.log("Game found!", payload);
  const gameData = payload.new;
  const gameId = gameData.id;
  const hostId = gameData.player_1_id;
  const localUserId = userStore.profile?.id;

  if (!localUserId) {
    console.error("ローカルユーザーIDが見つかりません。");
    statusMessage.value = t('matchmaking.status.error');
    return;
  }

  // gameStoreにオンライン対戦情報をセット
  gameStore.setOnlineGame({
    gameId: gameId,
    localUserId: localUserId,
    hostId: hostId,
  });

  // ゲーム画面に遷移
  router.push('/game');
};

/**
 * マッチングをキャンセルしてタイトルに戻る
 */
const cancelMatchmaking = () => {
  router.replace('/');
};

onMounted(async () => {
  await userStore.fetchUserProfile(); // 最新のユーザープロファイルを取得
  joinQueue();
  subscribeToGameCreation();
  subscribeToQueueChanges();
});

onBeforeUnmount(() => {
  leaveQueue();
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
});

</script>

<style scoped>
.matchmaking-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
  font-family: 'M PLUS Rounded 1c', sans-serif;
}

.matchmaking-box {
  width: 300px;
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.title {
  font-size: 1.5em;
  color: #333;
  margin-bottom: 20px;
}

.status-text {
  font-size: 1em;
  color: #666;
  margin-bottom: 25px;
  min-height: 20px;
}

.spinner {
  margin: 0 auto 20px auto;
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #4caf50;
  animation: spin 1s ease infinite;
}

.player-count {
    font-size: 1.2em;
    color: #333;
    margin-bottom: 25px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.cancel-button {
  width: 100%;
  padding: 10px;
  font-size: 1em;
  cursor: pointer;
  border: none;
  background-color: #f44336;
  color: white;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #d32f2f;
}
</style>
