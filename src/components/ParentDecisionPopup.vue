<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content">
        <h2>ゲーム開始</h2>
        <div class="dealer-determination-list">
          <div v-for="player in dealerDeterminationResults" :key="player.id" class="player-item">
            <span class="seat-wind">{{ player.seatWind }}</span>
            <span class="player-name">{{ player.name }}</span>
            <img v-if="getPlayerIcon(player.id)" :src="getPlayerIcon(player.id)" alt="Player Icon" class="player-icon" />
            <span class="score">{{ player.score }}点</span>
          </div>
        </div>
        <div class="timestamp">{{ formattedTimestamp }}</div>
        <p class="countdown-text">{{ countdown }}秒後にゲーム開始</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed, onMounted, watch, ref, onUnmounted } from 'vue';

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

const emit = defineEmits(['close']);

const countdown = ref(3); // カウントダウンの初期値
let timer = null;
let interval = null;

// showプロパティがtrueになったときにタイマーを開始
watch(() => props.show, (newVal) => {
  if (newVal) {
    countdown.value = 3; // ポップアップ表示時にカウントダウンをリセット
    startCloseTimer();
    startCountdownInterval();
  } else {
    clearTimeout(timer); // ポップアップが非表示になったらタイマーをクリア
    clearInterval(interval); // インターバルもクリア
  }
});

onMounted(() => {
  if (props.show) {
    startCloseTimer();
    startCountdownInterval();
  }
});

onUnmounted(() => {
  clearTimeout(timer);
  clearInterval(interval);
});

const startCloseTimer = () => {
  clearTimeout(timer); // 既存のタイマーがあればクリア
  timer = setTimeout(() => {
    emit('close');
  }, 3000); // 3秒後に自動で閉じる
};

const startCountdownInterval = () => {
  clearInterval(interval); // 既存のインターバルがあればクリア
  interval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(interval);
    }
  }, 1000); // 1秒ごとにカウントダウン
};

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

function getPlayerIcon(playerId) {
  if (playerId === 'player1') return '/assets/images/info/hito_icon_1.png'; // あなた
  if (playerId === 'player2') return '/assets/images/info/cat_icon_3.png'; // くろ
  if (playerId === 'player3') return '/assets/images/info/cat_icon_2.png'; // たま
  if (playerId === 'player4') return '/assets/images/info/cat_icon_1.png'; // とら
  return null;
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  touch-action: none !important;
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