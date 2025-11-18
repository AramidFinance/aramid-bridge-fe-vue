<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import { Buffer } from 'buffer'
import getWeb3Modal from './scripts/eth/getWeb3Modal'
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
    <a href="#main-content" class="sr-only sr-only-focusable bg-white text-black font-bold z-[200]">Skip to main content</a>
    <Toast />
    <RouterView id="main-content" />
  </div>
</template>
