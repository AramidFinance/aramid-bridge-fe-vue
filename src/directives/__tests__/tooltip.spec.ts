import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import tooltip from '../tooltip'

const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]')

const rect = (top: number, left: number, width: number, height: number): DOMRect =>
  ({ top, left, width, height, bottom: top + height, right: left + width, x: left, y: top, toJSON: () => ({}) }) as DOMRect

const mountWith = (template: string, setup: () => Record<string, unknown> = () => ({})) => mount(defineComponent({ template, setup }), { attachTo: document.body, global: { directives: { tooltip } } })

afterEach(() => {
  document.body.innerHTML = ''
})

describe('v-tooltip', () => {
  it('shows on hover, links it via aria-describedby, and hides on leave', async () => {
    const wrapper = mountWith(`<button aria-describedby="other" v-tooltip.top="'Hello'">x</button>`)
    const button = wrapper.get('button')
    // jsdom has no layout; place the target mid-screen so there is room above it
    button.element.getBoundingClientRect = () => rect(300, 300, 40, 20)

    await button.trigger('mouseenter')
    expect(tip()?.textContent).toBe('Hello')
    expect(tip()?.dataset.placement).toBe('top')
    expect(button.attributes('aria-describedby')).toBe(`other ${tip()?.id}`)

    await button.trigger('mouseleave')
    expect(tip()).toBeNull()
    expect(button.attributes('aria-describedby')).toBe('other')
    wrapper.unmount()
  })

  it('shows on keyboard focus of a descendant and hides on Escape', () => {
    const wrapper = mountWith(`<div v-tooltip="'Hint'"><button>a</button><button>b</button></div>`)
    const [a, b] = wrapper.findAll('button')

    a.element.focus()
    expect(tip()?.textContent).toBe('Hint')
    // moving focus within the target keeps it open
    b.element.focus()
    expect(tip()).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('with .focus only reacts to focus, not hover', async () => {
    const wrapper = mountWith(`<input v-tooltip.focus.top="'Type an amount'" />`)
    const input = wrapper.get('input')

    await input.trigger('mouseenter')
    expect(tip()).toBeNull()
    input.element.focus()
    expect(tip()?.textContent).toBe('Type an amount')
    input.element.blur()
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('preserves newlines and updates text while open', async () => {
    const text = ref('line 1\nline 2')
    const wrapper = mountWith(`<span v-tooltip="text">x</span>`, () => ({ text }))
    await wrapper.get('span').trigger('mouseenter')
    expect(tip()?.textContent).toBe('line 1\nline 2')

    text.value = 'changed'
    await nextTick()
    expect(tip()?.textContent).toBe('changed')

    text.value = ''
    await nextTick()
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('shows nothing for an empty value', async () => {
    const wrapper = mountWith(`<span v-tooltip="undefined">x</span>`)
    await wrapper.get('span').trigger('mouseenter')
    expect(tip()).toBeNull()
    wrapper.unmount()
  })

  it('flips to the opposite side when there is no room and stays centred on the target', async () => {
    const wrapper = mountWith(`<span v-tooltip.top="'Flip'">x</span>`)
    // target touching the top edge of the viewport: no room above
    wrapper.get('span').element.getBoundingClientRect = () => rect(0, 100, 40, 20)
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function () {
      return this.getAttribute('role') === 'tooltip' ? rect(0, 0, 80, 30) : original.call(this)
    }
    try {
      await wrapper.get('span').trigger('mouseenter')
      expect(tip()?.dataset.placement).toBe('bottom')
      expect(tip()?.style.top).toBe('30px')
      expect(tip()?.style.left).toBe('80px')
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
    wrapper.unmount()
  })

  it('hides on scroll and removes the tooltip on unmount', async () => {
    const wrapper = mountWith(`<span v-tooltip="'Bye'">x</span>`)
    const span = wrapper.get('span')
    await span.trigger('mouseenter')
    document.dispatchEvent(new Event('scroll'))
    expect(tip()).toBeNull()

    await span.trigger('mouseenter')
    expect(tip()).not.toBeNull()
    wrapper.unmount()
    expect(tip()).toBeNull()
  })
})
