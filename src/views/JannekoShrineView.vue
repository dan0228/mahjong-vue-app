<template>
  <div class="shrine-view-container" :style="{ height: viewportHeight }">
    <div class="shrine-screen" :style="scalerStyle">
      <div class="cat-coins">
        {{ $t('shrineView.catCoins') }} <span class="cat-coins-number">{{ userStore.profile?.cat_coins || 0 }}</span>
      </div>
      <div class="top-controls">
        <div class="audio-toggles">
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isBgmEnabled" @change="audioStore.toggleBgm()" />
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{{ $t('shrineView.bgm') }}</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isSeEnabled" @change="audioStore.toggleSe()" />
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{{ $t('shrineView.sfx') }}</span>
        </div>
        <button @click="goToTitle" class="back-button">
          <img src="/assets/images/button/buckToTitle.png" :alt="$t('shrineView.backToTitle')" />
        </button>
      </div>

      <button @click="drawOmikuji" class="omikuji-button">
        {{ $t('shrineView.omikujiButton.line1') }}<br />
        <span class="coin-text">
          <template v-if="userStore.profile?.daily_free_omikuji_count > 0">
            {{ $t('shrineView.omikujiButton.freeDrawText', { count: userStore.profile.daily_free_omikuji_count }) }}
          </template>
          <template v-else>
            {{ $t('shrineView.omikujiButton.line2') }}
          </template>
        </span>
      </button>
      <div class="sayings-container">
        <table class="sayings-table">
          <tbody>
            <tr v-for="(saying, index) in sayings" :key="saying.id">
              <td class="saying-no">{{ $t('shrineView.sayingNo', { n: index + 1 }) }}</td>
              <td class="saying-text">{{ revealedSayings[saying.id] ? saying.text : $t('shrineView.unknownSaying') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <transition name="fade">
        <SayingPopup
          v-if="showPopup"
          :fortune="randomFortune"
          :saying="randomSaying"
          :sayingId="randomSayingId"
          :isNew="isNewSaying"
          @close="closePopup"
        />
      </transition>

      <div :class="{ 'fade-overlay': true, 'is-fading': isFading }"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * じゃん猫神社コンポーネント。
 * 猫コインを消費しておみくじを引き、ありがたいお言葉（名言）を集めることができます。
 * 引いたお言葉は解放され、一覧で確認できるようになります。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAudioStore } from '../stores/audioStore';
import { useUserStore } from '@/stores/userStore'; // ★ useGameStore から変更
import SayingPopup from '@/components/SayingPopup.vue';
import { useViewportHeight } from '@/composables/useViewportHeight';

// --- リアクティブな状態とストア ---
const { t, tm } = useI18n();
const { viewportHeight } = useViewportHeight();
const router = useRouter();
const audioStore = useAudioStore();
const userStore = useUserStore(); // ★ gameStore から userStore に変更

// ポップアップ関連の状態
const showPopup = ref(false);
const randomFortune = ref(''); // ポップアップに表示する運勢
const randomSaying = ref(''); // ポップアップに表示する名言
const randomSayingId = ref(null); // ポップアップに表示する名言のID
const isNewSaying = ref(false); // 新しく解放された名言かどうかのフラグ

const isFading = ref(false); // 画面のフェード演出用フラグ
const previousBgm = ref(null); // おみくじ演出中にBGMを一時停止・再開するために使用

// ★ revealedSayings の ref は削除し、userStoreから取得する算出プロパティに変更

// --- 算出プロパティ ---

// 解放済みの名言リストを userStore から取得
const revealedSayings = computed(() => userStore.profile?.revealed_sayings || {});

// i18nファイルから名言リストを生成
const sayings = computed(() => {
  const sayingMessages = tm('shrineView.sayings');
  return Object.keys(sayingMessages).map(key => ({
    id: key,
    text: sayingMessages[key]
  }));
});

// i18nファイルから運勢リストを生成
const fortunes = computed(() => tm('shrineView.fortunes'));

// --- メソッド ---

// ★ loadRevealedSayings と saveRevealedSayings は不要になったので削除

/**
 * おみくじを引く処理。
 * コインを消費し、運勢と名言をランダムに決定してポップアップで表示します。
 */
const drawOmikuji = async () => {
  // userStore.profile がまだ読み込まれていない場合は待つ
  if (!userStore.profile) {
    await userStore.fetchUserProfile();
    if (!userStore.profile) { // 再度チェック
      console.error('ユーザープロファイルが読み込めませんでした。');
      return;
    }
  }

  let isFreeDraw = false;
  let cost = 100; // デフォルトのコインコスト

  if (userStore.profile.daily_free_omikuji_count > 0) {
    isFreeDraw = true;
  } else {
    // 無料回数がなく、コインも足りない場合
    if (userStore.profile.cat_coins < cost) {
      randomFortune.value = '';
      randomSaying.value = t('shrineView.errors.notEnoughCoins');
      randomSayingId.value = null;
      isNewSaying.value = false;
      showPopup.value = true;
      return;
    }
  }

  // BGMを一時停止し、効果音を再生
  previousBgm.value = audioStore.currentBgm;
  audioStore.setBgm(null);
  audioStore.playSound('Kagura_Suzu01-7.mp3');

  // フェードアウトを開始
  isFading.value = true;

  try {
    let updatePromise;
    if (isFreeDraw) {
      // 無料回数を消費
      updatePromise = userStore.updateOmikujiDrawInfo({
        daily_free_omikuji_count: userStore.profile.daily_free_omikuji_count - 1,
        last_omikuji_draw_date: new Date().toISOString().slice(0, 10) // 日付を更新
      }, { showLoading: false });
    } else {
      // コインを消費
      updatePromise = userStore.updateCatCoins(-cost, { showLoading: false });
    }

    // 1.5秒待つ（フェードアウトの時間）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 更新処理が完了していることを確認
    await updatePromise;

    // 結果を計算
    const fortuneValues = Object.values(fortunes.value);
    randomFortune.value = fortuneValues[Math.floor(Math.random() * fortuneValues.length)];
    const sayingsList = sayings.value;
    const randomIndex = Math.floor(Math.random() * sayingsList.length);
    const drawnSaying = sayingsList[randomIndex];
    randomSaying.value = drawnSaying.text;
    randomSayingId.value = drawnSaying.id;
    isNewSaying.value = !revealedSayings.value[drawnSaying.id];

    // 新しい名言なら保存（これもスピナーなし）
    if (isNewSaying.value) {
      await userStore.updateRevealedSaying(drawnSaying.id, { showLoading: false });
    }

    // ポップアップ表示 & フェードイン
    showPopup.value = true;
    isFading.value = false;

  } catch (error) {
    console.error('おみくじ処理中にエラー:', error);
    // エラー時のフォールバック
    randomFortune.value = '';
    randomSaying.value = t('shrineView.errors.failedToSpend');
    randomSayingId.value = null;
    isNewSaying.value = false;
    showPopup.value = true;
    // フェードを戻す
    isFading.value = false;
    // BGMを戻す
    if (previousBgm.value) {
      audioStore.setBgm(previousBgm.value);
    }
  }
};

/**
 * ポップアップを閉じ、BGMを再開します。
 */
const closePopup = () => {
  showPopup.value = false;
  if (previousBgm.value) {
    audioStore.setBgm(previousBgm.value);
    previousBgm.value = null; // 次回のためにリセット
  }
};

/**
 * タイトル画面に遷移します。
 */
const goToTitle = () => {
  router.push({ name: 'Title' });
};

// --- 画面のスケーリング処理 ---
const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 640;
const scaleFactor = ref(1);

const scalerStyle = computed(() => ({
  transform: `translate(-50%, -50%) scale(${scaleFactor.value})`
}));

const updateScaleFactor = () => {
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const scaleX = currentWidth / DESIGN_WIDTH;
  const scaleY = currentHeight / DESIGN_HEIGHT;
  scaleFactor.value = Math.min(scaleX, scaleY);
};

// --- ライフサイクルフック ---
onMounted(async () => { // ★ async に変更
  updateScaleFactor();
  window.addEventListener('resize', updateScaleFactor);
  
  // ユーザープロファイルがまだ読み込まれていない場合は読み込む
  if (!userStore.profile) {
    await userStore.fetchUserProfile();
  }

  // おみくじの無料回数をチェックしてリセット
  await userStore.checkAndResetOmikujiCount();

  audioStore.setBgm('GB-JP-A02-2(Menu-Loop105).mp3');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
  audioStore.setBgm(null); // 画面を離れる際にBGMを停止
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap');

.shrine-view-container {
  position: relative;
  width: 100vw;
  /* height: 100vh; */ /* 動的な高さ指定に置き換え */
  overflow: hidden;
  background-image: url('/assets/images/back/back_out_shrine.png');
  background-repeat: repeat;
}

.shrine-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between; /* 要素を上下に配置 */
  padding-top: 80px; /* 上部の余白 */
  text-align: center;
  font-family: 'M PLUS Rounded 1c', 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
  box-sizing: border-box;
  background-image: url('/assets/images/back/shrine.png');
  background-size: 100% auto;
  background-position: center top;
  background-repeat: no-repeat;
}

.omikuji-button {
  padding: 2px 30px;
  font-size: 1.3rem;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  font-weight: bold;
  color: white;
  background-color: #e53935; /* 少し鮮やかな赤 */
  border: 5px solid #a02825;
  border-radius: 50px;
  cursor: pointer;
  margin-top: auto; /* 上の余白を自動で最大化 */
  margin-bottom: -305px; /* 下部の余白 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.omikuji-button .coin-text {
  font-size: 0.7em; /* 親要素の1.3remに対して0.8倍 */
}

.omikuji-button:hover {
  background-color: #c62828;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
}

.sayings-container {
  height: 130px; /* 高さを半分に */
  width: 90%;
  overflow-y: auto;
  background-color: #fff3f3;
  border: 5px solid #ffe600;
  border-radius: 20px;
  padding: 10px;
  margin-top: auto; /* 上の余白を自動で最大化して下へプッシュ */
  margin-bottom: 10px; /* 下部の余白 */
}

.sayings-table {
  width: 100%;
  border-collapse: collapse;
}

.sayings-table td {
  padding: 4px;
  border-bottom: 1px solid #7e0c0c;
}

.saying-no {
  width: 50px;
  font-size: 0.6rem;
  font-family: 'Yuji Syuku', serif;
  font-weight: bold;
  color: hsl(0, 0%, 0%);
  text-align: left;
  padding-right: 10px;
}

.saying-text {
  font-family: 'Yuji Syuku', serif;
  font-size: 0.7rem;
  font-weight: bold;
  text-align: left;
  color: hsl(0, 0%, 0%);
}

.cat-coins {
  position: absolute;
  top: 14px;
  left: 5px;
  font-size: 0.7em; /* ここを修正 */
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 4px 8px;
  border-radius: 8px;
  white-space: nowrap;
  scale: 0.9;
  display: flex;
  align-items: center;
  height: 28px;
  box-sizing: border-box;
}

.cat-coins-number {
  font-weight: bold;
  color: #f59e0b; /* 黄色っぽい色 */
}

.top-controls {
  position: absolute;
  top: 10px;
  right: 15px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 10;
  scale: 0.9;
  gap: 10px;
  margin-top: -14px; 
}

.audio-toggles {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 4px 8px;
  border-radius: 8px;
  height: 28px;
  box-sizing: border-box;
}

.toggle-label {
  font-size: 0.8em;
  color: #333;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 14px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 14px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 10px;
  width: 10px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196f3;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.back-button img {
  width: 60px; /* 必要に応じてサイズを調整 */
  margin-left: 8px;
  height: auto;
}

.back-button:hover img {
  opacity: 0.8;
}

.fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  opacity: 0;
  visibility: hidden;
  transition: opacity 1.5s ease-in-out, visibility 1.5s ease-in-out;
  z-index: 999;
}

.fade-overlay.is-fading {
  opacity: 1;
  visibility: visible;
}

.fade-leave-active {
  transition-duration: 0.2s;
}
</style>
