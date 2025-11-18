<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const store = useAppStore()
</script>
<template>
  <div class="md:block hidden w-full">
    <div class="mx-4">
      <div class="w-[80vw] md:w-full flex flex-row gap-2 items-center justify-between my-4">
        <div
          class="flex flex-row justify-center p-2 items-center m-1 text-xs bg-main border-accent border rounded-full"
          :class="store.state.bridgeTx ? 'grayscale opacity-60' : 'opacity-100'"
        >
          <div class="bg-main border-primary border-2 font-extrabold text-primary rounded-full p-2 h-5 w-5 flex flex-col items-center justify-center">1</div>
        </div>
        <div class="font-semibold text-white" :class="store.state.bridgeTx ? 'grayscale opacity-60' : 'opacity-100'">
          <span v-if="store.state.sourceChainConfiguration?.type == 'eth'">Approve&nbsp;&&nbsp;Sign</span>
          <span v-else>Sign</span>
        </div>
        <div class="w-full"><hr class="h-[1px] my-6 w-full bg-primary border-0 dark:bg-gray-700" /></div>
        <div
          class="flex flex-row justify-center p-2 items-center m-1 text-xs bg-main border-accent border rounded-full"
          :class="!store.state.bridgeTx || store.state.claimTx ? 'grayscale opacity-60' : 'opacity-100'"
        >
          <div class="bg-main border-primary border-2 font-extrabold text-primary rounded-full p-2 h-5 w-5 flex flex-col items-center justify-center">2</div>
        </div>
        <div class="font-semibold text-white" :class="!store.state.bridgeTx || store.state.claimTx ? 'grayscale opacity-60' : 'opacity-100'">Bridge</div>
        <div class="w-full"><hr class="h-[1px] my-6 w-full bg-primary border-0 dark:bg-gray-700" /></div>
        <div
          class="flex flex-row justify-center p-2 items-center m-1 text-xs bg-main border-accent border rounded-full"
          :class="!store.state.claimTx ? 'grayscale opacity-60' : ' opacity-100'"
        >
          <div class="bg-main border-primary border-2 font-extrabold text-primary rounded-full p-2 h-5 w-5 flex flex-col items-center justify-center">3</div>
        </div>
        <div class="font-semibold text-white" :class="!store.state.claimTx ? 'grayscale opacity-60' : ' opacity-100'">
          <span v-if="store.state.destinationChainConfiguration?.type == 'algo'">Receive</span>
          <span v-else>Claim</span>
        </div>
      </div>
    </div>
  </div>
</template>
