<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content" ref="popupContentRef">
        <h2>{{ t('finalResultPopup.title') }}</h2>
        <div class="final-results-list">
          <div v-for="player in finalResultDetails.rankedPlayers" :key="player.name" class="player-rank-item" :class="{ 'is-winner': player.rank === 1 }">
            <span class="rank">{{ player.rank }}</span>
            <img v-if="getPlayerIcon(player.id)" :src="getPlayerIcon(player.id)" alt="Player Icon" class="player-icon" crossorigin="anonymous" />
            <div class="player-info">
              <span class="player-name">{{ getTranslatedPlayerName(player) }}</span>
              <span class="score">{{ t('finalResultPopup.score', { score: player.score }) }}</span>
            </div>
          </div>
        </div>
        <p class="consecutive-wins" v-if="gameStore.gameMode !== 'allManual' && winsToDisplay > 0 && myPlayerRank === 1">
          {{ winsMessage }}
        </p>
        <div class="coin-gain" v-if="gameStore.lastCoinGain !== 0">
          <div class="coin-change-display">
            <img src="/assets/images/info/cat_coin.png" alt="Cat Coin" class="cat-coin-icon" crossorigin="anonymous">
            <span :class="{ 'positive-gain': gameStore.lastCoinGain > 0, 'negative-gain': gameStore.lastCoinGain < 0 }">
              {{ gameStore.lastCoinGain > 0 ? '+' : '' }}{{ gameStore.lastCoinGain }}
            </span>
          </div>
          <div class="coin-total-display">
            <span class="positive-gain total-cat-coins-value">{{ t('finalResultPopup.totalCatCoins') }} {{ displayCatCoins }}</span>
          </div>
        </div>
        <div class="actions">
          <button v-if="!gameStore.isGameOnline" @click="startNewGame" class="action-button">
            <span>{{ t('finalResultPopup.newGame') }}</span>
          </button>
          <button @click="backToTitle" class="action-button">
            <span>{{ t('finalResultPopup.backToTitle') }}</span>
          </button>
        </div>
        <!-- X共有ボタンは削除 -->
        <div class="timestamp">{{ formattedTimestamp }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore'; // userStoreをインポート
import { useZoomLock } from '@/composables/useZoomLock';
import * as htmlToImage from 'html-to-image';

/**
 * 最終結果表示用ポップアップコンポーネント。
 * ゲーム終了時にプレイヤーのランキング、スコア、連勝記録などを表示します。
 * 新しいゲームの開始、タイトルへの復帰、SNSでの結果共有機能を提供します。
 */

const { t } = useI18n();
const emit = defineEmits(['start-new-game', 'back-to-title']);
const gameStore = useGameStore();
const userStore = useUserStore(); // userStoreのインスタンスを取得

// ズーム防止機能を有効化
useZoomLock();

// ポップアップのコンテンツ部分への参照
const popupContentRef = ref(null);

const myPlayerRank = computed(() => {
  const myResult = props.finalResultDetails.rankedPlayers.find(p => p.id === 'player1');
  return myResult ? myResult.rank : null;
});

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



// アニメーション用の猫コインの現在値
const currentAnimatedCatCoins = ref(0);

// 表示用の猫コイン（0〜999,999の範囲に制限）
const displayCatCoins = computed(() => {
  return Math.max(0, Math.min(currentAnimatedCatCoins.value, 999999));
});

// ポップアップが表示されたときにアニメーションを開始
watch(() => props.show, (newValue) => {
  if (newValue && userStore.profile) {
    // アニメーションの開始値（現在の猫コイン）と終了値（増減後）を計算
    const initialCoins = userStore.profile.cat_coins;
    const finalCoins = initialCoins + gameStore.lastCoinGain;

    // アニメーションの開始値を設定
    currentAnimatedCatCoins.value = initialCoins;

    // アニメーション開始
    animateCatCoins(initialCoins, finalCoins);
  }
}, { immediate: true }); // 初期表示時にも実行

function animateCatCoins(startValue, endValue) {
  const duration = 1000; // 1秒
  const startTime = performance.now();

  const step = (currentTime) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1); // 0から1の範囲に正規化

    currentAnimatedCatCoins.value = Math.floor(startValue + (endValue - startValue) * progress);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      currentAnimatedCatCoins.value = endValue; // 最終値を保証
    }
  };

  requestAnimationFrame(step);
}

