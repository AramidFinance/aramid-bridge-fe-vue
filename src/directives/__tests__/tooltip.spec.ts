import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import tooltip, { LONG_PRESS_MS } from '../tooltip'

const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]')

const rect = (top: number, left: number, width: number, height: number): DOMRect =>
  ({ top, left, width, height, bottom: top + height, right: left + width, x: left, y: top, toJSON: () => ({}) }) as DOMRect

const pointer = (el: Element, type: string, pointerType = 'mouse') => {
  const event = new Event(type, { bubbles: ['pointerdown', 'pointerup', 'pointercancel'].includes(type) })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  el.dispatchEvent(event)
}

const mountWith = (template: string, setup: () => Record<string, unknown> = () => ({})) => mount(defineComponent({ template, setup }), { attachTo: document.body, global: { directives: { tooltip } } })

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('v-tooltip', () => {
  it('shows on mouse hover, links it via aria-describedby, and hides on leave', () => {
    const wrapper = mountWith(`<button aria-describedby="other" v-tooltip.top="'Hello'">x</button>`)
    const button = wrapper.get('button').element
    // jsdom has no layout; place the target mid-screen so there is room above it
    button.getBoundingClientRect = () => rect(300, 300, 40, 20)

    pointer(button, 'pointerenter')
    expect(tip()?.textContent).toBe('Hello')
    expect(tip()?.dataset.placement).toBe('top')
    expect(button.getAttribute('aria-describedby')).toBe(`other ${tip()?.id}`)

    pointer(button, 'pointerleave')
    expect(tip()).toBeNull()
    expect(button.getAttribute('aria-describedby')).toBe('other')
    wrapper.unmount()
  })

  it('ignores touch "hover" so a tap does not leave a tooltip over what it opens', () => {
    const wrapper = mountWith(`<button v-tooltip="'Hello'">x</button>`)
    pointer(wrapper.get('button').element, 'pointerenter', 'touch')
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('closes on click and stays closed until the pointer re-enters', () => {
    const wrapper = mountWith(`<button v-tooltip="'Open dialog'">x</button>`)
    const button = wrapper.get('button').element

    pointer(button, 'pointerenter')
    expect(tip()).not.toBeNull()
    pointer(button, 'pointerdown')
    expect(tip()).toBeNull()
    // a mouse click focuses the button, which must not reopen it
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(false)
    button.focus()
    expect(tip()).toBeNull()

    pointer(button, 'pointerleave')
    pointer(button, 'pointerenter')
    expect(tip()).not.toBeNull()
    wrapper.unmount()
  })

  it('closes when activated from the keyboard (Enter/Space click), so it does not cover what opens', () => {
    const wrapper = mountWith(`<button v-tooltip="'Choose chain'">x</button>`)
    const button = wrapper.get('button').element
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(true) // keyboard focus
    button.focus()
    expect(tip()).not.toBeNull()
    button.click() // no pointerdown: keyboard activation
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('on touch, a tap does not open it but press-and-hold does; the next touch closes it', () => {
    vi.useFakeTimers()
    const wrapper = mountWith(`<button v-tooltip="'Origin wallet'">x</button>`)
    const button = wrapper.get('button').element

    pointer(button, 'pointerdown', 'touch')
    vi.advanceTimersByTime(100)
    pointer(button, 'pointerup', 'touch')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(tip()).toBeNull()

    pointer(button, 'pointerdown', 'touch')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(tip()?.textContent).toBe('Origin wallet')
    pointer(button, 'pointerup', 'touch')
    expect(tip()).not.toBeNull()

    pointer(document.body, 'pointerdown', 'touch')
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('swallows the click some browsers send after a long-press: the tooltip stays and the element is not activated', () => {
    vi.useFakeTimers()
    const activate = vi.fn()
    const wrapper = mountWith(`<button v-tooltip="'Origin wallet'" @click="activate"><img alt="" /></button>`, () => ({ activate }))
    const button = wrapper.get('button').element

    pointer(button, 'pointerdown', 'touch')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    pointer(button, 'pointerup', 'touch')
    wrapper.get('img').element.click() // the post-long-press click, on a child
    expect(activate).not.toHaveBeenCalled()
    expect(tip()).not.toBeNull()

    // a later, real tap activates as usual
    vi.advanceTimersByTime(400)
    button.click()
    expect(activate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('leaves native long-press behaviour alone when there is no tooltip text', () => {
    vi.useFakeTimers()
    const activate = vi.fn()
    const wrapper = mountWith(`<a href="#" v-tooltip="''" @click.prevent="activate">tx</a>`, () => ({ activate }))
    const link = wrapper.get('a').element
    expect(link.classList).not.toContain('aramid-tooltip-hold')

    pointer(link, 'pointerdown', 'touch')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    const menu = new Event('contextmenu', { cancelable: true })
    link.dispatchEvent(menu)
    expect(menu.defaultPrevented).toBe(false)
    pointer(link, 'pointerup', 'touch')
    link.click()
    expect(activate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('suppresses the iOS callout only where a long-press opens a tooltip', async () => {
    const text = ref('Hint')
    const wrapper = mountWith(`<div><a class="a" v-tooltip="text">x</a><input class="i" v-tooltip.focus="'Amount'" /></div>`, () => ({ text }))
    const hold = (selector: string) => wrapper.get(selector).classes().includes('aramid-tooltip-hold')
    expect(hold('.a')).toBe(true)
    expect(hold('.i')).toBe(false) // input hints are focus-only: keep the text-edit menu
    text.value = ''
    await nextTick()
    expect(hold('.a')).toBe(false)
    wrapper.unmount()
  })

  it('suppresses the native context menu only while a press is pending or open', () => {
    vi.useFakeTimers()
    const wrapper = mountWith(`<button v-tooltip="'Hint'">x</button>`)
    const button = wrapper.get('button').element
    const menu = () => {
      const event = new Event('contextmenu', { cancelable: true })
      button.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(menu()).toBe(false)
    pointer(button, 'pointerdown', 'touch')
    expect(menu()).toBe(true)
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(menu()).toBe(true)
    pointer(document.body, 'pointerdown', 'touch')
    expect(menu()).toBe(false)
    wrapper.unmount()
  })

  it('does not describe the element with a tooltip that repeats its aria-label', () => {
    const wrapper = mountWith(`<button aria-label="Copy ABC" v-tooltip="'Copy ABC'">x</button>`)
    const button = wrapper.get('button').element
    pointer(button, 'pointerenter')
    expect(tip()).not.toBeNull()
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    wrapper.unmount()
  })

  it('re-evaluates the describedby link when the text changes while open', async () => {
    const text = ref('Other')
    const wrapper = mountWith(`<button aria-label="Copy ABC" v-tooltip="text">x</button>`, () => ({ text }))
    const button = wrapper.get('button').element
    pointer(button, 'pointerenter')
    expect(button.getAttribute('aria-describedby')).toBe(tip()?.id)
    text.value = 'Copy ABC'
    await nextTick()
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    wrapper.unmount()
  })

  it('does not re-place an open tooltip when the host re-renders without changes', async () => {
    const tick = ref(0)
    const wrapper = mountWith(`<span v-tooltip="'Same'" :data-tick="tick">x</span>`, () => ({ tick }))
    pointer(wrapper.get('span').element, 'pointerenter')
    const spy = vi.spyOn(wrapper.get('span').element, 'getBoundingClientRect')
    tick.value++
    await nextTick()
    expect(spy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('closes a press-opened tooltip on a later real click (whatever it opens stays uncovered) and after a timeout', () => {
    vi.useFakeTimers()
    const wrapper = mountWith(`<button v-tooltip="'Hint'">x</button>`)
    const button = wrapper.get('button').element

    pointer(button, 'pointerdown', 'touch')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    pointer(button, 'pointerup', 'touch')
    vi.advanceTimersByTime(400) // past the post-long-press click window
    button.click() // e.g. Enter on the focused button
    expect(tip()).toBeNull()

    pointer(button, 'pointerdown', 'touch')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(tip()).not.toBeNull()
    vi.advanceTimersByTime(5000)
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('does not reopen when a click focuses a text field (which matches :focus-visible)', () => {
    const wrapper = mountWith(`<input v-tooltip="'Hint'" />`)
    const input = wrapper.get('input').element
    pointer(input, 'pointerenter')
    expect(tip()).not.toBeNull()
    pointer(input, 'pointerdown')
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(true)
    input.focus()
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('shows on keyboard focus of a descendant and hides on Escape', () => {
    const wrapper = mountWith(`<div v-tooltip="'Hint'"><button>a</button><button>b</button></div>`)
    const [a, b] = wrapper.findAll('button')
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(true) // :focus-visible (after findAll, which uses matches)

    a.element.focus()
    expect(tip()?.textContent).toBe('Hint')
    // moving focus within the target keeps it open
    b.element.focus()
    expect(tip()).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('with .focus only reacts to focus (mouse or keyboard), not hover, and survives clicks', () => {
    const wrapper = mountWith(`<input v-tooltip.focus.top="'Type an amount'" />`)
    const input = wrapper.get('input').element
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(false) // focused by mouse

    pointer(input, 'pointerenter')
    expect(tip()).toBeNull()
    pointer(input, 'pointerdown')
    input.focus()
    expect(tip()?.textContent).toBe('Type an amount')
    input.blur()
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('preserves newlines, updates text while open, and opens when text arrives while hovered', async () => {
    const text = ref('')
    const wrapper = mountWith(`<span v-tooltip="text">x</span>`, () => ({ text }))
    pointer(wrapper.get('span').element, 'pointerenter')
    expect(tip()).toBeNull()

    text.value = 'line 1\nline 2'
    await nextTick()
    expect(tip()?.textContent).toBe('line 1\nline 2')

    text.value = 'changed'
    await nextTick()
    expect(tip()?.textContent).toBe('changed')

    text.value = ''
    await nextTick()
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('flips to the opposite side when there is no room and stays centred on the target', () => {
    const wrapper = mountWith(`<span v-tooltip.top="'Flip'">x</span>`)
    const span = wrapper.get('span').element
    // target touching the top edge of the viewport: no room above
    span.getBoundingClientRect = () => rect(0, 100, 40, 20)
    const original = HTMLElement.prototype.getBoundingClientRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('role') === 'tooltip' ? rect(0, 0, 80, 30) : original.call(this)
    })

    pointer(span, 'pointerenter')
    expect(tip()?.dataset.placement).toBe('bottom')
    expect(tip()?.style.top).toBe('30px')
    expect(tip()?.style.left).toBe('80px')
    wrapper.unmount()
  })

  it('clamps to the viewport and picks the roomier side when neither side fits', () => {
    const wrapper = mountWith(`<span v-tooltip.top="'Tall'">x</span>`)
    const span = wrapper.get('span').element
    // jsdom viewport is 1024x768; 100px above the target, 648px below, tooltip 700px tall
    span.getBoundingClientRect = () => rect(100, 100, 40, 20)
    const original = HTMLElement.prototype.getBoundingClientRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('role') === 'tooltip' ? rect(0, 0, 80, 700) : original.call(this)
    })

    pointer(span, 'pointerenter')
    expect(tip()?.dataset.placement).toBe('bottom')
    expect(tip()?.style.top).toBe(`${768 - 8 - 700}px`)
    wrapper.unmount()
  })

  it('hides while the target is not rendered (display: none)', () => {
    const wrapper = mountWith(`<span v-tooltip="'Hidden'">x</span>`)
    const span = wrapper.get('span').element
    span.getBoundingClientRect = () => rect(0, 0, 0, 0)
    pointer(span, 'pointerenter')
    expect(tip()?.style.visibility).toBe('hidden')
    wrapper.unmount()
  })

  it('follows the target when layout moves it while open', async () => {
    const wrapper = mountWith(`<span v-tooltip.bottom="'Follow'">x</span>`)
    const span = wrapper.get('span').element
    let top = 100
    span.getBoundingClientRect = () => rect(top, 100, 40, 20)
    pointer(span, 'pointerenter')
    expect(tip()?.style.top).toBe('130px')

    top = 160 // e.g. a message was inserted above the target; no scroll/resize event
    document.body.prepend(document.createElement('p'))
    await new Promise((resolve) => requestAnimationFrame(resolve)) // checked once per frame
    expect(tip()?.style.top).toBe('190px')
    wrapper.unmount()
  })

  it('shows only the innermost of nested tooltips, restores the outer one after, and Escape closes both', () => {
    const wrapper = mountWith(`<div class="outer" v-tooltip="'Origin wallet'"><span class="inner" tabindex="0" v-tooltip="'ADDRESS'">AD..SS</span></div>`)
    const outer = wrapper.get('.outer').element
    const inner = wrapper.get('.inner').element
    const tips = () => [...document.querySelectorAll('[role="tooltip"]')].map((t) => t.textContent)

    pointer(outer, 'pointerenter')
    expect(tips()).toEqual(['Origin wallet'])
    pointer(inner, 'pointerenter')
    expect(tips()).toEqual(['ADDRESS'])
    pointer(inner, 'pointerleave')
    expect(tips()).toEqual(['Origin wallet'])

    // keyboard focus on the inner element bubbles to the outer target; still only the inner tooltip
    pointer(outer, 'pointerleave')
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(true)
    ;(inner as HTMLElement).focus()
    expect(tips()).toEqual(['ADDRESS'])

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(tips()).toEqual([])
    wrapper.unmount()
  })

  it('follows the target on scroll, hides while it is off screen, and is removed on unmount', () => {
    const wrapper = mountWith(`<span v-tooltip.bottom="'Follow'">x</span>`)
    const span = wrapper.get('span').element
    let top = 100
    span.getBoundingClientRect = () => rect(top, 100, 40, 20)

    pointer(span, 'pointerenter')
    expect(tip()?.style.top).toBe('130px')

    top = 200
    document.dispatchEvent(new Event('scroll'))
    expect(tip()?.style.top).toBe('230px')

    top = -500
    window.dispatchEvent(new Event('resize'))
    expect(tip()?.style.visibility).toBe('hidden')

    wrapper.unmount()
    expect(tip()).toBeNull()
  })
})
