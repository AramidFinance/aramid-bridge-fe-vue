import type { Directive, DirectiveBinding } from 'vue'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

type TooltipValue = string | null | undefined

/** Gap between the target and the tooltip, and minimum distance kept from the viewport edge (px). */
const OFFSET = 10
const VIEWPORT_MARGIN = 8
/** Touch: press and hold this long to open a tooltip (a plain tap activates the element instead). */
export const LONG_PRESS_MS = 500
/** A touch-opened tooltip closes on the next touch anywhere, or after this long. */
const TOUCH_TOOLTIP_MS = 5000

const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

interface TooltipState {
  text: string
  placement: TooltipPlacement
  /** `.focus` modifier: only shown while the element has focus (input hints). */
  focusOnly: boolean
  id: string
  tip?: HTMLElement
  hovered: boolean
  focused: boolean
  /** Closed by a click or Escape; stays closed until the pointer re-enters or keyboard focus returns. */
  dismissed: boolean
  /** Opened by a touch long-press. */
  pressed: boolean
  pressTimer?: ReturnType<typeof setTimeout>
  pressCloseTimer?: ReturnType<typeof setTimeout>
  /** The click some browsers send when a long-press ends is swallowed: holding is for reading, not activating. */
  swallowClick: boolean
  /** Touch on a plain target (text, a value): a tap toggles the tooltip, as there is nothing else a tap would do. */
  tapping: boolean
  /** This touch closed the open tooltip (document listener runs first), so its tap must not reopen it. */
  tapClosed: boolean
  /** A tap just opened the tooltip: the click the browser sends after it must not close it again. */
  tapOpened: boolean
  /** A pointer press is in progress or just ended: the focus it causes is pointer focus, not keyboard focus. */
  pointerFocusPending: boolean
  pointerFocusTimer?: ReturnType<typeof setTimeout>
  /** Ancestors that clip their content (overflow other than visible), collected when the tooltip opens. */
  clippers: HTMLElement[]
  /** Target rect at the last placement, and the observer that re-places the tooltip when the page changes. */
  lastRect?: string
  observer?: MutationObserver
  frame?: number
  onKeydown: (event: KeyboardEvent) => void
  onReposition: () => void
  cleanup: () => void
}

const states = new WeakMap<HTMLElement, TooltipState>()
/** All elements carrying the directive, and those whose tooltip is open (for nested targets). */
const targets = new Set<HTMLElement>()
const open = new Set<HTMLElement>()
let nextId = 0

/** Directive targets that contain `el` (e.g. a button with a tooltip around an address with its own). */
const ancestorsOf = (el: HTMLElement): HTMLElement[] => [...targets].filter((target) => target !== el && target.contains(el))

const placementOf = (binding: DirectiveBinding<TooltipValue>): TooltipPlacement => {
  const { modifiers } = binding
  if (modifiers.bottom) return 'bottom'
  if (modifiers.left) return 'left'
  if (modifiers.right) return 'right'
  return 'top'
}

const textOf = (binding: DirectiveBinding<TooltipValue>): string => (binding.value == null ? '' : String(binding.value))

/** True when focus came from the keyboard (a mouse click on a button does not count). */
const isKeyboardFocus = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false
  try {
    return target.matches(':focus-visible')
  } catch {
    // selector unsupported: assume keyboard so the tooltip stays reachable
    return true
  }
}

const fits = (placement: TooltipPlacement, target: DOMRect, width: number, height: number): boolean => {
  switch (placement) {
    case 'top':
      return target.top - OFFSET - height >= VIEWPORT_MARGIN
    case 'bottom':
      return target.bottom + OFFSET + height <= window.innerHeight - VIEWPORT_MARGIN
    case 'left':
      return target.left - OFFSET - width >= VIEWPORT_MARGIN
    case 'right':
      return target.right + OFFSET + width <= window.innerWidth - VIEWPORT_MARGIN
  }
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), Math.max(min, max))

