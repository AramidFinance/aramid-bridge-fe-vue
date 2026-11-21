<script setup lang="ts">
// a div styled as a pill button: give it button semantics and keyboard activation like a native <button>:
// Enter clicks on keydown (not on auto-repeat), Space clicks on keyup
const click = (event: KeyboardEvent) => (event.currentTarget as HTMLElement).click()
const onEnter = (event: KeyboardEvent) => {
  event.preventDefault()
  if (!event.repeat) click(event)
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    @keydown.enter="onEnter"
    @keydown.space.prevent
    @keyup.space="click"
    class="self-center px-2 items-center w-[200px] h-[40px] 2xl:w-[200px] 3xl:w-[294px] 3xl:h-[90px] 4xl:w-[412px] 4xl:h-[143px] flex backdrop-blur-xl rounded-[80px] place-content-center md:place-content-start m-auto md:m-0 ease-in-out duration-100 hover:bg-white-0.2 cursor-pointer select-none roundedButton focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FB7EFF]"
  >
    <slot />
  </div>
</template>
