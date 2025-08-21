<template>
  <div v-if="isLoading" class="loading-screen">
    <img src="/assets/images/back/loading.png" alt="Loading..." class="loading-image" />
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: loadingProgress + '%' }"></div>
    </div>
    <p class="loading-text">Loading... {{ Math.floor(loadingProgress) }}%</p>
  </div>
  <router-view v-else v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <AddToHomeScreenPopup
    :show="showAddToHomeScreenPopup"
    @close="handleCloseAddToHomeScreenPopup"
    @showInstructions="handleShowInstructions"
  />
  <HowToAddPopup
    :show="showHowToAddPopup"
    @close="handleCloseHowToAddPopup"
  />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useAudioStore } from '@/stores/audioStore';
import { preloadImages } from '@/utils/imageLoader';
import AddToHomeScreenPopup from '@/components/AddToHomeScreenPopup.vue';
import HowToAddPopup from '@/components/HowToAddPopup.vue';

const isLoading = ref(true);
const loadingProgress = ref(0);

const audioStore = useAudioStore();
let hasInteracted = false;

const showAddToHomeScreenPopup = ref(false);
const showHowToAddPopup = ref(false);



// アセットのプリロード処理
onMounted(async () => {
  const imagePaths = [
    '/assets/images/back/loading.png',
    '/assets/images/back/shrine.png',
    '/assets/images/back/back_out_shrine.png',
    '/assets/images/back/back_hai.png',
    '/assets/images/back/back_out.png',
    '/assets/images/back/mat.png',
    '/assets/images/back/タイトルロゴ.png',
    '/assets/images/back/タイトルロゴ_en.png',
    '/assets/images/back/title_back_eye.png',
    '/assets/images/back/title_back.png',
    '/assets/images/button/buckToTitle.png',
    '/assets/images/button/kan_button.png',
    '/assets/images/button/pon_button.png',
    '/assets/images/button/riichi_button.png',
    '/assets/images/button/ron_button.png',
    '/assets/images/button/rule_button.png',
    '/assets/images/button/skip_button.png',
    '/assets/images/button/tsumo_button.png',
    '/assets/images/button/yaku_button.png',
    '/assets/images/info/cat_coin.png',
    '/assets/images/info/cat_icon_1.png',
    '/assets/images/info/cat_icon_2.png',
    '/assets/images/info/cat_icon_3.png',
    '/assets/images/info/cat_icon_4.png',
    '/assets/images/info/hito_icon_1.png',
    '/assets/images/info/info_bottom.png',
    '/assets/images/info/info_left.png',
    '/assets/images/info/info_right.png',
    '/assets/images/info/info_top.png',
    '/assets/images/info/ton1.png',
    '/assets/images/info/ton2.png',
    '/assets/images/info/ton3.png',
    '/assets/images/info/ton4.png',
    '/assets/images/info/zan_1000.png',
    '/assets/images/info/logo-black.png',
    '/assets/images/info/Instagram_logo.png',
    '/assets/images/number/-.png',
    '/assets/images/number/0.png',
    '/assets/images/number/00.png',
    '/assets/images/number/0ao.png',
    '/assets/images/number/0w.png',
    '/assets/images/number/1.png',
    '/assets/images/number/1ao.png',
    '/assets/images/number/1w.png',
    '/assets/images/number/2.png',
    '/assets/images/number/2ao.png',
    '/assets/images/number/2w.png',
    '/assets/images/number/3.png',
    '/assets/images/number/3ao.png',
    '/assets/images/number/3w.png',
    '/assets/images/number/4.png',
    '/assets/images/number/4ao.png',
    '/assets/images/number/4w.png',
    '/assets/images/number/5.png',
    '/assets/images/number/5ao.png',
    '/assets/images/number/5w.png',
    '/assets/images/number/6.png',
    '/assets/images/number/6ao.png',
    '/assets/images/number/6w.png',
    '/assets/images/number/7.png',
    '/assets/images/number/7ao.png',
    '/assets/images/number/7w.png',
    '/assets/images/number/8.png',
    '/assets/images/number/8ao.png',
    '/assets/images/number/8w.png',
    '/assets/images/number/9.png',
    '/assets/images/number/9ao.png',
    '/assets/images/number/9w.png',
    '/assets/images/status/furiten.png',
    '/assets/images/status/kan.png',
    '/assets/images/status/pon.png',
    '/assets/images/status/riichi.png',
    '/assets/images/status/ron.png',
    '/assets/images/status/tenpai.png',
    '/assets/images/status/tsumo.png',
    '/assets/images/tenbo/tenbou100.png',
    '/assets/images/tenbo/tenbou1000.png',
    '/assets/images/tenbo/tenbou10000.png',
    '/assets/images/tenbo/tenbou5000.png',
    '/assets/images/tiles/m1.png',
    '/assets/images/tiles/m2.png',
    '/assets/images/tiles/m3.png',
    '/assets/images/tiles/m4.png',
    '/assets/images/tiles/m5.png',
    '/assets/images/tiles/m6.png',
    '/assets/images/tiles/m7.png',
    '/assets/images/tiles/m8.png',
    '/assets/images/tiles/m9.png',
    '/assets/images/tiles/p1.png',
    '/assets/images/tiles/p2.png',
    '/assets/images/tiles/p3.png',
    '/assets/images/tiles/p4.png',
    '/assets/images/tiles/p5.png',
    '/assets/images/tiles/p6.png',
    '/assets/images/tiles/p7.png',
    '/assets/images/tiles/p8.png',
    '/assets/images/tiles/p9.png',
    '/assets/images/tiles/s1.png',
    '/assets/images/tiles/s2.png',
    '/assets/images/tiles/s3.png',
    '/assets/images/tiles/s4.png',
    '/assets/images/tiles/s5.png',
    '/assets/images/tiles/s6.png',
    '/assets/images/tiles/s7.png',
    '/assets/images/tiles/s8.png',
    '/assets/images/tiles/s9.png',
    '/assets/images/tiles/ura.png',
    '/assets/images/tiles/z1.png',
    '/assets/images/tiles/z2.png',
    '/assets/images/tiles/z3.png',
    '/assets/images/tiles/z4.png',
    '/assets/images/tiles/z5.png',
    '/assets/images/tiles/z6.png',
    '/assets/images/tiles/z7.png',
  ];
  const audioPaths = [
    '/assets/sounds/Kagura_Suzu01-7.mp3',
    '/assets/sounds/NES-JP-A03-2(Stage2-Loop140).mp3',
    '/assets/sounds/GB-JP-A02-2(Menu-Loop105).mp3',
    '/assets/sounds/NES-JP-A01-2(Title-Loop115).mp3',
    '/assets/sounds/打牌.mp3',
    '/assets/sounds/NES-JP-A04-2(Stage3-Loop125).mp3',
    '/assets/sounds/Percussive_Accent03-1(Dry).mp3',
    '/assets/sounds/Hyoshigi01-1.mp3',
    '/assets/sounds/Multi_Accent01-3(Dry).mp3',
    '/assets/sounds/Single_Accent17-2(Dry).mp3',
    '/assets/sounds/Kagura_Suzu03-1.mp3',
  ];

  const totalAssets = imagePaths.length + audioPaths.length;
  let loadedAssets = 0;

  const updateOverallProgress = () => {
    loadedAssets++;
    loadingProgress.value = (loadedAssets / totalAssets) * 100;
  };

  try {
    await Promise.all([
      preloadImages(imagePaths, updateOverallProgress),
      audioStore.preloadAudio(audioPaths, updateOverallProgress)
    ]);
  } catch (error) {
    console.error('Failed to preload assets:', error);
  } finally {
    // プリロード完了後、指定時間遅延させてローディング画面を非表示にする
    setTimeout(() => {
      isLoading.value = false;
      showAddToHomeScreenPopup.value = true;
    }, 500); // 500msの遅延
  }
});