/** Free space on the given side of the target. */
const room = (placement: TooltipPlacement, target: DOMRect): number => {
  switch (placement) {
    case 'top':
      return target.top
    case 'bottom':
      return window.innerHeight - target.bottom
    case 'left':
      return target.left
    case 'right':
      return window.innerWidth - target.right
  }
}

const rectKey = (rect: DOMRect): string => `${rect.left},${rect.top},${rect.width},${rect.height}`

/**
 * Places the tooltip next to the target: the preferred side, else the opposite one if only that fits,
 * else whichever has more room; always kept inside the viewport.
 */
const position = (el: HTMLElement, state: TooltipState): void => {
  const tip = state.tip
  if (!tip) return
  const target = el.getBoundingClientRect()
  state.lastRect = rectKey(target)
  // target not rendered (display: none gives an empty rect), scrolled out of the window, or scrolled out of a
  // scrolling container (e.g. the asset list in a dialog): hide until it is back
  const hidden =
    (target.width === 0 && target.height === 0) ||
    target.bottom < 0 ||
    target.top > window.innerHeight ||
    target.right < 0 ||
    target.left > window.innerWidth ||
    state.clippers.some((clipper) => {
      const box = clipper.getBoundingClientRect()
      return target.bottom <= box.top || target.top >= box.bottom || target.right <= box.left || target.left >= box.right
    })
  tip.style.visibility = hidden ? 'hidden' : ''
  if (hidden) return

  // measure at the origin so the previous position does not squeeze the width of new text
  tip.style.left = '0px'
  tip.style.top = '0px'
  const { width, height } = tip.getBoundingClientRect()

  let placement = state.placement
  if (!fits(placement, target, width, height)) {
    const opposite = OPPOSITE[placement]
    if (fits(opposite, target, width, height) || room(opposite, target) > room(placement, target)) placement = opposite
  }

  const centerX = target.left + target.width / 2
  const centerY = target.top + target.height / 2
  const maxLeft = window.innerWidth - VIEWPORT_MARGIN - width
  const maxTop = window.innerHeight - VIEWPORT_MARGIN - height
  let left: number
  let top: number
  if (placement === 'top' || placement === 'bottom') {
    left = clamp(centerX - width / 2, VIEWPORT_MARGIN, maxLeft)
    top = clamp(placement === 'top' ? target.top - OFFSET - height : target.bottom + OFFSET, VIEWPORT_MARGIN, maxTop)
  } else {
    top = clamp(centerY - height / 2, VIEWPORT_MARGIN, maxTop)
    left = clamp(placement === 'left' ? target.left - OFFSET - width : target.right + OFFSET, VIEWPORT_MARGIN, maxLeft)
  }

  tip.dataset.placement = placement
  tip.style.left = `${Math.round(left)}px`
  tip.style.top = `${Math.round(top)}px`
  // keep the arrow pointing at the target even when the tooltip was shifted to stay on screen
  tip.style.setProperty('--arrow-x', `${Math.round(clamp(centerX - left, 14, width - 14))}px`)
  tip.style.setProperty('--arrow-y', `${Math.round(clamp(centerY - top, 12, height - 12))}px`)
}

/**
 * While open, follow the target when DOM changes move it (e.g. a message inserted above it); scroll and resize are
 * handled by listeners. Event-driven, and only re-places when the target's rect actually changed.
 */
const track = (el: HTMLElement, state: TooltipState): void => {
  if (typeof MutationObserver !== 'function' || typeof requestAnimationFrame !== 'function') return
  state.observer = new MutationObserver(() => {
    // coalesce bursts of mutations (including our own style writes) into one layout read per frame
    if (state.frame !== undefined) return
    state.frame = requestAnimationFrame(() => {
      state.frame = undefined
      if (state.tip && rectKey(el.getBoundingClientRect()) !== state.lastRect) position(el, state)
    })
  })
  state.observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })
}

const clippingAncestors = (el: HTMLElement): HTMLElement[] => {
  const result: HTMLElement[] = []
  for (let node = el.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node)
    if (overflowX !== 'visible' || overflowY !== 'visible') result.push(node)
  }
  return result
}

