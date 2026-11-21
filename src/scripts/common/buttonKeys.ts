/**
 * Keyboard activation for elements styled as buttons but not rendered as `<button>` (role="button" divs), matching
 * native behaviour: Enter clicks on keydown (not on auto-repeat); Space clicks on keyup, only if the press started on
 * the element. Keys pressed on focusable children (bubbling up) are left to them.
 */
export const createButtonKeyHandlers = () => {
  let spacePressed = false
  const isOwn = (event: KeyboardEvent) => event.target === event.currentTarget
  const click = (event: KeyboardEvent) => (event.currentTarget as HTMLElement).click()

  return {
    onKeydown(event: KeyboardEvent) {
      if (!isOwn(event)) return
      if (event.key === 'Enter') {
        event.preventDefault()
        if (!event.repeat) click(event)
      } else if (event.key === ' ') {
        event.preventDefault() // Space would otherwise scroll the page
        spacePressed = true
      }
    },
    onKeyup(event: KeyboardEvent) {
      if (event.key !== ' ' || !spacePressed || !isOwn(event)) return
      spacePressed = false
      click(event)
    },
    onBlur() {
      spacePressed = false
    }
  }
}
