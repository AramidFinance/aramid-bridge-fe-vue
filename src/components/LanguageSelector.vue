<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'

const { locale } = useI18n()

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
]

const isOpen = ref(false)

const changeLanguage = (langCode: string) => {
  locale.value = langCode
  localStorage.setItem('locale', langCode)
  isOpen.value = false
}

const getCurrentLanguage = () => {
  return languages.find((lang) => lang.code === locale.value) || languages[0]
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.language-selector')) {
    isOpen.value = false
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<template>
  <div class="language-selector relative">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white-rgba hover:bg-white-rgba-hover transition-colors cursor-pointer border border-dark-elevation"
      type="button"
    >
      <span class="text-lg">{{ getCurrentLanguage().flag }}</span>
      <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute bottom-full right-0 mb-2 w-48 rounded-lg shadow-lg bg-[#15002E] border border-dark-elevation overflow-hidden z-50"
      style="background: rgba(21, 0, 46, 0.95); backdrop-filter: blur(10px)"
    >
      <div class="py-1">
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="changeLanguage(lang.code)"
          class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-white-rgba transition-colors"
          :class="{ 'bg-white-rgba': locale === lang.code }"
        >
          <span class="text-lg">{{ lang.flag }}</span>
          <span class="flex-1 text-left">{{ lang.name }}</span>
          <span v-if="locale === lang.code" class="text-[#FB7EFF]">✓</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.language-selector button {
  user-select: none;
}
</style>
