<template>
  <button
    type="button"
    class="self-center flex justify-center w-full h-[56px] 3xl:h-[80px] 4xl:h-[115px] bg-main ease-in-out duration-100 cursor-pointer hover:bg-confirm-btn-grey-hover select-none rounded-[33px] 3xl:rounded-[46px] 4xl:rounded-[65px] border-accent border-2 w-full mt-4 mx-4 px-4 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
  >
    <div class="flex flex-col justify-center text-primary-light font-bold text-xl 3xl:text-2xl 4xl:text-3xl">
      <slot />
    </div>
  </button>
</template>
