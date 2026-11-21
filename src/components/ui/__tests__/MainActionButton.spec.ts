import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MainActionButton from '../MainActionButton.vue'

describe('MainActionButton', () => {
  it('is a focusable button activated from the keyboard', async () => {
    const onClick = vi.fn()
    const wrapper = mount(MainActionButton, { attrs: { onClick }, slots: { default: 'Review transaction' } })
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
