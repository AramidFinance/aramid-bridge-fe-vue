<script setup lang="ts">
import { useToast } from '@/scripts/common/toast'

const toast = useToast()
const props = defineProps({ text: String, title: String })

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.text ?? '')
    const note = props.text && props.text?.length > 50 ? `${props.text?.substring(0, 50)}...` : props.text
    toast.add({
      severity: 'info',
      detail: `Copied to clipboard: ${note}`,
      life: 3000
    })
  } catch ($e) {
    toast.add({
      severity: 'error',
      detail: 'Cannot copy',
      life: 3000
    })
  }
}
const title = () => {
  if (props.title) return props.title
  if (props.text && props.text?.length > 100) {
    return `Copy: '${props.text?.substring(0, 100)}...'`
  }
  return props.text
}
</script>

<template>
  <button
    type="button"
    @click.stop="copy"
    v-tooltip.top="title()"
    :aria-label="$t('common.copy')"
    class="inline-flex items-center justify-center align-middle m-auto p-1 rounded-md cursor-pointer bg-transparent border-0 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#FB7EFF]"
  >
    <img alt="" aria-hidden="true" width="20" height="20" decoding="async" src="../../assets/images/CopySimple.svg" />
  </button>
</template>
