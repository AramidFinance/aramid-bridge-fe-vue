<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/scripts/common/toast'

const toast = useToast()
const { t } = useI18n()
const props = defineProps({ text: String, title: String })

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.text ?? '')
    const note = props.text && props.text?.length > 50 ? `${props.text?.substring(0, 50)}...` : props.text
    toast.add({
      severity: 'info',
      detail: `${t('common.copied')}: ${note}`,
      life: 3000
    })
  } catch ($e) {
    toast.add({
      severity: 'error',
      detail: t('common.copyFailed'),
      life: 3000
    })
  }
}
// one string for both the accessible name and the tooltip, so screen readers do not hear it twice
const label = computed(() => {
  if (props.title) return props.title
  const text = props.text && props.text.length > 100 ? `${props.text.substring(0, 100)}...` : (props.text ?? '')
  return `${t('common.copy')}: ${text}`
})
</script>

<template>
  <button
    type="button"
    @click="copy"
    v-tooltip.top="label"
    :aria-label="label"
    class="copy-icon inline-flex items-center justify-center align-middle m-auto p-1 rounded-md cursor-pointer bg-transparent border-0 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#FB7EFF]"
  >
    <img alt="" aria-hidden="true" width="20" height="20" decoding="async" src="../../assets/images/CopySimple.svg" />
  </button>
</template>