/**
 * プレイヤーオブジェクトから翻訳された名前を取得します。
 * @param {Object} player - プレイヤー情報を含むオブジェクト。
 * @returns {string} 翻訳されたプレイヤー名。
 */
function getTranslatedPlayerName(player) {
  if (!player) return '';
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

  // プレイヤーが自分自身で、かつアバターURLが設定されていればそれを使用
  if (player.id === 'player1' && userStore.profile?.avatar_url) {
    return userStore.profile.avatar_url;
  }
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

  // --- PC向けロジックは後で実行するため、先行するウィンドウオープンは削除 ---

  const fontCssLink = document.querySelector('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
  let newStyleElement = null;
  
  // --- クリーンアップ用変数の準備 ---

  const nodeToCapture = popupContentRef.value;
  let tempNode = null;
  const originalChildren = [];
  const originalPadding = nodeToCapture.style.padding;
  const originalInlineStyles = {
    background: nodeToCapture.style.background,
    backgroundColor: nodeToCapture.style.backgroundColor,
    backgroundImage: nodeToCapture.style.backgroundImage,
    backgroundSize: nodeToCapture.style.backgroundSize,
    backgroundPosition: nodeToCapture.style.backgroundPosition,
  };

  try {
    nodeToCapture.style.backgroundColor = '#f0fff0';
    nodeToCapture.style.backgroundImage = [
      'radial-gradient(circle at 50% 100%, transparent 30%, #cce8cc 30%, #cce8cc 45%, transparent 45%)',
      'radial-gradient(circle at 0 50%, transparent 30%, #cce8cc 30%, #cce8cc 45%, transparent 45%)',
      'radial-gradient(circle at 100% 50%, transparent 30%, #cce8cc 30%, #cce8cc 45%, transparent 45%)',
      'radial-gradient(circle at 50% 0, transparent 30%, #cce8cc 30%, #cce8cc 45%, transparent 45%)'
    ].join(', ');
    nodeToCapture.style.backgroundSize = '50px 50px';
    nodeToCapture.style.backgroundPosition = '25px 25px, 0 25px, 25px 0, 0 0';

    const scale = 3;
    let options;

    if (fontCssLink) {
      fontCssLink.disabled = true;
      const cssText = await (await fetch(fontCssLink.href)).text();
      newStyleElement = document.createElement('style');
      newStyleElement.appendChild(document.createTextNode(cssText));
      document.head.appendChild(newStyleElement);
    }

    if (isMobile()) {
      tempNode = document.createElement('div');
      tempNode.style.textAlign = 'center';
      tempNode.style.fontFamily = "'Noto Sans JP', sans-serif";
      tempNode.style.padding = '40px 20px';
      tempNode.style.background = 'transparent';

      const titleElement = document.createElement('h1');
      titleElement.textContent = t('titleView.altLogo');
      titleElement.style.color = '#4a4a4a';
      titleElement.style.fontSize = '2.2em';
      titleElement.style.whiteSpace = 'nowrap';
      titleElement.style.fontWeight = 'bold';
      titleElement.style.margin = '0 0 20px 0';
      tempNode.appendChild(titleElement);

      const winsElement = document.createElement('p');
      if (winsToDisplay.value > 0) {
        winsElement.textContent = winsMessage.value;
      } else {
        winsElement.textContent = t('finalResultPopup.wins', { count: 0 });
      }
      winsElement.style.color = '#ff9800';
      winsElement.style.fontSize = '2.5em';
      winsElement.style.fontWeight = 'bold';
      winsElement.style.margin = '0 0 20px 0';
      tempNode.appendChild(winsElement);

      const timestampElement = document.createElement('div');
      timestampElement.textContent = formattedTimestamp.value;
      timestampElement.style.color = '#7d6b6b';
      timestampElement.style.fontSize = '1em';
      tempNode.appendChild(timestampElement);

      for (const child of nodeToCapture.children) {
        originalChildren.push(child);
        child.style.display = 'none';
      }
      
      nodeToCapture.style.padding = '20px';
      nodeToCapture.appendChild(tempNode);
    }

    options = {
      width: nodeToCapture.offsetWidth * scale,
      height: nodeToCapture.offsetHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      },
      cacheBust: true
    };

    const blob = await htmlToImage.toBlob(nodeToCapture, options);
    if (!blob) {
      throw new Error('画像のBlob生成に失敗しました。');
    }

    const file = new File([blob], 'mahjong-result.png', { type: 'image/png' });
    const baseText = t('finalResultPopup.tweetText', { count: winsToDisplay.value });
    const gameUrl = "https://mahjong-vue-app.vercel.app";

    if (isMobile() && navigator.share && navigator.canShare({ files: [file] })) {
      const captionText = `\n${gameUrl}\n${baseText}`;
      await navigator.share({
        files: [file],
        title: t('finalResultPopup.title'),
        text: captionText,
      });
    } else if (!isMobile()) {
      try {
        const clipboardItem = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([clipboardItem]);
        
        const pastePrompt = t('finalResultPopup.pastePromptPC');
        const pcCaptionText = `${pastePrompt}\n\n${baseText}\n${gameUrl}`;

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(pcCaptionText)}`;
        window.open(twitterUrl, '_blank');

      } catch (err) {
        console.error("クリップボードへの画像のコピーに失敗しました: ", err);
        alert(t('finalResultPopup.imageCopiedError'));
      }
    }

  } catch (err) {
    console.error(`Xへの共有準備中にエラーが発生しました: `, err);
    alert(t('finalResultPopup.clipboardCopyError'));
  } finally {
    nodeToCapture.style.background = originalInlineStyles.background;
    nodeToCapture.style.backgroundColor = originalInlineStyles.backgroundColor;
    nodeToCapture.style.backgroundImage = originalInlineStyles.backgroundImage;
    nodeToCapture.style.backgroundSize = originalInlineStyles.backgroundSize;
    nodeToCapture.style.backgroundPosition = originalInlineStyles.backgroundPosition;

    if (isMobile() && tempNode) {
      nodeToCapture.removeChild(tempNode);
      originalChildren.forEach(child => {
        child.style.display = '';
      });
      nodeToCapture.style.padding = originalPadding;
    }
    if (fontCssLink) {
      fontCssLink.disabled = false;
    }
    if (newStyleElement) {
      document.head.removeChild(newStyleElement);
    }
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
.final-result-popup-content {
  background-image: url('/assets/images/back/start_back.png');
  background-size: cover;
  background-position: center;
  padding: 20px;
  border-radius: 10px;
  color: rgb(43, 6, 6);
  font-family: 'Yuji Syuku', serif;
  text-align: center;
  width: 90%;
  max-width: 600px;
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
  margin-bottom: 5px;
  color: #333;
  font-size: 1.5em;
}
.final-results-list {
  margin-bottom: 0px;
}
.player-rank-item {
  display: flex;
  align-items: center;
  padding: 7px 15px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.player-rank-item:last-child {
  margin-bottom: 0;
}
.player-rank-item.is-winner {
  background: linear-gradient(135deg, rgba(255, 251, 235, 0.5) 0%, rgba(255, 243, 205, 0.5) 100%); /* 背景を半透明に */
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  border: 1px solid rgba(255, 238, 186, 0.5); /* 枠線も半透明に */
}
.player-rank-item.is-winner .rank {
  background-color: #ffc107;
  color: #212529;
}
.rank {
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
  font-size: 1.4em;
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
  font-size: 1.2em;
  color: #212529;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.score {
  font-weight: bold;
  color: #007bff;
  font-size: 1.3em;
}
.consecutive-wins {
  font-size: 1.6em;
  font-weight: bold;
  color: #ff9800; /* オレンジ色 */
  margin-top: 0px;
  margin-bottom: 0px;
  margin-left: 0px;
}

.coin-gain {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0px;
  display: flex;
  flex-direction: column; /* 縦並びにする */
  align-items: center; /* 中央揃え */
  justify-content: center;
}

.coin-change-display {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px; /* 増減値と合計値の間に少しスペース */
}

.coin-total-display {
  display: flex;
  align-items: center;
  justify-content: center;
}

.total-cat-coins-value {
  font-size: 1.2em; /* 増減値と同じくらいか少し大きく */
  color: #f59e0b; /* positive-gainと同じ色 */
  margin-bottom: 10px;
  margin-top: -20px;
}

.positive-gain {
  color: #f59e0b;
}

.negative-gain {
  color: #f44336; /* 赤色 */
}

.cat-coin-icon {
  width: 60px;
  height: 60px;
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
  color: rgb(43, 6, 6);
}
</style>