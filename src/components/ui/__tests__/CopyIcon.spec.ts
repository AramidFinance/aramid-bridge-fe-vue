import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { removeAllToasts } from '@/scripts/common/toast'
import tooltip from '@/directives/tooltip'
import CopyIcon from '../CopyIcon.vue'

afterEach(() => removeAllToasts())

describe('CopyIcon', () => {
  it('is a labelled button whose click does not reach the surrounding row', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const rowClick = vi.fn()
    const wrapper = mount(defineComponent({ render: () => h('div', { onClick: rowClick }, [h(CopyIcon, { text: 'ASSET-ID' })]) }), {
      global: { directives: { tooltip }, mocks: { $t: (key: string) => key } }
    })
    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe('common.copy')
    await button.trigger('click')
    expect(writeText).toHaveBeenCalledWith('ASSET-ID')
    expect(rowClick).not.toHaveBeenCalled()
  })
})
