<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import RoundButton from './RoundButton.vue'
import SimpleLabel from './SimpleLabel.vue'

const store = useAppStore()
</script>
<template>
  <div class="flex flex-col">
    <SimpleLabel> Direction </SimpleLabel>
    <RoundButton @click="store.state.arc200BridgeDirection = store.state.arc200BridgeDirection === 'ARC200ToASA' ? 'ASAToARC200' : 'ARC200ToASA'" class="mx-auto md:mx-0">
      <div v-if="store.state.arc200BridgeDirection == 'ARC200ToASA'" class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate">ARC200 To ASA</div>
      <div v-else-if="store.state.arc200BridgeDirection == 'ASAToARC200'" class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate">ASA To ARC200</div>
      <div v-else class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate">Select Direction</div>
    </RoundButton>
  </div>
</template>
