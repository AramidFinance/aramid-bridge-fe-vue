<script setup lang="ts">
import DialogButton from './DialogButton.vue'

const props = defineProps({ img: String, text: String, id: String })
</script>
<template>
  <DialogButton :aria-label="`Connect ${props.text} wallet`">
    <div class="self-center 3xl:hidden 4xl:hidden pt-1">
      <img :alt="`${props.text} logo`" loading="lazy" width="30" height="30" decoding="async" data-nimg="1" :src="props.img" style="color: transparent" class="rounded-full" />
    </div>
    <div class="self-center hidden 3xl:block 4xl:hidden pt-2">
      <img :alt="`${props.text} logo`" loading="lazy" width="42" height="42" decoding="async" data-nimg="1" :src="props.img" style="color: transparent" class="rounded-full" />
    </div>
    <div class="self-center hidden 4xl:block pt-4">
      <img :alt="`${props.text} logo`" loading="lazy" width="59" height="59" decoding="async" data-nimg="1" :src="props.img" style="color: transparent" class="rounded-full" />
    </div>
    <div class="mr-2.5"></div>
    <div class="text-center flex flex-col justify-center">{{ props.text }}</div>
  </DialogButton>
</template>
