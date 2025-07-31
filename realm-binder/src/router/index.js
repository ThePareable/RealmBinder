import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/my-games',
    name: 'MyGames',
    component: () => import('../pages/MyGames.vue')
  },
  {
    path: '/create-game',
    name: 'CreateGame',
    component: () => import('../pages/CreateGame.vue')
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: () => import('../pages/Game.vue')
  },
  {
    path: '/game/:id/invite',
    name: 'GameInvite',
    component: () => import('../pages/GameInvite.vue')
  },
  {
    path: '/join-game/:id',
    name: 'JoinGame',
    component: () => import('../pages/JoinGame.vue')
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 