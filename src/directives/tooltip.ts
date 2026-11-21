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
  focusOnly: boolean
  id: string
  tip?: HTMLElement
  hovered: boolean
  focused: boolean
  onKeydown: (event: KeyboardEvent) => void
  onDismiss: () => void
  cleanup: () => void
}

const states = new WeakMap<HTMLElement, TooltipState>()
let nextId = 0

const placementOf = (binding: DirectiveBinding<TooltipValue>): TooltipPlacement => {
  const { modifiers } = binding
  if (modifiers.bottom) return 'bottom'
  if (modifiers.left) return 'left'
  if (modifiers.right) return 'right'
  return 'top'
}

const textOf = (binding: DirectiveBinding<TooltipValue>): string => (binding.value == null ? '' : String(binding.value))

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

/** Places the tooltip next to the target, flipping to the opposite side when it does not fit and keeping it on screen. */
const position = (el: HTMLElement, state: TooltipState): void => {
  const tip = state.tip
  if (!tip) return
  const target = el.getBoundingClientRect()
  const { width, height } = tip.getBoundingClientRect()

  let placement = state.placement
  if (!fits(placement, target, width, height) && fits(OPPOSITE[placement], target, width, height)) placement = OPPOSITE[placement]

  const centerX = target.left + target.width / 2
  const centerY = target.top + target.height / 2
  let left: number
  let top: number
  if (placement === 'top' || placement === 'bottom') {
    left = clamp(centerX - width / 2, VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - width)
    top = placement === 'top' ? target.top - OFFSET - height : target.bottom + OFFSET
  } else {
    top = clamp(centerY - height / 2, VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN - height)
    left = placement === 'left' ? target.left - OFFSET - width : target.right + OFFSET
  }

  tip.dataset.placement = placement
  tip.style.left = `${Math.round(left)}px`
  tip.style.top = `${Math.round(top)}px`
  // keep the arrow pointing at the target even when the tooltip was shifted to stay on screen
  const arrowX = clamp(centerX - left, 14, width - 14)
  const arrowY = clamp(centerY - top, 12, height - 12)
  tip.style.setProperty('--arrow-x', `${Math.round(arrowX)}px`)
  tip.style.setProperty('--arrow-y', `${Math.round(arrowY)}px`)
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
  removeDescribedBy(el, state.id)
  document.removeEventListener('keydown', state.onKeydown)
  document.removeEventListener('scroll', state.onDismiss, true)
  window.removeEventListener('resize', state.onDismiss)
}

const show = (el: HTMLElement, state: TooltipState): void => {
  if (!state.text || !el.isConnected) return
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
    addDescribedBy(el, state.id)
    document.addEventListener('keydown', state.onKeydown)
    // scrolling any ancestor (capture) or resizing would leave the tooltip detached from its target
    document.addEventListener('scroll', state.onDismiss, true)
    window.addEventListener('resize', state.onDismiss)
  }
  ;(state.tip.firstElementChild as HTMLElement).textContent = state.text
  position(el, state)
}

const sync = (el: HTMLElement, state: TooltipState): void => {
  if (state.focused || (state.hovered && !state.focusOnly)) show(el, state)
  else hide(el, state)
}

/**
 * `v-tooltip="text"` shows `text` on hover and keyboard focus.
 * Modifiers: `.top` (default) / `.bottom` / `.left` / `.right` choose the preferred side;
 * `.focus` shows it only while the element has focus (e.g. hints for inputs).
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
      onKeydown: (event) => {
        if (event.key === 'Escape') hide(el, state)
      },
      onDismiss: () => hide(el, state),
      cleanup: () => {
        el.removeEventListener('mouseenter', onMouseEnter)
        el.removeEventListener('mouseleave', onMouseLeave)
        el.removeEventListener('focusin', onFocus)
        el.removeEventListener('focusout', onBlur)
      }
    }

    const onMouseEnter = () => {
      state.hovered = true
      sync(el, state)
    }
    const onMouseLeave = () => {
      state.hovered = false
      sync(el, state)
    }
    const onFocus = () => {
      state.focused = true
      sync(el, state)
    }
    const onBlur = (event: FocusEvent) => {
      // focus moving between controls inside the target keeps the tooltip open
      if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return
      state.focused = false
      sync(el, state)
    }

    el.addEventListener('mouseenter', onMouseEnter)
    el.addEventListener('mouseleave', onMouseLeave)
    el.addEventListener('focusin', onFocus)
    el.addEventListener('focusout', onBlur)
    states.set(el, state)
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    state.text = textOf(binding)
    state.placement = placementOf(binding)
    state.focusOnly = !!binding.modifiers.focus
    if (!state.text) hide(el, state)
    else if (state.tip) show(el, state)
  },
  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return
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
