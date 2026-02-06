<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav>
    <RouterLink to="/AviationSituation">AviationSituation</RouterLink> |
    <RouterLink to="/AAA">AAAA</RouterLink>
  </nav>

  <RouterView />
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
