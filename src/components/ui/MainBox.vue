<template>
  <div
    class="flex flex-col flex-1 md:pt-10 md:pt-0 md:mt-0 m-4 lg:m-20 md:w-[800px] 2xl:w-[1000px] 3xl:w-[2000px] self-center justify-center"
  >
    <div
      class="flex flex-col w-full rounded-[32px] 3xl:rounded-b-[80px] 4xl:rounded-b-[128px] p-8 content-center items-center backdrop-blur-lg bg-white-0.3 shadow-lg border border-dark-elevation justify-center self-center drop-shadow-menu-default drop-shadow-menu-2"
    >
      <slot />
    </div>
  </div>
</template>
