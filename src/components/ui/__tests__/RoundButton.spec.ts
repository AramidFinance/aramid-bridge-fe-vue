import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RoundButton from '../RoundButton.vue'

const mountButton = () => {
  const onClick = vi.fn()
  const wrapper = mount(RoundButton, { attrs: { onClick }, slots: { default: 'Connect' } })
  return { wrapper, onClick }
}

describe('RoundButton', () => {
  it('is a focusable button', () => {
    const { wrapper } = mountButton()
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
  })

  it('clicks once on Enter, ignoring auto-repeat', async () => {
    const { wrapper, onClick } = mountButton()
    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keydown', { key: 'Enter', repeat: true })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('clicks on Space release like a native button, without scrolling on press', async () => {
    const { wrapper, onClick } = mountButton()
    const down = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    wrapper.element.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    expect(onClick).not.toHaveBeenCalled()
    await wrapper.trigger('keyup', { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('leaves keys pressed on a focusable child to that child', async () => {
    const onClick = vi.fn()
    const wrapper = mount(RoundButton, { attrs: { onClick }, slots: { default: '<button class="inner">copy</button>' } })
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    wrapper.get('.inner').element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(false)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('ignores a Space release whose press started elsewhere', async () => {
    const { wrapper, onClick } = mountButton()
    await wrapper.trigger('keyup', { key: ' ' })
    await wrapper.trigger('keydown', { key: ' ' })
    await wrapper.trigger('blur')
    await wrapper.trigger('keyup', { key: ' ' })
    expect(onClick).not.toHaveBeenCalled()
  })
})
