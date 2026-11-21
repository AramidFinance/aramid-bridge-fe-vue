<script setup lang="ts">
import { toastMessages } from '@/scripts/common/toast'
import ToastItem from './ToastItem.vue'
</script>

<template>
  <Teleport to="body">
    <section class="toast-region" :aria-label="$t('common.notifications')">
      <TransitionGroup tag="ol" name="toast" class="toast-list">
        <ToastItem v-for="message in toastMessages" :key="message.id" :message="message" />
      </TransitionGroup>
    </section>
  </Teleport>
</template>

<style scoped>
.toast-region {
  position: fixed;
  z-index: 9000;
  top: 1rem;
  right: 1rem;
  width: min(24rem, calc(100vw - 2rem));
  pointer-events: none;
}

.toast-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition:
    opacity 250ms ease,
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(1.5rem) scale(0.97);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(1.5rem);
}
/* take leaving items out of the flow so the rest slide up smoothly */
.toast-leave-active {
  position: absolute;
  width: 100%;
}

@media (max-width: 640px) {
  .toast-region {
    top: 0.75rem;
    right: 0.75rem;
    left: 0.75rem;
    width: auto;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(-1rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: opacity 150ms linear;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