const addDescribedBy = (el: HTMLElement, id: string): void => {
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  if (!ids.includes(id)) el.setAttribute('aria-describedby', [...ids, id].join(' '))
}

const removeDescribedBy = (el: HTMLElement, id: string): void => {
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((value) => value && value !== id)
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '))
  else el.removeAttribute('aria-describedby')
}

const hide = (el: HTMLElement, state: TooltipState): void => {
  if (!state.tip) return
  state.tip.remove()
  state.tip = undefined
  open.delete(el)
  state.observer?.disconnect()
  state.observer = undefined
  if (state.frame !== undefined) cancelAnimationFrame(state.frame)
  state.frame = undefined
  removeDescribedBy(el, state.id)
  document.removeEventListener('keydown', state.onKeydown)
  document.removeEventListener('scroll', state.onReposition, true)
  window.removeEventListener('resize', state.onReposition)
  // an enclosing target that gave way to this one may show again (its pointer may still be over it)
  for (const ancestor of ancestorsOf(el)) {
    const ancestorState = states.get(ancestor)
    if (ancestorState) sync(ancestor, ancestorState)
  }
}

const show = (el: HTMLElement, state: TooltipState): void => {
  if (!el.isConnected) return
  if (!state.tip) {
    const tip = document.createElement('div')
    tip.id = state.id
    tip.className = 'aramid-tooltip'
    tip.setAttribute('role', 'tooltip')
    const text = document.createElement('div')
    text.className = 'aramid-tooltip__text'
    const arrow = document.createElement('div')
    arrow.className = 'aramid-tooltip__arrow'
    arrow.setAttribute('aria-hidden', 'true')
    tip.append(text, arrow)
    document.body.appendChild(tip)
    state.tip = tip
    state.clippers = clippingAncestors(el)
    open.add(el)

    document.addEventListener('keydown', state.onKeydown)
    // follow the target when any ancestor scrolls (capture) or the viewport resizes (e.g. a virtual keyboard opens)
    document.addEventListener('scroll', state.onReposition, true)
    window.addEventListener('resize', state.onReposition)
    track(el, state)
  }
  ;(state.tip.firstElementChild as HTMLElement).textContent = state.text
  // when the tooltip just repeats the accessible name, describing the element with it would read it twice
  if (el.getAttribute('aria-label') === state.text) removeDescribedBy(el, state.id)
  else addDescribedBy(el, state.id)
  position(el, state)
}

/**
 * Buttons (native or role=button) have no useful native long-press: no text to select, no link menu. Only there are
 * the context menu, the iOS callout and touch text selection suppressed in favour of the press-and-hold tooltip;
 * links, text and inputs keep their native long-press behaviour.
 */
const isControl = (el: HTMLElement): boolean => el.matches('button, [role="button"]')

const applyTouchCallout = (el: HTMLElement, state: TooltipState): void => {
  el.classList.toggle('aramid-tooltip-hold', !!state.text && !state.focusOnly && isControl(el))
}

function sync(el: HTMLElement, state: TooltipState): void {
  // unmounting (or unmounted): never rebuild the tooltip
  if (!targets.has(el)) {
    hide(el, state)
    return
  }
  // the innermost target wins: never show while a nested target's tooltip is open
  const nestedOpen = [...open].some((target) => target !== el && el.contains(target))
  const wanted = !!state.text && !state.dismissed && !nestedOpen && (state.focused || state.pressed || (state.hovered && !state.focusOnly))
  if (!wanted) {
    hide(el, state)
    return
  }
  show(el, state)
  // and enclosing targets give way, so two tooltips never stack on top of each other
  for (const ancestor of ancestorsOf(el)) {
    const ancestorState = states.get(ancestor)
    if (ancestorState?.tip) hide(ancestor, ancestorState)
  }
}

