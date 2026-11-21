<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { toastMessages } from '@/scripts/common/toast'
import ToastItem from './ToastItem.vue'

// Screen readers only announce changes to live regions that already exist, so new toasts are mirrored
// into two persistent visually-hidden regions instead of giving each freshly inserted toast a role.
const politeText = ref('')
const assertiveText = ref('')
let announceTimer: ReturnType<typeof setTimeout> | undefined
let seen = new Set<number>()
// toasts arriving in quick succession are batched into one announcement rather than cancelling each other
const pending = { polite: [] as string[], assertive: [] as string[] }

watch(
  () => toastMessages.map((message) => message.id),
  (ids) => {
    const added = toastMessages.filter((message) => !seen.has(message.id))
    seen = new Set(ids)
    if (!added.length) return
    for (const message of added) {
      const text = [message.summary, message.detail].filter(Boolean).join(': ')
      pending[message.severity === 'error' || message.severity === 'warn' ? 'assertive' : 'polite'].push(text)
    }
    if (announceTimer !== undefined) return // already scheduled: it will include these
    // clear first so repeating the same message is announced again
    politeText.value = ''
    assertiveText.value = ''
    announceTimer = setTimeout(() => {
      announceTimer = undefined
      politeText.value = pending.polite.join('. ')
      assertiveText.value = pending.assertive.join('. ')
      pending.polite = []
      pending.assertive = []
    }, 50)
  }
)

onBeforeUnmount(() => clearTimeout(announceTimer))
</script>

<template>
  <Teleport to="body">
    <section class="toast-region" :aria-label="$t('common.notifications')">
      <TransitionGroup tag="ol" name="toast" class="toast-list">
        <ToastItem v-for="message in toastMessages" :key="message.id" :message="message" />
      </TransitionGroup>
      <div class="toast-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ politeText }}</div>
      <div class="toast-sr-only" role="alert" aria-live="assertive" aria-atomic="true">{{ assertiveText }}</div>
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
