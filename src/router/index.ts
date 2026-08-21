import { createRouter, createWebHistory } from 'vue-router'
const AviationSituation = () =>
  import('@/views/aviation-situation/AviationSituation.vue')
const IntelligentWaterPumpStation = () => import('@/views/intelligent_water_pump_station/IntelligentWaterPumpStation.vue')
const User = () => import('@/views/user/User.vue')
const WebGL = () => import('@/views/webgl/WebGL.vue')
const ShaderTest = () => import('@/views/shader/ShaderTest.vue')

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
      path: '/IntelligentWaterPumpStation',
      name: 'IntelligentWaterPumpStation',
      component: IntelligentWaterPumpStation,
    },
    {
      path: '/User',
      name: 'User',
      component: User,
    },
    {
      path: '/WebGL',
      name: 'WebGL',
      component: WebGL,
    },
    {
      path: '/ShaderTest',
      name: 'ShaderTest',
      component: ShaderTest,
    },
  ],
})

export default router
