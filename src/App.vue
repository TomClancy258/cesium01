<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <nav>
      <RouterLink to="/AviationSituation">AviationSituation</RouterLink> |
      <RouterLink to="/IntelligentWaterPumpStation">IntelligentWaterPumpStation</RouterLink> |
      <RouterLink to="/User">User</RouterLink> |
      <RouterLink to="/WebGL">WebGL</RouterLink>
    </nav>

    <RouterView />
  </el-config-provider>
</template>

<style lang="scss" scoped>
nav {
  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }

  height: 5vh;
  line-height: 5vh;
}
</style>
<style>
body {
  margin: 0;
}
</style>
