import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
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
    path: '/login',
    name: 'Login',
    component: () => import('../components/Auth/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../components/Auth/Register.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 