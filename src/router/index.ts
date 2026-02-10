import { createRouter, createWebHistory } from 'vue-router'
const AviationSituation = () =>
  import('@/views/aviation-situation/AviationSituation.vue')
const User = () => import('@/views/user/User.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/AviationSituation',
    },
    {
      path: '/AviationSituation',
      name: 'AviationSituation',
      component: AviationSituation,
    },
    {
      path: '/User',
      name: 'User',
      component: User,
    },
  ],
})

export default router
