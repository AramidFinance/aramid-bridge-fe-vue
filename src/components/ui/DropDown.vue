<script setup lang="ts">
import { highlightAramidText } from '@/scripts/common/highlightAramidText'
import { sanitizeTokenName } from '@/scripts/common/sanitizeTokenName'
import { computed } from 'vue'
import RoundButton from './RoundButton.vue'

const props = defineProps({ img: String, text: String })

const logoModules = import.meta.glob('../../assets/**/*.{png,svg}', { eager: true, import: 'default' }) as Record<string, string>

const getImageUrl = () => {
  if (!props.img) return ''
  return logoModules[`../../assets/${props.img}`] ?? ''
}

// Compute the highlighted text for the token name
const highlightedTokenName = computed(() => {
  const sanitized = sanitizeTokenName(props.text ?? '')
  return highlightAramidText(sanitized)
})
</script>
<template>
  <RoundButton>
    <div class="w-[40px] 3xl:w-[90px] 4xl:w-[143px] 3xl:h-[90px] 4xl:h-[143px] rounded-full 3xl:p-4 p-1 4xl:p-6" v-if="props.img">
      <img alt="Algorand" loading="lazy" width="40" height="40" decoding="async" data-nimg="1" :src="getImageUrl()" style="color: transparent; width: 100%; height: auto" />
    </div>
    <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-html="highlightedTokenName.html"></div>
    <div class="w-[30px] flex flex-row-reverse items-center">
      <img alt="downVectorIcon" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" src="../../assets/images/downVector.svg" style="color: transparent" />
    </div>
  </RoundButton>
</template>
