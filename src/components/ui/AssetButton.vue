<script setup lang="ts">
import { highlightAramidText } from '@/scripts/common/highlightAramidText'
import { sanitizeTokenName } from '@/scripts/common/sanitizeTokenName'
import { createButtonKeyHandlers } from '@/scripts/common/buttonKeys'
import { computed } from 'vue'
import CopyIcon from './CopyIcon.vue'

const props = defineProps({ img: String, text: String, id: String, arc200TokenId: String })
const emit = defineEmits<{ click: [event: MouseEvent] }>()
// The card is not itself a control: the selection button and the copy button sit side by side (a button inside a
// role=button would be flattened by screen readers). Clicks anywhere on the card except the copy button select.
const keys = createButtonKeyHandlers()

// copying the asset id is not choosing the asset (the click still propagates, so outside-click handlers see it)
const onRowClick = (event: MouseEvent) => {
  if ((event.target as Element | null)?.closest('.copy-icon')) return
  emit('click', event)
}

const getImageUrl = (name: string | undefined) => {
  const ret = new URL(`../../assets/logos/tokens/${name}.png`, import.meta.url)
  return ret.toString()
}

// Compute the highlighted text for the token name
const highlightedTokenName = computed(() => {
  const sanitized = sanitizeTokenName(props.text ?? '')
  return highlightAramidText(sanitized)
})
</script>
<template>
  <div
    @click="onRowClick"
    class="bg-gradient-[90deg] cursor-pointer from-network-btn-tl to-network-btn-br border border-[#47556980] rounded-[16px] 3xl:rounded-[22px] 4xl:rounded-[31px] m-1 ease-in-out duration-100 hover:bg-white-rgba-0.3 flex flex-row items-center py-1 px-2.5 3xl:text-xl 4xl:text-3xl"
  >
    <div
      role="button"
      tabindex="0"
      @keydown="keys.onKeydown"
      @keyup="keys.onKeyup"
      @blur="keys.onBlur"
      class="flex flex-row flex-1 min-w-0 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FB7EFF]"
    >
      <div class="self-center 3xl:hidden 4xl:hidden pt-1">
        <img alt="" loading="lazy" width="30" height="30" decoding="async" data-nimg="1" :src="getImageUrl(props.img)" style="color: transparent" />
      </div>
      <div class="self-center hidden 3xl:block 4xl:hidden pt-2">
        <img alt="" loading="lazy" width="42" height="42" decoding="async" data-nimg="1" :src="getImageUrl(props.img)" style="color: transparent" />
      </div>
      <div class="self-center hidden 4xl:block pt-4">
        <img alt="" loading="lazy" width="59" height="59" decoding="async" data-nimg="1" :src="getImageUrl(props.img)" style="color: transparent" />
      </div>
      <div class="mr-2.5"></div>
      <div class="text-center flex flex-col justify-center flex-1">
        <div class="w-full text-left" v-html="highlightedTokenName.html"></div>
        <div class="hidden md:inline-block text-left text-sm">({{ props.id }}{{ props.arc200TokenId ? ` <> ${props.arc200TokenId}` : '' }})</div>
      </div>
    </div>
    <CopyIcon :text="props.id"></CopyIcon>
  </div>
</template>
