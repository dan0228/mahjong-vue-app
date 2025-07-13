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
    meta: { bgm: 'NES-JP-A01-2(Title-Loop115).mp3' },
  },
  {
    path: '/game',
    name: 'Game',
    component: GameView,
    meta: { bgm: 'NES-JP-A03-2(Stage2-Loop140).mp3' },
  },
  {
    path: '/shrine',
    name: 'JannekoShrine',
    component: JannekoShrineView,
    meta: { bgm: 'GB-JP-A02-2(Menu-Loop105).mp3' },
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const audioStore = useAudioStore();
  if (to.meta.bgm !== from.meta.bgm) {
    audioStore.setBgm(to.meta.bgm);
  }

  if (from.name === undefined && to.name !== 'Title') {
    next({ name: 'Title' });
  } else {
    next();
  }
});

export default router;