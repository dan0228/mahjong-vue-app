import { createRouter, createWebHashHistory } from 'vue-router';
import TitleView from '../views/TitleView.vue';
import GameView from '../views/GameView.vue';
import JannekoShrineView from '../views/JannekoShrineView.vue';
import { useAudioStore } from '../stores/audioStore';

const routes = [
  {
    path: '/',
    name: 'Title',
    component: TitleView,
    meta: {
      title: 'よんじゃん！ - 猫と一緒に楽しむ麻雀ゲーム',
      description: 'かわいい猫たちとオンラインで楽しめる麻雀ゲーム。初心者から上級者まで、いつでもどこでも手軽にプレイ！',
      bgm: 'NES-JP-A01-2(Title-Loop115).mp3'
    },
  },
  {
    path: '/game',
    name: 'Game',
    component: GameView,
    meta: {
      title: '対局画面 | よんじゃん！',
      description: '猫たちとの麻雀対局が楽しめるプレイ画面です。',
      bgm: 'NES-JP-A03-2(Stage2-Loop140).mp3'
    },
  },
  {
    path: '/shrine',
    name: 'JannekoShrine',
    component: JannekoShrineView,
    meta: {
      title: 'じゃんねこ神社 | よんじゃん！',
      description: 'ゲームで集めた「猫コイン」を使って、たくさんのお告げを集めよう！',
      bgm: 'GB-JP-A02-2(Menu-Loop105).mp3'
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// SEO: メタタグを更新するためのデフォルト値
const DEFAULT_TITLE = 'よんじゃん！';

router.afterEach((to) => {
  // タイトルを更新
  document.title = to.meta.title || DEFAULT_TITLE;

  // descriptionを更新
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute('content', to.meta.description || '');
  }
});


let hasInteracted = false;

// ユーザーの初回操作時にBGMを再生する関数
const playBgmOnFirstInteraction = (bgm) => {
  if (!hasInteracted) {
    hasInteracted = true;
    const audioStore = useAudioStore();
    audioStore.setBgm(bgm);
  }
  // イベントリスナーを削除し、二重にBGMが設定されないようにする
  window.removeEventListener('click', playBgmOnFirstInteraction);
  window.removeEventListener('keydown', playBgmOnFirstInteraction);
};

router.beforeEach((to, from, next) => {
  const audioStore = useAudioStore();

  // BGMが変更される場合
  if (to.meta.bgm !== from.meta.bgm) {
    // 初回操作がまだの場合、操作をトリガーとしてBGMを再生
    if (!hasInteracted) {
      window.addEventListener('click', () => playBgmOnFirstInteraction(to.meta.bgm));
      window.addEventListener('keydown', () => playBgmOnFirstInteraction(to.meta.bgm));
    } else {
      // 初回操作済みの場合は直接BGMを設定
      audioStore.setBgm(to.meta.bgm);
    }
  }

  // アプリケーションの初回ロード時、または直接URLアクセス時にタイトル画面へリダイレクト
  if (from.name === undefined && to.name !== 'Title') {
    next({ name: 'Title' });
  } else {
    next();
  }
});

export default router;