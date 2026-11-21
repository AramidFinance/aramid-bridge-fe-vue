<script setup lang="ts">
import { watch } from 'vue'
import { announce, isUrgent, liveRegions, toastMessages } from '@/scripts/common/toast'
import ToastItem from './ToastItem.vue'

// toasts already on screen when this mounts are not "new" later on
let seen = new Set<number>(toastMessages.map((message) => message.id))

watch(
  () => toastMessages.map((message) => message.id),
  (ids) => {
    for (const message of toastMessages) {
      if (!seen.has(message.id)) announce([message.summary, message.detail].filter(Boolean).join(': '), isUrgent(message.severity))
    }
    seen = new Set(ids)
  }
)
</script>

<template>
  <Teleport to="body">
    <section class="toast-region" :aria-label="$t('common.notifications')">
      <TransitionGroup tag="ol" name="toast" class="toast-list">
        <ToastItem v-for="message in toastMessages" :key="message.id" :message="message" />
      </TransitionGroup>
      <div class="toast-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ liveRegions.polite }}</div>
      <div class="toast-sr-only" role="alert" aria-live="assertive" aria-atomic="true">{{ liveRegions.assertive }}</div>
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

.toast-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