const handleCloseAddToHomeScreenPopup = () => {
  showAddToHomeScreenPopup.value = false;
};

const handleShowInstructions = () => {
  showAddToHomeScreenPopup.value = false; // ポップアップを閉じる
  showHowToAddPopup.value = true; // 追加方法モーダルを表示
};

const handleCloseHowToAddPopup = () => {
  showHowToAddPopup.value = false;
};

onMounted(() => {
  document.addEventListener('visibilitychange', audioStore.handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', audioStore.handleVisibilityChange);
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* ルート要素でのスクロールを防止 */
  height: 100%;
  width: 100%;
  position: fixed; /* ビューポートをウィンドウサイズに固定 */
}

#app {
  height: 100%;
  width: 100%;
}

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #222; /* ローディング画面の背景色（暗め） */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 最前面に表示 */
  color: white;
  font-family: 'M PLUS Rounded 1c', sans-serif;
}

.loading-image {
  width: 80%; /* 必要に応じてサイズ調整 */
  max-width: 300px;
  margin-bottom: 20px;
}

.progress-bar-container {
  width: 80%;
  max-width: 400px;
  height: 20px;
  background-color: #555;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background-color: #4CAF50; /* プログレスバーの色（緑） */
  width: 0%; /* 初期幅 */
  transition: width 0.1s linear; /* プログレスバーの滑らかなアニメーション */
}

.loading-text {
  font-size: 1.2em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>