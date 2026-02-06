import { createRouter, createWebHistory } from 'vue-router'
const AviationSituation = () =>
  import('@/views/aviation-situation/AviationSituation.vue')
const AAA = () => import('@/views/aaa/AAA.vue')

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
      path: '/AAA',
      name: 'AAA',
      component: AAA,
    },
  ],
})

export default router
