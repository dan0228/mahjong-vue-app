import { createRouter, createWebHashHistory } from 'vue-router';
import TitleView from '../views/TitleView.vue';
import GameView from '../views/GameView.vue';
import JannekoShrineView from '../views/JannekoShrineView.vue';
import { useAudioStore } from '../stores/audioStore';

const routes = [
  {
    path: '/email-confirmed',
    name: 'EmailConfirmed',
    component: () => import('../views/EmailUpdateConfirmationView.vue'),
    meta: {
      title: 'メールアドレス更新完了 | よんじゃん！',
      description: 'メールアドレスの更新が完了しました。',
    },
  },
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
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/LeaderboardView.vue'),
    meta: {
      title: 'ランキング | よんじゃん！',
      description: '最大連勝数のランキングです。',
      bgm: 'GB-JP-A02-2(Menu-Loop105).mp3'
    },
  },
  {
    path: '/matchmaking',
    name: 'Matchmaking',
    component: () => import('../views/MatchmakingView.vue'),
    meta: {
      title: 'オンライン対戦 | よんじゃん！',
      description: 'オンラインで対戦相手を探しています...',
      bgm: 'NES-JP-A02-2(Stage1-Loop110).mp3'
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// SEO: メタタグを更新するためのデフォルト値
const DEFAULT_TITLE = 'よんじゃん！';

/**
 * 各ルート遷移後に実行されるグローバルアフターフック。
 * ページのタイトルとメタディスクリプションを更新し、SEO対策を行います。
 * @param {RouteLocationNormalized} to - 遷移先のルートオブジェクト
 */
router.afterEach((to) => {
  // ページのタイトルを更新 (ルートメタ情報にタイトルがあればそれを使用、なければデフォルトタイトル)
  document.title = to.meta.title || DEFAULT_TITLE;

  // メタディスクリプションを更新
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute('content', to.meta.description || '');
  }
});


let hasInteracted = false; // ユーザーが初回操作を行ったかどうかのフラグ

/**
 * ユーザーの初回操作（クリックまたはキーダウン）時にBGMを再生する関数。
 * ブラウザの自動再生ポリシーに対応するため、ユーザー操作をトリガーとします。
 * 一度再生されたら、イベントリスナーは削除されます。
 * @param {string} bgm - 再生するBGMのファイル名
 */
const playBgmOnFirstInteraction = (bgm) => {
  if (!hasInteracted) {
    hasInteracted = true; // 初回操作フラグを立てる
    const audioStore = useAudioStore();
    audioStore.setBgm(bgm); // BGMを設定して再生
  }
  // イベントリスナーを削除し、BGMが二重に設定されないようにする
  window.removeEventListener('click', playBgmOnFirstInteraction);
  window.removeEventListener('keydown', playBgmOnFirstInteraction);
};

/**
 * 各ルート遷移前に実行されるグローバルビフォーフック。
 * BGMの切り替えと、アプリケーションの初回ロード時のリダイレクトを処理します。
 * @param {RouteLocationNormalized} to - 遷移先のルートオブジェクト
 * @param {RouteLocationNormalized} from - 遷移元のルートオブジェクト
 * @param {NavigationGuardNext} next - ナビゲーションを解決するための関数
 */
router.beforeEach((to, from, next) => {
  const audioStore = useAudioStore();

  // BGMが変更される場合
  if (to.meta.bgm !== from.meta.bgm) {
    // ユーザーがまだ初回操作を行っていない場合
    if (!hasInteracted) {
      // クリックとキーダウンイベントをリッスンし、初回操作時にBGMを再生
      window.addEventListener('click', () => playBgmOnFirstInteraction(to.meta.bgm));
      window.addEventListener('keydown', () => playBgmOnFirstInteraction(to.meta.bgm));
    } else {
      // ユーザーが既に初回操作済みの場合、直接BGMを設定して再生
      audioStore.setBgm(to.meta.bgm);
    }
  }

  // アプリケーションの初回ロード時、または直接URLアクセス時にタイトル画面へリダイレクト
  // from.name が undefined の場合、それはアプリケーションが初めてロードされたことを意味します。
  // この時、直接 '/game' などにアクセスされた場合でも、必ず '/'(Title) に一度遷移させます。
  // ただし、メール認証のコールバックページは例外的に直接アクセスを許可します。
  if (from.name === undefined && to.name !== 'Title' && to.name !== 'EmailConfirmed') {
    next({ name: 'Title' }); // タイトル画面へリダイレクト
  } else {
    next(); // 通常のナビゲーションを続行
  }
});

export default router;