import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RoundButton from '../RoundButton.vue'

describe('RoundButton', () => {
  it('is a focusable button activated by Enter and Space', async () => {
    const onClick = vi.fn()
    const wrapper = mount(RoundButton, { attrs: { onClick }, slots: { default: 'Connect' } })
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')

    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keydown', { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
