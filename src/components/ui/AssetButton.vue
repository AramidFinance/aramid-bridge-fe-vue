<script setup lang="ts">
import { sanitizeTokenName } from '@/scripts/common/sanitizeTokenName'
import CopyIcon from './CopyIcon.vue'

const props = defineProps({ img: String, text: String, id: String })

const getImageUrl = (name: string | undefined) => {
  const ret = new URL(`../../assets/logos/tokens/${name}.png`, import.meta.url)
  return ret.toString()
}
</script>
<template>
  <div
    class="bg-gradient-[90deg] cursor-pointer from-network-btn-tl to-network-btn-br border border-[#47556980] rounded-[16px] 3xl:rounded-[22px] 4xl:rounded-[31px] m-1 ease-in-out duration-100 hover:bg-white-rgba-0.3 flex flex-row py-1 px-2.5 3xl:text-xl 4xl:text-3xl"
  >
    <div class="self-center 3xl:hidden 4xl:hidden pt-1">
      <img alt="Algorand" loading="lazy" width="30" height="30" decoding="async" data-nimg="1" :src="getImageUrl(props.img)" style="color: transparent" />
    </div>
    <div class="self-center hidden 3xl:block 4xl:hidden pt-2">
      <img alt="Algorand" loading="lazy" width="42" height="42" decoding="async" data-nimg="1" :src="getImageUrl(props.img)" style="color: transparent" />
    </div>
    <div class="self-center hidden 4xl:block pt-4">
      <img alt="Algorand" loading="lazy" width="59" height="59" decoding="async" data-nimg="1" :src="getImageUrl(props.img)" style="color: transparent" />
    </div>
    <div class="mr-2.5"></div>
    <div class="text-center flex flex-col justify-center flex-1">
      <div class="w-full text-left">{{ sanitizeTokenName(props.text ?? '') }}</div>
      <div class="hidden md:inline-block text-left text-sm">({{ props.id }})</div>
    </div>
    <div class="">
      <CopyIcon :text="props.id" :title="`Copy asset ID: ${props.id}`"></CopyIcon>
    </div>
  </div>
</template>
