<script setup lang="ts">
import { liveRegions, toastMessages } from '@/scripts/common/toast'
import ToastItem from './ToastItem.vue'

// A leaving toast is taken out of the flow (position: absolute) so the others can slide up; pin it where it was first,
// otherwise an absolute child of the flex list would jump to the top while it fades out.
const pinBeforeLeave = (el: Element) => {
  const item = el as HTMLElement
  item.style.top = `${item.offsetTop}px`
  item.style.left = `${item.offsetLeft}px`
  item.style.width = `${item.offsetWidth}px`
}
</script>

<template>
  <Teleport to="body">
    <!-- labelled (a landmark) only while there are notifications, so screen readers do not list an empty region -->
    <section class="toast-region" :aria-label="toastMessages.length ? $t('common.notifications') : undefined">
      <TransitionGroup tag="ol" name="toast" class="toast-list" @before-leave="pinBeforeLeave">
        <ToastItem v-for="message in toastMessages" :key="message.id" :message="message" />
      </TransitionGroup>
    </section>
    <!-- persistent live regions (see announce() in the toast store) -->
    <div class="toast-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ liveRegions.polite }}</div>
    <div class="toast-sr-only" role="alert" aria-live="assertive" aria-atomic="true">{{ liveRegions.assertive }}</div>
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
