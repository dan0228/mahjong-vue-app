import { createRouter, createWebHashHistory } from 'vue-router';
import TitleView from '../views/TitleView.vue';
import GameView from '../views/GameView.vue';
import JannekoShrineView from '../views/JannekoShrineView.vue';

const routes = [
  {
    path: '/',
    name: 'Title',
    component: TitleView,
  },
  {
    path: '/game',
    name: 'Game',
    component: GameView,
    // props: true, // 必要に応じてルートパラメータをpropsとして渡す場合
  },
  {
    path: '/shrine',
    name: 'JannekoShrine',
    component: JannekoShrineView,
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  if (from.name === undefined && to.name !== 'Title') {
    next({ name: 'Title' });
  } else {
    next();
  }
});

export default router;