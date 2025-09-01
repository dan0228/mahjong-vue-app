<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content" ref="popupContentRef">
        <h2>{{ t('finalResultPopup.title') }}</h2>
        <div class="final-results-list">
          <div v-for="player in finalResultDetails.rankedPlayers" :key="player.name" class="player-rank-item">
            <span class="rank">{{ t('finalResultPopup.rank', { rank: player.rank }) }}</span>
            <span class="player-name">{{ getTranslatedPlayerName(player) }}</span>          
            <img v-if="getPlayerIcon(player.id)" :src="getPlayerIcon(player.id)" alt="Player Icon" class="player-icon" />
            <span class="score">{{ t('finalResultPopup.score', { score: player.score }) }}</span>
          </div>
        </div>
        <p class="consecutive-wins" v-if="gameStore.gameMode !== 'allManual' && winsToDisplay > 0">
          {{ winsMessage }}
        </p>
        <div class="coin-gain" v-if="gameStore.lastCoinGain !== 0">
          <img src="/assets/images/info/cat_coin.png" alt="Cat Coin" class="cat-coin-icon">
          <span :class="{ 'positive-gain': gameStore.lastCoinGain > 0, 'negative-gain': gameStore.lastCoinGain < 0 }">
            {{ gameStore.lastCoinGain > 0 ? '+' : '' }}{{ gameStore.lastCoinGain }}
          </span>
        </div>
        <div class="actions">
          <button @click="startNewGame" class="action-button">
            <span>{{ t('finalResultPopup.newGame') }}</span>
            <span>{{ t('finalResultPopup.newGameSub') }}</span>
          </button>
          <button @click="backToTitle" class="action-button">
            <span>{{ t('finalResultPopup.backToTitle') }}</span>
            <span>{{ t('finalResultPopup.backToTitleSub') }}</span>
          </button>
        </div>
        <div class="social-share-buttons">
          <button @click="postToX" class="social-button x-post-button">
            <img src="/assets/images/info/logo-black.png" alt="X logo" class="social-logo-icon">
          </button>
        </div>
        <div class="share-caption">{{ t('finalResultPopup.shareCaption') }}</div>
        <div class="timestamp">{{ formattedTimestamp }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '@/stores/gameStore';
import { useZoomLock } from '@/composables/useZoomLock';
import domtoimage from 'dom-to-image-more';

/**
 * 最終結果表示用ポップアップコンポーネント。
 * ゲーム終了時にプレイヤーのランキング、スコア、連勝記録などを表示します。
 * 新しいゲームの開始、タイトルへの復帰、SNSでの結果共有機能を提供します。
 */

const { t } = useI18n();
const emit = defineEmits(['start-new-game', 'back-to-title']);
const gameStore = useGameStore();

// ズーム防止機能を有効化
useZoomLock();

// ポップアップのコンテンツ部分への参照
const popupContentRef = ref(null);

const props = defineProps({
  /**
   * ポップアップの表示状態を制御します。
   */
  show: {
    type: Boolean,
    required: true,
  },
  /**
   * 表示する最終結果の詳細情報。
   * gameStore.finalResultDetailsが渡されることを想定しています。
   * 形式: { rankedPlayers: [{ id, rank, name, score }], consecutiveWins: number }
   */
  finalResultDetails: {
    type: Object,
    required: true,
    default: () => ({ rankedPlayers: [], consecutiveWins: 0 }),
  },
});

/**
 * プレイヤーオブジェクトから翻訳された名前を取得します。
 * @param {Object} player - プレイヤー情報を含むオブジェクト。
 * @returns {string} 翻訳されたプレイヤー名。
 */
function getTranslatedPlayerName(player) {
  if (!player) return '';
  // プレイヤーIDが'player1'の場合、'あなた'と表示
  if (player.id === 'player1') {
    return t('playerNames.you');
  }
  // AIプレイヤーの場合、i18nから名前を取得
  const aiPlayer = gameStore.players.find(p => p.id === player.id);
  if (aiPlayer && aiPlayer.originalId) {
    return t(`aiNames.${aiPlayer.originalId}`);
  }
  return player.name; // フォールバック
}

/**
 * 表示用の連勝数を算出します。
 * 負けた直後（現在の連勝数が0）は、途切れる前の連勝数を表示します。
 */
const winsToDisplay = computed(() => {
  // 現在の連勝数が0で、直前の連勝数が1以上の場合、直前の連勝数を表示
  if (props.finalResultDetails.consecutiveWins === 0 && gameStore.previousConsecutiveWins > 0) {
    return gameStore.previousConsecutiveWins;
  }
  // それ以外の場合は現在の連勝数を表示
  return props.finalResultDetails.consecutiveWins;
});

/**
 * 連勝数に応じたメッセージを生成します。
 * 連勝が途切れた場合と連勝中の場合でメッセージを切り替えます。
 */
const winsMessage = computed(() => {
  const wins = winsToDisplay.value;
  // 現在の連勝数が0で、直前の連勝数が1以上の場合、「〇連勝！」
  if (props.finalResultDetails.consecutiveWins === 0 && gameStore.previousConsecutiveWins > 0) {
    return t('finalResultPopup.wins', { count: wins });
  }
  // それ以外（連勝中）の場合、「〇連勝中！」
  return t('finalResultPopup.winStreak', { count: wins });
});

/**
 * 現在の日時をフォーマットした文字列を返します。
 * YYYY-MM-DD HH:MM:SS 形式
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
 * 'start-new-game'イベントを発行して新しいゲームを開始します。
 */
function startNewGame() {
  emit('start-new-game');
}

/**
 * 'back-to-title'イベントを発行してタイトル画面に戻ります。
 */
function backToTitle() {
  emit('back-to-title');
}

/**
 * プレイヤーIDに対応するアイコンのパスを返します。
 * @param {string} playerId - プレイヤーID。
 * @returns {string|null} アイコン画像のパス。見つからない場合はnull。
 */
function getPlayerIcon(playerId) {
  const player = gameStore.players.find(p => p.id === playerId);
  if (!player) return null;

  if (player.id === 'player1') return '/assets/images/info/hito_icon_1.png'; // あなた
  if (player.originalId === 'kuro') return '/assets/images/info/cat_icon_3.png'; // くろ
  if (player.originalId === 'tama') return '/assets/images/info/cat_icon_2.png'; // たま
  if (player.originalId === 'tora') return '/assets/images/info/cat_icon_1.png'; // とら
  if (player.originalId === 'janneko') return '/assets/images/info/cat_icon_4.png'; // 雀猫様
  return null;
}

/**
 * デバイスがモバイルであるか簡易的に判定します。
 * @returns {boolean} モバイルデバイスであればtrue。
 */
function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

/**
 * X (旧Twitter) に結果を投稿します。
 * スクリーンショットを生成し、Web Share API またはクリップボード経由で共有します。
 */
async function postToX() {
  if (!popupContentRef.value) return;

  const fontCssLink = document.querySelector('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
  let newStyleElement = null;

  try {
    const node = popupContentRef.value;

    // --- フォント修正 開始 ---
    if (fontCssLink) {
      fontCssLink.disabled = true;
      const cssText = await (await fetch(fontCssLink.href)).text();
      newStyleElement = document.createElement('style');
      newStyleElement.appendChild(document.createTextNode(cssText));
      document.head.appendChild(newStyleElement);
    }
    // --- フォント修正 終了 ---

    const scale = 3;
    const options = {
      bgcolor: '#ffffff',
      width: node.offsetWidth * scale,
      height: node.offsetHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      },
      cacheBust: true // キャッシュを無効化して画像を再取得
    };

    const dataUrl = await domtoimage.toPng(node, options);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'mahjong-result.png', { type: 'image/png' });
    const baseText = t('finalResultPopup.tweetText', { count: winsToDisplay.value });
    const gameUrl = "https://mahjong-vue-app.vercel.app";
    const captionText = `\n${gameUrl}\n${baseText}`;

    // モバイルデバイスでWeb Share APIが利用可能な場合
    if (isMobile() && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: t('finalResultPopup.title'),
        text: captionText,
      });
    } else {
      // PCまたはWeb Share APIが使えない場合のフォールバック処理
      try {
        const clipboardItem = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([clipboardItem]);
        alert(t('finalResultPopup.imageCopiedSuccess'));
      } catch (err) {
        console.error("クリップボードへの画像のコピーに失敗しました: ", err);
        alert(t('finalResultPopup.imageCopiedError'));
      } finally {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(captionText)}`;
        window.open(twitterUrl, '_blank');
      }
    }

  } catch (err) {
    console.error(`Xへの共有準備中にエラーが発生しました: `, err);
    alert(t('finalResultPopup.clipboardCopyError'));
  } finally {
    // --- クリーンアップ ---
    if (fontCssLink) {
      fontCssLink.disabled = false;
    }
    if (newStyleElement) {
      document.head.removeChild(newStyleElement);
    }
    // --- クリーンアップ 終了 ---
  }
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
  z-index: 1050; /* 他の要素より手前に表示 */
}
.popup-content {
  background-color: white;
  padding: 2px;
  border-radius: 10px;
  min-width: 320px;
  max-width: 95%;
  text-align: center;
  transform: scale(1); 
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
  margin-bottom: 10px;
  color: #333;
  font-size: 1.7em;
}
.final-results-list {
  color: #444;
  font-size: 1.0em;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  max-height: 300px;
  overflow-y: auto;
}
.player-rank-item {
  display: flex;
  align-items: center;
  padding: 2px 0;
  border-bottom: 1px dashed #eee;
}
.player-rank-item:last-child {
  border-bottom: none;
}
.rank {
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
.consecutive-wins {
  font-size: 2em;
  font-weight: bold;
  color: #ff9800; /* オレンジ色 */
  margin-top: 0px;
  margin-bottom: 0px;
  margin-left: 40px;
}

.coin-gain {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.positive-gain {
  color: #f59e0b;
}

.negative-gain {
  color: #f44336; /* 赤色 */
}

.cat-coin-icon {
  width: 80px;
  height: 80px;
  margin-left: 0px;
}
.actions {
  display: flex;
  justify-content: space-around;
  gap: 15px;
}
.action-button { /* actions button から action-button にクラス名を変更 */
  padding: 10px 20px;
  border: none;
  width: 155px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8em;
  transition: background-color 0.2s ease;
  display: flex; /* テキストを縦に並べるため */
  flex-direction: column; /* テキストを縦に並べるため */
  align-items: center; /* テキストを中央揃え */
  justify-content: center; /* テキストを中央揃え */
  line-height: 1.2; /* 行間調整 */
}
.action-button:first-child { /* 新しいゲームを開始 */
  background-color: #4CAF50;
  color: white;
}
.action-button:first-child:hover {
  background-color: #45a049;
}
.action-button:last-child { /* タイトルに戻る */
  background-color: #f44336;
  color: white;
}
.action-button:last-child:hover {
  background-color: #da190b;
}

.social-share-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 5px;
}

.social-button {
  background-color: transparent;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8em;
  transition: background-color 0.2s ease, color 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.social-logo-icon {
  width: 20px;
  height: 20px;
}

.x-post-button {
  color: #1DA1F2;
  border: 1px solid #1DA1F2;
}

.x-post-button:hover {
  background-color: #1DA1F2;
  color: white;
}

.instagram-post-button {
  color: #E1306C;
  border: 1px solid #E1306C;
}

.instagram-post-button:hover {
  background-color: #E1306C;
  color: white;
}

.screenshot-button {
  color: #555;
  border: 1px solid #ccc;
}

.screenshot-button:hover {
  background-color: #f0f0f0;
}

.screenshot-icon {
  font-size: 1.2em;
}

.share-caption {
  font-size: 0.8em;
  color: #666;
}

.timestamp {
  margin-top: 15px; /* 調整 */
  font-size: 0.8em;
  color: #666;
}
</style>