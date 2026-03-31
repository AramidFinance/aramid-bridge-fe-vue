<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const warnings = ref<string[]>([])
const dismissed = ref(false)
const show = ref(false)

let pollInterval: ReturnType<typeof setInterval> | null = null

const fetchStatus = async () => {
  try {
    const res = await fetch('https://explorer.aramid.finance/api/system-status')
    const data = await res.json()
    if (!data.ok && data.warnings?.length) {
      warnings.value = data.warnings
      show.value = true
      // If user had dismissed but a new degradation came in, show again
      dismissed.value = false
    } else {
      // System recovered — hide automatically
      show.value = false
      warnings.value = []
    }
  } catch {
    // Silently ignore network errors — don't alarm users over monitoring failures
  }
}

onMounted(() => {
  fetchStatus()
  pollInterval = setInterval(fetchStatus, 60_000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="opacity-0 -translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-full"
  >
    <div
      v-if="show && !dismissed"
      class="w-full border-b border-amber-500/20 bg-[#15002E]/95 backdrop-blur-md"
      role="alert"
      style="border-top: 2px solid #f59e0b;"
    >
      <div class="flex items-center gap-3 px-4 py-2.5">

        <!-- Pulsing live dot -->
        <span class="relative flex h-2 w-2 shrink-0">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
        </span>

        <!-- Label pill -->
        <span class="shrink-0 text-[10px] font-bold tracking-widest uppercase text-amber-400 border border-amber-500/40 rounded-full px-2 py-0.5">
          {{ t('systemHealth.label') }}
        </span>

        <!-- Divider -->
        <span class="shrink-0 text-amber-500/30 text-xs">|</span>

        <!-- Warnings -->
        <div class="flex-1 flex flex-wrap gap-x-4 gap-y-0.5 min-w-0">
          <span
            v-for="(msg, i) in warnings"
            :key="i"
            class="text-amber-200/70 text-xs"
          >{{ msg }}</span>
        </div>

        <!-- Dismiss -->
        <button
          @click="dismissed = true"
          :aria-label="t('systemHealth.dismiss')"
          class="shrink-0 ml-2 w-5 h-5 flex items-center justify-center rounded-full text-amber-500/50 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-150"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

      </div>
    </div>
  </Transition>
</template>
