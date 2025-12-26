<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content">
        <h2>{{ $t('parentDecisionPopup.title') }}</h2>
        <div class="dealer-determination-list">
          <div v-for="player in dealerDeterminationResults" :key="player.id" class="player-item" :class="{ 'is-dealer': player.isDealer }">
            <span class="seat-wind">{{ $t(`winds.${player.seatWind}`) }}</span>
            <img v-if="getPlayerIcon(player)" :src="getPlayerIcon(player)" alt="Player Icon" class="player-icon" />
            <div class="player-info">
              <span class="player-name">{{ player.originalId ? $t(`aiNames.${player.originalId}`) : player.name }}</span>
              <span class="score">{{ $t('parentDecisionPopup.score', { score: player.score }) }}</span>
            </div>
          </div>
        </div>
        <div class="timestamp">{{ formattedTimestamp }}</div>
        <p class="countdown-text">{{ $t('parentDecisionPopup.countdown', { n: countdown }) }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed, onMounted, watch, ref, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useZoomLock } from '@/composables/useZoomLock';
import { useUserStore } from '@/stores/userStore'; // userStoreをインポート

const { t } = useI18n(); // i18nの翻訳関数を取得

// ズーム防止機能を有効化
useZoomLock();

/**
 * コンポーネントのプロパティを定義。
 * @property {boolean} show - ポップアップの表示/非表示を制御します。
 * @property {Array<Object>} dealerDeterminationResults - 親決め結果のプレイヤーリスト。
 */
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  dealerDeterminationResults: {
    type: Array,
    required: true,
    default: () => [],
  },
});

/**
 * コンポーネントが発行するイベントを定義。
 * @event close - ポップアップを閉じる際に発行されます。
 */
const emit = defineEmits(['close']);

const countdown = ref(3); // ポップアップが自動で閉じるまでのカウントダウンの初期値
let timer = null; // setTimeoutのタイマーID
let interval = null; // setIntervalのタイマーID

const userStore = useUserStore(); // userStoreのインスタンスを取得

/**
 * `show` プロパティの変更を監視し、ポップアップが表示されたときにタイマーを開始します。
 */
watch(() => props.show, (newVal) => {
  if (newVal) {
    countdown.value = 3; // ポップアップ表示時にカウントダウンをリセット
    startCloseTimer(); // 自動クローズタイマーを開始
    startCountdownInterval(); // カウントダウン表示のインターバルを開始
  } else {
    clearTimeout(timer); // ポップアップが非表示になったら自動クローズタイマーをクリア
    clearInterval(interval); // カウントダウン表示のインターバルもクリア
  }
});

// コンポーネントがマウントされた時に実行
onMounted(() => {
  if (props.show) {
    startCloseTimer(); // 自動クローズタイマーを開始
    startCountdownInterval(); // カウントダウン表示のインターバルを開始
  }
});

// コンポーネントがアンマウントされる時に実行
onUnmounted(() => {
  clearTimeout(timer); // タイマーをクリア
  clearInterval(interval); // インターバルをクリア
});

/**
 * ポップアップを自動で閉じるタイマーを開始します。
 */
const startCloseTimer = () => {
  clearTimeout(timer); // 既存のタイマーがあればクリア
  timer = setTimeout(() => {
    emit('close'); // 'close'イベントを発行してポップアップを閉じる
  }, 3000); // 3秒後に自動で閉じる
};

/**
 * カウントダウン表示を1秒ごとに更新するインターバルを開始します。
 */
const startCountdownInterval = () => {
  clearInterval(interval); // 既存のインターバルがあればクリア
  interval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--; // カウントダウンを減らす
    } else {
      clearInterval(interval); // カウントダウンが0になったらインターバルをクリア
    }
  }, 1000); // 1秒ごとに実行
};

/**
 * 現在のタイムスタンプをフォーマットして返します。
 */
const formattedTimestamp = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
});

/**
 * プレイヤーのアイコン画像URLを返します。
 * @param {Object} player - プレイヤーオブジェクト。
 * @returns {string|null} プレイヤーアイコンのURL、またはnull。
 */
function getPlayerIcon(player) {
  if (!player) return null;
  // 1. プレイヤーオブジェクト自身のavatar_urlを最優先（オンライン対戦用）
  if (player.avatar_url) {
    return player.avatar_url;
  }
  // 2. オフライン時の自分（player1）のアバターフォールバック
  if (player.id === 'player1') {
    return userStore.profile?.avatar_url || '/assets/images/info/hito_icon_1.png';
  }
  // 3. オフライン時のAIプレイヤーのフォールバック
  if (player.originalId === 'kuro') return '/assets/images/info/cat_icon_3.png';
  if (player.originalId === 'tama') return '/assets/images/info/cat_icon_2.png';
  if (player.originalId === 'tora') return '/assets/images/info/cat_icon_1.png';
  if (player.originalId === 'janneko') return '/assets/images/info/cat_icon_4.png';
  
  // 4. 最終フォールバック
  return '/assets/images/info/hito_icon_1.png';
}
</script>

<style scoped>
.popup-overlay {
  position: absolute; /* fixedからabsoluteに変更 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.popup-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  min-width: 350px;
  max-width: 90%;
  text-align: center;
  transform: scale(0.85);
  box-shadow: 0 5px 20px rgba(0,0,0,0.25);
}

/* Transition styles */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.popup-enter-from, .popup-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
.popup-content h2 {
  margin-top: 0;
  margin-bottom: 25px;
  color: #343a40;
  font-size: 2em;
  font-weight: 600;
  letter-spacing: 1px;
}
.dealer-determination-list {
  margin-bottom: 25px;
}
.player-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.player-item:last-child {
  margin-bottom: 0;
}
.player-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.player-item.is-dealer {
  background: linear-gradient(135deg, #fffbeb 0%, #fff3cd 100%);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  border: 1px solid #ffeeba;
}
.player-item.is-dealer .seat-wind {
  background-color: #ffc107;
  color: #212529;
}
.seat-wind {
  font-weight: bold;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #e9ecef;
  color: #495057;
  flex-shrink: 0;
  font-size: 1.2em;
  margin-right: 5px;
}
.player-icon {
  width: 50px;
  height: 50px;
  margin: 0 10px;
  flex-shrink: 0;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #ccc;
}
.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  overflow: hidden;
}
.player-name {
  font-weight: 600;
  font-size: 1.3em;
  color: #212529;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.score {
  font-weight: bold;
  color: #007bff;
  font-size: 1.1em;
}
.timestamp {
  margin-top: 2px;
  font-size: 0.8em;
  color: #666;
}

.countdown-text {
  margin-top: 15px;
  font-size: 1.2em;
  font-weight: bold;
  color: #d32f2f; /* 赤色 */
}
</style>
