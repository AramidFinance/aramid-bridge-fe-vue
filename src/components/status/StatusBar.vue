<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'

const store = useAppStore()
const { t } = useI18n()
</script>
<template>
  <div class="md:block hidden w-full">
    <div class="mx-4">
      <div class="w-[80vw] md:w-full flex flex-row gap-2 items-center justify-between my-4">
        <div
          class="flex flex-row justify-center p-2 items-center m-1 text-xs bg-[#15002E] border-[#FB7EFF99] border rounded-full"
          :class="store.state.bridgeTx ? 'grayscale opacity-60' : 'opacity-100'"
        >
          <div class="bg-[#15002E] border-[#FB7EFF] border-2 font-extrabold text-[#FB7EFF] rounded-full p-2 h-5 w-5 flex flex-col items-center justify-center">1</div>
        </div>
        <div class="font-semibold text-white" :class="store.state.bridgeTx ? 'grayscale opacity-60' : 'opacity-100'">
          <span v-if="store.state.sourceChainConfiguration?.type == 'eth'">{{ t('status.approveAndSign') }}</span>
          <span v-else>{{ t('common.sign') }}</span>
        </div>
        <div class="w-full"><hr class="h-[1px] my-6 w-full bg-[#FB7EFF] border-0 dark:bg-gray-700" /></div>
        <div
          class="flex flex-row justify-center p-2 items-center m-1 text-xs bg-[#15002E] border-[#FB7EFF99] border rounded-full"
          :class="!store.state.bridgeTx || store.state.claimTx ? 'grayscale opacity-60' : 'opacity-100'"
        >
          <div class="bg-[#15002E] border-[#FB7EFF] border-2 font-extrabold text-[#FB7EFF] rounded-full p-2 h-5 w-5 flex flex-col items-center justify-center">2</div>
        </div>
        <div class="font-semibold text-white" :class="!store.state.bridgeTx || store.state.claimTx ? 'grayscale opacity-60' : 'opacity-100'">{{ t('status.bridgeStep') }}</div>
        <div class="w-full"><hr class="h-[1px] my-6 w-full bg-[#FB7EFF] border-0 dark:bg-gray-700" /></div>
        <div
          class="flex flex-row justify-center p-2 items-center m-1 text-xs bg-[#15002E] border-[#FB7EFF99] border rounded-full"
          :class="!store.state.claimTx ? 'grayscale opacity-60' : ' opacity-100'"
        >
          <div class="bg-[#15002E] border-[#FB7EFF] border-2 font-extrabold text-[#FB7EFF] rounded-full p-2 h-5 w-5 flex flex-col items-center justify-center">3</div>
        </div>
        <div class="font-semibold text-white" :class="!store.state.claimTx ? 'grayscale opacity-60' : ' opacity-100'">
          <span v-if="store.state.destinationChainConfiguration?.type == 'algo'">{{ t('status.receiveStep') }}</span>
          <span v-else>{{ t('status.claimStep') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
