<script lang="ts">
/** A message that flickers in and out (e.g. a threshold crossed while typing) is not re-announced every time. */
const REPEAT_WINDOW_MS = 10_000
let lastAnnounced = { text: '', at: -Infinity }
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { announce, type Severity } from '@/scripts/common/toast'
import SeverityIcon from './SeverityIcon.vue'

const props = withDefaults(defineProps<{ severity?: Severity }>(), { severity: 'info' })
const root = ref<HTMLElement>()

// Errors use role=alert, which screen readers announce on insertion. Other messages are announced politely through
// the persistent live region: a role=status element inserted with its text already in place is usually not read.
onMounted(() => {
  if (props.severity === 'error') return
  const text = root.value?.textContent?.trim() ?? ''
  if (text === lastAnnounced.text && Date.now() - lastAnnounced.at < REPEAT_WINDOW_MS) return
  lastAnnounced = { text, at: Date.now() }
  announce(text)
})
</script>

<template>
  <div ref="root" class="message" :class="`message--${severity}`" :role="severity === 'error' ? 'alert' : undefined">
    <span class="message__icon">
      <SeverityIcon :severity="severity" />
    </span>
    <div class="message__text"><slot /></div>
  </div>
</template>

<style scoped>
.message {
  --accent: #95d5fd;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--accent) 4%, transparent)), rgba(22, 14, 37, 0.55);
  box-shadow: inset 3px 0 0 var(--accent);
  color: #f6f6f6;
  text-align: left;
  animation: message-in 220ms ease-out;
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .message {
    animation: none;
  }
}

.message--success {
  --accent: #19ff89;
}
.message--warn {
  --accent: #ff9519;
}
.message--error {
  --accent: #ff4219;
}

.message__icon {
  display: flex;
  flex-shrink: 0;
  color: var(--accent);
}
.message__icon svg {
  width: 1.375rem;
  height: 1.375rem;
}

.message__text {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
</style>
