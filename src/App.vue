<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <el-config-provider :locale="zhCn">
      <header class="aviation-situation-header">
      <nav>
        <div class="nav-group nav-group--left">
          <RouterLink to="/AviationSituation">AviationSituation</RouterLink>
          <RouterLink to="/IntelligentWaterPumpStation">IntelligentWaterPump</RouterLink>
        </div>
<!--        <div class="nav-group nav-group&#45;&#45;right">-->
<!--          <RouterLink to="/User">User</RouterLink>-->
<!--          <RouterLink to="/WebGL">WebGL</RouterLink>-->
<!--        </div>-->
      </nav>
    </header>

    <RouterView />
  </el-config-provider>
</template>

<style lang="scss" scoped>
.aviation-situation-header {
  background-color: #050b1a;
  background-image: url('@/assets/img/header/header02.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  box-sizing: border-box;

  a {
    font-weight: bold;
    color: rgba(186, 230, 253, 0.9);
    text-decoration: none;

    &.router-link-exact-active {
      color: #22d3ee;
    }
  }
}

.nav-group {
  display: flex;
  align-items: center;

  // 用了 &：在「改父选择器本身」，不是找后代。编译成 → .nav-group--left
  &--left {
    margin-left: 120px; // 整组距屏幕左边

    a:nth-child(2) {
      margin-left: 80px; // 第二个链接相对第一个
    }
  }

  &--right {
    margin-right: 100px;
    a:nth-child(1) {
      margin-right: 80px;
    }
  }
}</style>
<style>
body {
  margin: 0;
}
</style>
