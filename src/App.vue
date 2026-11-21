<script setup lang="ts">
import { Buffer } from 'buffer'
import AppToast from '@/components/ui/AppToast.vue'
import { RouterView } from 'vue-router'
// @ts-ignore
window.Buffer = Buffer

// fix old wallet connect library
// @ts-ignore
window.global ||= window
// fix new wallet connect library
// @ts-ignore
window.process = {
  env: {}
}
//console.log('window.process', window.process)

console.log('Welcome to the Aramid Bridge')
</script>

<template>
  <div id="app2" class="h-[100vh] overflow-auto flex flex-col text-gray-100 md:text-lg md:min-h-screen md:min-w-[550px] min-w-max">
    <!-- last-resort focus target (e.g. after closing the last toast): labelled, so it is not read as the whole app -->
    <span id="app-focus-anchor" tabindex="-1" class="sr-only">Aramid Bridge</span>
    <AppToast />
    <RouterView />
  </div>
</template>
