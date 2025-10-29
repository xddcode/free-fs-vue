<template>
  <router-view v-slot="{ Component, route }">
    <transition appear mode="out-in" name="fade">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>

<script lang="ts" setup></script>

<style lang="less" scoped></style>
