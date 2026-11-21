import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import tooltip from '../tooltip'

const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]')

const rect = (top: number, left: number, width: number, height: number): DOMRect =>
  ({ top, left, width, height, bottom: top + height, right: left + width, x: left, y: top, toJSON: () => ({}) }) as DOMRect

const pointer = (el: Element, type: string, pointerType = 'mouse') => {
  const event = new Event(type, { bubbles: type === 'pointerdown' })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  el.dispatchEvent(event)
}

const mountWith = (template: string, setup: () => Record<string, unknown> = () => ({})) => mount(defineComponent({ template, setup }), { attachTo: document.body, global: { directives: { tooltip } } })

afterEach(() => {
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
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    expect(tip()?.style.top).toBe('190px')
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
