import { onUnmounted, watch, type Ref } from 'vue'
import { createFocusTrap, type FocusTrap } from 'focus-trap'

export function useFocusTrap(
  elementRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>
) {
  let trap: FocusTrap | null = null
  let previousActiveElement: HTMLElement | null = null

  watch(isActive, (active) => {
    if (active && elementRef.value) {
      // Store the currently focused element before activating trap
      previousActiveElement = document.activeElement as HTMLElement

      trap = createFocusTrap(elementRef.value, {
        initialFocus: () => {
          // Try to find the first focusable element
          const firstFocusable = elementRef.value?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement
          return firstFocusable || elementRef.value!
        },
        escapeDeactivates: true,
        clickOutsideDeactivates: false,
        returnFocusOnDeactivate: false, // We'll handle this manually
        fallbackFocus: elementRef.value,
        allowOutsideClick: true
      })

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        trap?.activate()
      }, 50)
    } else if (trap) {
      trap.deactivate()
      trap = null

      // Restore focus to trigger element
      if (previousActiveElement && previousActiveElement.isConnected) {
        setTimeout(() => {
          previousActiveElement?.focus()
        }, 50)
      }
    }
  })

  onUnmounted(() => {
    if (trap) {
      trap.deactivate()
      trap = null
    }
  })

  return {
    trap
  }
}