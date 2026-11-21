<script lang="ts">
/** Where keyboard focus was before it entered the toast region; shared so it survives moving between toasts. */
let returnFocus: HTMLElement | undefined
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { removeToast, setToastPaused, type ToastMessage } from '@/scripts/common/toast'
import SeverityIcon from './SeverityIcon.vue'

const props = defineProps<{ message: ToastMessage }>()

const root = ref<HTMLLIElement>()
const hovered = ref(false)
const focused = ref(false)
const paused = computed(() => hovered.value || focused.value)

let timer: ReturnType<typeof setTimeout> | undefined
let remaining = props.message.life ?? 0
let startedAt = 0

const dismiss = () => removeToast(props.message.id)

const isKeyboardFocused = (el: Element | null): boolean => {
  try {
    return !!el?.matches(':focus-visible')
  } catch {
    // selector unsupported: assume keyboard, so keyboard users are never stranded (matches the tooltip directive)
    return true
  }
}

const close = () => {
  const li = root.value
  // only keyboard users need focus carried along; a mouse click merely focused the button as a side effect
  if (li?.contains(document.activeElement) && isKeyboardFocused(document.activeElement)) {
    // keep keyboard users in place: move to a neighbouring toast, else back where they came from
    // toasts still playing their leave animation are on their way out: skip them
    const others = [...(li.parentElement?.children ?? [])].filter((item) => item === li || !item.classList.contains('toast-leave-active'))
    const index = others.indexOf(li)
    const sibling = (others[index + 1] ?? others[index - 1])?.querySelector<HTMLElement>('.toast__close')
    // last resort: the app root (tabindex=-1), so focus does not fall to <body> and restart at the top
    const target = sibling ?? (returnFocus?.isConnected ? returnFocus : document.getElementById('app2'))
    if (!sibling) returnFocus = undefined
    target?.focus({ preventScroll: true })
  }
  dismiss()
}

const start = () => {
  if (!props.message.life || timer !== undefined) return
  startedAt = Date.now()
  timer = setTimeout(dismiss, remaining)
}

const stop = () => {
  if (timer === undefined) return
  clearTimeout(timer)
  timer = undefined
  remaining = Math.max(0, remaining - (Date.now() - startedAt))
}

let unmounted = false

const update = () => {
  // the <li> keeps its listeners while it plays the leave animation; it must not re-pause a removed toast
  if (unmounted) return
  setToastPaused(props.message.id, paused.value)
  if (paused.value) stop()
  else start()
}

// touch sends no reliable "leave", so a tap would pause the toast forever; only real pointers pause it
const onPointerEnter = (event: PointerEvent) => {
  if (event.pointerType === 'touch') return
  hovered.value = true
  update()
}

const onPointerLeave = (event: PointerEvent) => {
  if (event.pointerType === 'touch') return
  hovered.value = false
  update()
}

const onFocusIn = (event: FocusEvent) => {
  if (event.relatedTarget instanceof HTMLElement && !event.relatedTarget.closest('.toast-region')) returnFocus = event.relatedTarget
  focused.value = true
  update()
}

const onFocusOut = (event: FocusEvent) => {
  // focus moving between elements inside the toast keeps it paused
  if (root.value?.contains(event.relatedTarget as Node | null)) return
  focused.value = false
  update()
}

onMounted(start)
onBeforeUnmount(() => {
  unmounted = true
  stop()
  setToastPaused(props.message.id, false)
})
</script>

<template>
  <li ref="root" class="toast" :class="`toast--${message.severity}`" @pointerenter="onPointerEnter" @pointerleave="onPointerLeave" @focusin="onFocusIn" @focusout="onFocusOut">
    <span class="toast__icon">
      <SeverityIcon :severity="message.severity" />
    </span>
    <div class="toast__body">
      <p v-if="message.summary" class="toast__summary">{{ message.summary }}</p>
      <p v-if="message.detail" class="toast__detail" :class="{ 'toast__detail--solo': !message.summary }">{{ message.detail }}</p>
    </div>
    <button type="button" class="toast__close" :aria-label="$t('common.close')" @click="close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
    <span v-if="message.life" class="toast__progress" :style="{ animationDuration: `${message.life}ms`, animationPlayState: paused ? 'paused' : 'running' }" aria-hidden="true" />
  </li>
</template>

<style scoped>
.toast {
  --accent: #fb7eff;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 0.875rem 1rem 1rem;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(246, 246, 246, 0.1);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent 55%), rgba(22, 10, 42, 0.92);
  box-shadow:
    0 16px 40px -12px rgba(0, 0, 0, 0.6),
    0 0 24px -8px color-mix(in srgb, var(--accent) 45%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #f6f6f6;
  font-family: Satoshi, ui-sans-serif, system-ui, sans-serif;
  pointer-events: auto;
}

.toast--success {
  --accent: #19ff89;
}
.toast--info {
  --accent: #95d5fd;
}
.toast--warn {
  --accent: #ff9519;
}
.toast--error {
  --accent: #ff4219;
}

.toast__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
}
.toast__icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.toast__body {
  flex: 1;
  min-width: 0;
  padding-top: 0.125rem;
}

.toast__summary {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.35;
}

.toast__detail {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: rgba(246, 246, 246, 0.75);
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.toast__detail--solo {
  margin-top: 0.4rem;
  color: rgba(246, 246, 246, 0.9);
}

.toast__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: -0.125rem -0.125rem 0 0;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: rgba(246, 246, 246, 0.55);
  cursor: pointer;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}
.toast__close svg {
  width: 1rem;
  height: 1rem;
}
.toast__close:hover {
  background: rgba(246, 246, 246, 0.1);
  color: #f6f6f6;
}
.toast__close:focus-visible {
  outline: 2px solid #fb7eff;
  outline-offset: 1px;
  color: #f6f6f6;
}

.toast__progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 40%, transparent), var(--accent));
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast__progress {
    display: none;
  }
}
</style>
