<template>
  <div class="banner">
    <div class="banner-inner">
      <a-carousel animation-name="fade" class="carousel">
        <a-carousel-item v-for="item in carouselItem" :key="item.slogan">
          <div :key="item.slogan" class="carousel-item">
            <div class="carousel-title">
              <BlurText
                :text="item.slogan"
                :delay="200"
                class-name="text-2xl font-semibold text-center"
                animate-by="words"
                direction="top"
                :threshold="0.1"
                root-margin="0px"
                :step-duration="0.35"
              />
            </div>
            <div class="carousel-sub-title">
              <SplitText
                :text="item.subSlogan"
                class-name="text-2xl font-semibold text-center"
                :delay="10"
                :duration="0.6"
                ease="power3.out"
                split-type="chars"
                :from="{ opacity: 0, y: 40 }"
                :to="{ opacity: 1, y: 0 }"
                :threshold="0.1"
                root-margin="-100px"
                text-align="center"
              />
            </div>
            <img :src="item.image" class="carousel-image" />
          </div>
        </a-carousel-item>
      </a-carousel>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import bannerImage from '@/assets/banner/login-banner.png';
  import BlurText from '@/components/blur-text/index.vue';
  import SplitText from '@/components/split-text/index.vue';

  const carouselItem = computed(() => [
    {
      slogan: '一站式云端 尽在掌控',
      subSlogan: '跨平台云存储集成解决方案，让文件管理更简单',
      image: bannerImage,
    },
  ]);
</script>

<style lang="less" scoped>
  .banner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    &-inner {
      flex: 1;
      height: 100%;
    }
  }

  .carousel {
    height: 100%;
    width: 100%;

    &-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 20px;
    }

    &-title {
      color: var(--color-fill-1);
      font-weight: 500;
      font-size: 20px;
      line-height: 28px;
    }

    &-sub-title {
      margin-top: 8px;
      color: var(--color-text-3);
      font-size: 14px;
      line-height: 22px;
    }

    &-image {
      width: 320px;
      margin-top: 30px;
    }
  }
</style>