/**
 * `v-tooltip="text"` shows `text` on mouse hover, keyboard focus, and touch press-and-hold.
 * Modifiers: `.top` (default) / `.bottom` / `.left` / `.right` choose the preferred side;
 * `.focus` shows it only while the element has focus, from mouse, touch or keyboard (e.g. hints for inputs).
 * Clicking the element or pressing Escape closes it.
 */
export const tooltip: Directive<HTMLElement, TooltipValue> = {
  mounted(el, binding) {
    const state: TooltipState = {
      text: textOf(binding),
      placement: placementOf(binding),
      focusOnly: !!binding.modifiers.focus,
      id: `aramid-tooltip-${++nextId}`,
      hovered: false,
      focused: false,
      dismissed: false,
      clippers: [],
      pressed: false,
      swallowClick: false,
      tapping: false,
      tapClosed: false,
      tapOpened: false,
      pointerFocusPending: false,
      onKeydown: (event) => {
        if (event.key !== 'Escape') return
        // Escape closes enclosing tooltips too, rather than letting them take over
        for (const ancestor of ancestorsOf(el)) {
          const ancestorState = states.get(ancestor)
          if (ancestorState) ancestorState.dismissed = true
        }
        state.dismissed = true
        sync(el, state)
      },
      onReposition: () => position(el, state),
      cleanup: () => {
        clearTimeout(state.pointerFocusTimer)
        cancelPress()
        closePress()
        el.removeEventListener('pointerenter', onPointerEnter)
        el.removeEventListener('pointerleave', onPointerLeave)
        el.removeEventListener('pointerdown', onPointerDown)
        el.removeEventListener('pointerup', onPointerUp)
        el.removeEventListener('pointercancel', onPointerCancel)
        el.removeEventListener('click', onClickCapture, true)
        el.removeEventListener('click', onClick)
        el.removeEventListener('contextmenu', onContextMenu)
        el.removeEventListener('focusin', onFocusIn)
        el.removeEventListener('focusout', onFocusOut)
      }
    }

    // touch "hover" is just the tap that activates the element; it must not open the tooltip over what the tap opens
    const isTouch = (event: Event) => (event as PointerEvent).pointerType === 'touch'

    /** A pending long-press that has not fired yet is abandoned (finger lifted, or the browser took over to scroll). */
    function cancelPress() {
      clearTimeout(state.pressTimer)
      state.pressTimer = undefined
    }
    // a scroll that started on the target (pointercancel) is not a tap
    const onPointerCancel = () => {
      state.tapping = false
      state.tapClosed = false
      onPointerUp()
    }
    function closePress() {
      clearTimeout(state.pressCloseTimer)
      state.pressCloseTimer = undefined
      document.removeEventListener('pointerdown', closePressOnTouch, true)
      if (!state.pressed) return
      state.pressed = false
      sync(el, state)
    }
    function closePressOnTouch(event: Event) {
      if (state.pressed && event.target instanceof Node && el.contains(event.target)) state.tapClosed = true
      closePress()
    }
    const openPress = (swallowClick = true) => {
      state.pressTimer = undefined
      if (!state.text) return // emptied while the finger was down
      state.pressed = true
      state.swallowClick = swallowClick
      state.dismissed = false
      sync(el, state)
      // the next touch anywhere (or a timeout) closes it, as there is no "leave" on touch
      document.addEventListener('pointerdown', closePressOnTouch, true)
      state.pressCloseTimer = setTimeout(closePress, TOUCH_TOOLTIP_MS)
    }

    const onPointerEnter = (event: Event) => {
      if (isTouch(event)) return
      state.hovered = true
      state.dismissed = false
      sync(el, state)
    }
    const onPointerLeave = (event: Event) => {
      if (isTouch(event)) return
      state.hovered = false
      sync(el, state)
    }
    const onPointerDown = (event: Event) => {
      clearTimeout(state.pointerFocusTimer)
      state.pointerFocusPending = true
      state.swallowClick = false
      // clicking usually opens something (a dialog, a menu) the tooltip would cover; input hints stay
      if (state.focusOnly) return
      state.dismissed = true
      sync(el, state)
      if (!isTouch(event) || !state.text) return
      // Controls: a tap activates them, so the tooltip needs press-and-hold. Plain targets (a value, an address):
      // a tap toggles it. Links keep their native tap and long-press.
      if (isControl(el)) {
        cancelPress()
        state.pressTimer = setTimeout(openPress, LONG_PRESS_MS)
      } else if (!el.closest('a')) {
        state.tapping = true
      }
    }
    const onPointerUp = () => {
      cancelPress()
      // touch focuses on the compatibility mousedown after pointerup; give it a moment, then the press is over
      clearTimeout(state.pointerFocusTimer)
      state.pointerFocusTimer = setTimeout(() => (state.pointerFocusPending = false), 600)
      if (state.tapping) {
        state.tapping = false
        if (state.tapClosed) state.tapClosed = false
        else {
          openPress(false)
          // the tap's own click follows right away; it is not a request to close (unlike the long-press path,
          // nothing is swallowed: the click still reaches any other listeners)
          state.tapOpened = true
          setTimeout(() => (state.tapOpened = false), 400)
        }
      }
      // the click that may follow this release comes right away; after that, clicks are real again
      if (state.swallowClick) setTimeout(() => (state.swallowClick = false), 400)
    }
    // Capture phase on the target runs before the element's own click handlers (and those of its children).
    const onClickCapture = (event: Event) => {
      if (!state.swallowClick) return
      state.swallowClick = false
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    // Long-pressing an image or link would also open the native context menu / callout over the tooltip.
    const onContextMenu = (event: Event) => {
      if ((state.pressTimer !== undefined || state.pressed) && isControl(el)) event.preventDefault()
    }
    // Any click (mouse, or Enter/Space on the focused element) usually opens something the tooltip would cover,
    // so it closes; input hints stay.
    const onClick = () => {
      // the press is complete: focus arriving after this (e.g. returned by a closing dialog) is not from it
      clearTimeout(state.pointerFocusTimer)
      state.pointerFocusPending = false
      if (state.tapOpened) {
        state.tapOpened = false
        return
      }
      closePress()
      if (state.focusOnly) return
      state.dismissed = true
      sync(el, state)
    }
    const onFocusIn = (event: FocusEvent) => {
      // focus from a click/tap is not a request for the tooltip (text inputs match :focus-visible even when clicked)
      const fromPointer = state.pointerFocusPending
      state.pointerFocusPending = false
      if (!state.focusOnly && (fromPointer || !isKeyboardFocus(event.target))) return
      state.focused = true
      state.dismissed = false
      sync(el, state)
    }
    const onFocusOut = (event: FocusEvent) => {
      // focus moving between controls inside the target keeps the tooltip open
      if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return
      state.focused = false
      sync(el, state)
    }

    el.addEventListener('pointerenter', onPointerEnter)
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)
    el.addEventListener('click', onClickCapture, true)
    el.addEventListener('click', onClick)
    el.addEventListener('contextmenu', onContextMenu)
    applyTouchCallout(el, state)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    states.set(el, state)
    targets.add(el)
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    // Vue rewrites className when a :class binding changes, dropping our class: re-apply on every update
    applyTouchCallout(el, state)
    const text = textOf(binding)
    const placement = placementOf(binding)
    const focusOnly = !!binding.modifiers.focus
    // hosts re-render often (polling, typing): only touch the DOM when the tooltip itself changed
    if (text === state.text && placement === state.placement && focusOnly === state.focusOnly) return
    state.text = text
    state.placement = placement
    state.focusOnly = focusOnly
    applyTouchCallout(el, state)
    sync(el, state)
  },
  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return
    targets.delete(el)
    el.classList.remove('aramid-tooltip-hold')
    state.cleanup()
    hide(el, state)
    states.delete(el)
  }
}

export default tooltip

declare module 'vue' {
  interface GlobalDirectives {
    vTooltip: typeof tooltip
  }
}
