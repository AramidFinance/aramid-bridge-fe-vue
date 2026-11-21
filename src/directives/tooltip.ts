import type { Directive, DirectiveBinding } from 'vue'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

type TooltipValue = string | null | undefined

/** Gap between the target and the tooltip, and minimum distance kept from the viewport edge (px). */
const OFFSET = 10
const VIEWPORT_MARGIN = 8

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
  /** Target rect at the last placement, and the observer that re-places the tooltip when the page changes. */
  lastRect?: string
  observer?: MutationObserver
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
  // target not rendered (display: none gives an empty rect) or scrolled out of view: hide until it is back
  const hidden = (target.width === 0 && target.height === 0) || target.bottom < 0 || target.top > window.innerHeight || target.right < 0 || target.left > window.innerWidth
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
  if (typeof MutationObserver !== 'function') return
  state.observer = new MutationObserver(() => {
    if (state.tip && rectKey(el.getBoundingClientRect()) !== state.lastRect) position(el, state)
  })
  state.observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })
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
    open.add(el)
    addDescribedBy(el, state.id)
    document.addEventListener('keydown', state.onKeydown)
    // follow the target when any ancestor scrolls (capture) or the viewport resizes (e.g. a virtual keyboard opens)
    document.addEventListener('scroll', state.onReposition, true)
    window.addEventListener('resize', state.onReposition)
    track(el, state)
  }
  ;(state.tip.firstElementChild as HTMLElement).textContent = state.text
  position(el, state)
}

function sync(el: HTMLElement, state: TooltipState): void {
  // the innermost target wins: never show while a nested target's tooltip is open
  const nestedOpen = [...open].some((target) => target !== el && el.contains(target))
  const wanted = !!state.text && !state.dismissed && !nestedOpen && (state.focused || (state.hovered && !state.focusOnly))
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
 * `v-tooltip="text"` shows `text` on mouse hover and keyboard focus.
 * Modifiers: `.top` (default) / `.bottom` / `.left` / `.right` choose the preferred side;
 * `.focus` shows it only while the element has focus, from mouse or keyboard (e.g. hints for inputs).
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
        el.removeEventListener('pointerenter', onPointerEnter)
        el.removeEventListener('pointerleave', onPointerLeave)
        el.removeEventListener('pointerdown', onPointerDown)
        el.removeEventListener('focusin', onFocusIn)
        el.removeEventListener('focusout', onFocusOut)
      }
    }

    // touch "hover" is just the tap that activates the element; it must not open the tooltip over what the tap opens
    const isTouch = (event: Event) => (event as PointerEvent).pointerType === 'touch'

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
    const onPointerDown = () => {
      // clicking usually opens something (a dialog, a menu) the tooltip would cover; input hints stay
      if (state.focusOnly) return
      state.dismissed = true
      sync(el, state)
    }
    const onFocusIn = (event: FocusEvent) => {
      // a mouse click focusing a button is not a request for its tooltip
      if (!state.focusOnly && !isKeyboardFocus(event.target)) return
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
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    states.set(el, state)
    targets.add(el)
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    state.text = textOf(binding)
    state.placement = placementOf(binding)
    state.focusOnly = !!binding.modifiers.focus
    sync(el, state)
  },
  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return
    targets.delete(el)
    hide(el, state)
    state.cleanup()
    states.delete(el)
  }
}

export default tooltip

declare module 'vue' {
  interface GlobalDirectives {
    vTooltip: typeof tooltip
  }
}
