<script setup lang="ts">
import loader from '@/assets/images/loading-buffering.gif'
import MainBox from '@/components/ui/MainBox.vue'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import Arc200ClaimPage from '../components/Arc200ClaimPage.vue'
import PageFooter from '../components/PageFooter.vue'

const { t } = useI18n()
const state = reactive({
  loaded: false
})

onMounted(async () => {
  await getPublicConfiguration(true)
  state.loaded = true
})
</script>

<template>
  <main class="flex flex-col h-full">
    <div class="flex flex-col flex-1" v-if="state.loaded">
      <Arc200ClaimPage></Arc200ClaimPage>
    </div>
    <div class="flex flex-col flex-1" v-else>
      <MainBox><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('loading.bridgeConfiguration') }} </MainBox>
    </div>
    <PageFooter />
  </main>
</template>
