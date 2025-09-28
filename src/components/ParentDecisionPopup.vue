<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content">
        <h2>{{ $t('parentDecisionPopup.title') }}</h2>
        <div class="dealer-determination-list">
          <div v-for="player in dealerDeterminationResults" :key="player.id" class="player-item">
            <span class="seat-wind">{{ $t(`winds.${player.seatWind}`) }}</span>
            <span class="player-name">{{ player.originalId ? $t(`aiNames.${player.originalId}`) : player.name }}</span>
            <img v-if="getPlayerIcon(player)" :src="getPlayerIcon(player)" alt="Player Icon" class="player-icon" />
            <span class="score">{{ $t('parentDecisionPopup.score', { score: player.score }) }}</span>
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
  // プレイヤーが自分自身で、かつXアイコンURLが設定されていればそれを使用
  if (player.id === 'player1' && userStore.profile?.x_profile_image_url) {
    return userStore.profile.x_profile_image_url;
  }
  if (player.id === 'player1') return '/assets/images/info/hito_icon_1.png'; // あなた
  if (player.originalId === 'kuro') return '/assets/images/info/cat_icon_3.png'; // くろ
  if (player.originalId === 'tama') return '/assets/images/info/cat_icon_2.png'; // たま
  if (player.originalId === 'tora') return '/assets/images/info/cat_icon_1.png'; // とら
  if (player.originalId === 'janneko') return '/assets/images/info/cat_icon_4.png'; // 雀猫様
  return null;
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
  margin-bottom: 20px;
  color: #333;
  font-size: 1.8em;
}
.dealer-determination-list {
  margin-bottom: 25px;
  color: #444;
  font-size: 1.1em;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  max-height: 300px;
  overflow-y: auto;
}
.player-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px dashed #eee;
}
.player-item:last-child {
  border-bottom: none;
}
.seat-wind {
  font-weight: bold;
  width: 40px;
  text-align: left;
  flex-shrink: 0;
}
.player-name {
  flex-grow: 1;
  text-align: left;
  margin-left: 10px;
}
.player-icon {
  width: 60px;
  height: 60px;
  margin: 0 30px;
  flex-shrink: 0;
}
.score {
  font-weight: bold;
  color: #007bff;
  width: 90px;
  text-align: right;
  flex-shrink: 0;
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
