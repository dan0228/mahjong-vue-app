<template>
  <div v-if="isLoading">
    Now Loading...
  </div>
  <router-view v-else v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useAudioStore } from '@/stores/audioStore';
import { preloadImages } from '@/utils/imageLoader';

const isLoading = ref(true); // 初期値をtrueに設定

const audioStore = useAudioStore();
const bgmPlayer = ref(null);

// --- Preload Logic ---
onMounted(async () => {
  const imagePaths = [
    '/assets/images/back/shrine.png',
    '/assets/images/back/back_out_shrine.png',
    '/assets/images/back/back_hai.png',
    '/assets/images/back/back_out.png',
    '/assets/images/back/mat.png',
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
  ];

  try {
    await Promise.all([
      preloadImages(imagePaths),
      audioStore.preloadAudio(audioPaths)
    ]);
    console.log('All assets preloaded!');
  } catch (error) {
    console.error('Failed to preload assets:', error);
  } finally {
    isLoading.value = false; // プリロード完了後にローディングを終了
  }
});

// --- Autoplay Workaround ---
const startAudioContext = () => {
  if (audioStore.isBgmEnabled && bgmPlayer.value && bgmPlayer.value.paused) {
    bgmPlayer.value.play().catch(e => {
      // Autoplay might still be blocked, but we attempt it on first user interaction.
      console.warn("BGM autoplay failed on interaction, might require another user gesture:", e);
    });
  }
  // Remove the event listeners after the first interaction
  window.removeEventListener('click', startAudioContext);
  window.removeEventListener('keydown', startAudioContext);
  window.removeEventListener('touchstart', startAudioContext);
};

onMounted(() => {
  // Add listeners for the first user interaction to start audio
  window.addEventListener('click', startAudioContext);
  window.addEventListener('keydown', startAudioContext);
  window.addEventListener('touchstart', startAudioContext);
});

onUnmounted(() => {
  // Clean up listeners when the component is destroyed
  window.removeEventListener('click', startAudioContext);
  window.removeEventListener('keydown', startAudioContext);
  window.removeEventListener('touchstart', startAudioContext);
});
// --- End Autoplay Workaround ---

watch(() => audioStore.isBgmEnabled, (newVal) => {
  if (newVal) {
    if (bgmPlayer.value && bgmPlayer.value.paused) {
      bgmPlayer.value.play().catch(e => console.error("BGMの再生に失敗しました:", e));
    }
  } else {
    if (bgmPlayer.value && !bgmPlayer.value.paused) {
      bgmPlayer.value.pause();
    }
  }
});

watch(() => audioStore.currentBgm, (newBgm) => {
  if (bgmPlayer.value) {
    bgmPlayer.value.pause();
  }
  if (newBgm) {
    // プリロードされたAudioオブジェクトを使用
    const preloadedAudio = audioStore.audioPlayers.get(`/assets/sounds/${newBgm}`);
    if (preloadedAudio) {
      bgmPlayer.value = preloadedAudio;
      bgmPlayer.value.currentTime = 0; // 再生位置を先頭に
    } else {
      // プリロードされていない場合は新規作成 (フォールバック)
      console.warn(`BGM not preloaded: /assets/sounds/${newBgm}. Creating new Audio object.`);
      bgmPlayer.value = new Audio(`/assets/sounds/${newBgm}`);
    }
    bgmPlayer.value.loop = true;
    bgmPlayer.value.volume = audioStore.volume;
    if (audioStore.isBgmEnabled) {
      bgmPlayer.value.play().catch(e => console.error("BGMの再生に失敗しました:", e));
    }
  } else {
    bgmPlayer.value = null;
  }
});

watch(() => audioStore.volume, (newVolume) => {
  if (bgmPlayer.value) {
    bgmPlayer.value.volume = newVolume;
  }
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevents scrolling at the root level */
  height: 100%;
  width: 100%;
  position: fixed; /* Fixes the viewport to the window size */
}

#app {
  height: 100%;
  width: 100%;
}

/* グローバルなスタイルや、App.vue固有のスタイルをここに記述 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>