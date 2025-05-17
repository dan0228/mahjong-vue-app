import { createRouter, createWebHistory } from 'vue-router';
import TitleView from '../views/TitleView.vue';
import GameView from '../views/GameView.vue';

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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;