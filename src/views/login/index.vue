<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div class="flex flex-col gap-4 p-6 md:p-10">
      <div class="flex flex-1 items-center justify-center">
        <div class="w-full max-w-xs">
          <LoginForm />
        </div>
      </div>
    </div>
    <div class="brand-background relative hidden lg:block overflow-hidden">
      <!-- 冒泡动画元素 -->
      <div class="absolute inset-0">
        <div class="bubble bubble-1" />
        <div class="bubble bubble-2" />
        <div class="bubble bubble-3" />
        <div class="bubble bubble-4" />
        <div class="bubble bubble-5" />
        <div class="bubble bubble-6" />
        <div class="bubble bubble-7" />
        <div class="bubble bubble-8" />
        <div class="bubble bubble-9" />
        <div class="bubble bubble-10" />
        <div class="bubble bubble-11" />
        <div class="bubble bubble-12" />
      </div>

      <!-- Logo容器 -->
      <div
        class="relative flex h-full flex-col items-center justify-center p-12"
      >
        <!-- Logo SVG -->
        <div class="brand-logo-wrapper mb-12">
          <img src="@/assets/logo-dark.svg?url" alt="Logo" class="brand-logo" />
        </div>

        <!-- 文字信息 -->
        <div class="relative z-10 text-center">
          <h2 class="mb-3 text-5xl font-bold tracking-wider text-white">
            Free Fs
          </h2>
          <p class="text-sm tracking-widest text-blue-200"> 自由云存储 </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import LoginForm from './components/login-form.vue';
</script>

<style scoped>
  .brand-background {
    background: linear-gradient(
      135deg,
      #1a2332 0%,
      #1e2d42 30%,
      #2a3f5f 50%,
      #1e2d42 70%,
      #1a2332 100%
    );
  }

  /* 冒泡动画 - 从下往上 */
  .bubble {
    position: absolute;
    top: 100%;
    border-radius: 50%;
    animation: float-up 10s infinite ease-in;
    opacity: 0;
  }

  .bubble-1 {
    left: 10%;
    animation-duration: 10s;
    animation-delay: -5s;
    width: 4px;
    height: 4px;
    background: rgba(42, 111, 232, 0.6);
  }
  .bubble-2 {
    left: 85%;
    animation-duration: 12s;
    animation-delay: -3s;
    width: 6px;
    height: 6px;
    background: rgba(91, 143, 249, 0.4);
  }
  .bubble-3 {
    left: 70%;
    animation-duration: 11s;
    animation-delay: -7s;
    width: 8px;
    height: 8px;
    background: rgba(42, 111, 232, 0.5);
  }
  .bubble-4 {
    left: 15%;
    animation-duration: 13s;
    animation-delay: -9s;
    width: 4px;
    height: 4px;
    background: rgba(91, 143, 249, 0.6);
  }
  .bubble-5 {
    left: 80%;
    animation-duration: 9s;
    animation-delay: -4s;
    width: 6px;
    height: 6px;
    background: rgba(42, 111, 232, 0.4);
  }
  .bubble-6 {
    left: 30%;
    animation-duration: 14s;
    animation-delay: -11s;
    width: 4px;
    height: 4px;
    background: rgba(91, 143, 249, 0.5);
  }
  .bubble-7 {
    left: 50%;
    animation-duration: 12s;
    animation-delay: -6s;
    width: 8px;
    height: 8px;
    background: rgba(42, 111, 232, 0.45);
  }
  .bubble-8 {
    left: 25%;
    animation-duration: 11s;
    animation-delay: -2s;
    width: 6px;
    height: 6px;
    background: rgba(91, 143, 249, 0.45);
  }
  .bubble-9 {
    left: 40%;
    animation-duration: 13s;
    animation-delay: -8s;
    width: 4px;
    height: 4px;
    background: rgba(42, 111, 232, 0.55);
  }
  .bubble-10 {
    left: 60%;
    animation-duration: 10s;
    animation-delay: -1s;
    width: 6px;
    height: 6px;
    background: rgba(91, 143, 249, 0.5);
  }
  .bubble-11 {
    left: 45%;
    animation-duration: 12s;
    animation-delay: -10s;
    width: 4px;
    height: 4px;
    background: rgba(42, 111, 232, 0.55);
  }
  .bubble-12 {
    left: 65%;
    animation-duration: 11s;
    animation-delay: -5.5s;
    width: 6px;
    height: 6px;
    background: rgba(91, 143, 249, 0.45);
  }

  /* Logo容器 */
  .brand-logo-wrapper {
    position: relative;
    width: 224px;
    height: 224px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Logo图片 */
  .brand-logo {
    position: relative;
    z-index: 10;
    width: 224px;
    height: 224px;
    object-fit: contain;
    mix-blend-mode: lighten;
  }

  /* 动画定义 */
  @keyframes float-up {
    0% {
      transform: translateY(0);
      opacity: 0;
    }
    10% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.6;
    }
    100% {
      transform: translateY(-100vh);
      opacity: 0;
    }
  }

  /* Tailwind-like utilities */
  .grid {
    display: grid;
  }

  .min-h-svh {
    min-height: 100vh;
  }

  .lg\:grid-cols-2 {
    grid-template-columns: 1fr 1fr;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .gap-4 {
    gap: 1rem;
  }

  .p-6 {
    padding: 1.5rem;
  }

  .flex-1 {
    flex: 1 1 0%;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .w-full {
    width: 100%;
  }

  .max-w-xs {
    max-width: 320px;
  }

  .relative {
    position: relative;
  }

  .hidden {
    display: none;
  }

  .lg\:block {
    display: block;
  }

  .overflow-hidden {
    overflow: hidden;
  }

  .absolute {
    position: absolute;
  }

  .inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .h-full {
    height: 100%;
  }

  .p-12 {
    padding: 3rem;
  }

  .mb-12 {
    margin-bottom: 3rem;
  }

  .z-10 {
    z-index: 10;
  }

  .text-center {
    text-align: center;
  }

  .mb-3 {
    margin-bottom: 0.75rem;
  }

  .text-5xl {
    font-size: 3rem;
    line-height: 1;
  }

  .font-bold {
    font-weight: 700;
  }

  .tracking-wider {
    letter-spacing: 0.05em;
  }

  .text-white {
    color: #ffffff;
  }

  .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .tracking-widest {
    letter-spacing: 0.1em;
  }

  .text-blue-200 {
    color: rgb(191, 219, 254);
  }

  @media (min-width: 768px) {
    .md\:p-10 {
      padding: 2.5rem;
    }
  }

  @media (max-width: 1023px) {
    .lg\:grid-cols-2 {
      grid-template-columns: 1fr;
    }

    .lg\:block {
      display: none;
    }
  }
</style>
