<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import { announce, type Severity } from '@/scripts/common/toast'
import SeverityIcon from './SeverityIcon.vue'

/** A non-error message must stay this long before it is announced, so one flickering in and out stays quiet. */
const SETTLE_MS = 1000

const props = withDefaults(defineProps<{ severity?: Severity }>(), { severity: 'info' })
const root = ref<HTMLElement>()

// Announced through the persistent live regions (role=alert/status elements inserted with their text already in place
// are not read reliably by every screen reader): errors at once and assertively, others politely once settled; and
// again whenever the text changes.
let announced = ''
let settleTimer: ReturnType<typeof setTimeout> | undefined
const announceNow = () => {
  const text = root.value?.textContent?.trim() ?? ''
  if (text && text !== announced) announce(text, props.severity === 'error')
  announced = text
}
const scheduleAnnouncement = () => {
  clearTimeout(settleTimer)
  if (props.severity === 'error') announceNow()
  else settleTimer = setTimeout(announceNow, SETTLE_MS)
}
onMounted(scheduleAnnouncement)
onUpdated(scheduleAnnouncement)
onBeforeUnmount(() => clearTimeout(settleTimer))
</script>

<template>
  <div ref="root" class="message" :class="`message--${severity}`">
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
