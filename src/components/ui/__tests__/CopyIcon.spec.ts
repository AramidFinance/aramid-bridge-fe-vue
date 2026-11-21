import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createI18n } from 'vue-i18n'
import { removeAllToasts, toastMessages } from '@/scripts/common/toast'
import tooltip from '@/directives/tooltip'
import AssetButton from '../AssetButton.vue'
import CopyIcon from '../CopyIcon.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: { common: { copy: 'Copy' } } } })
const global = { plugins: [i18n], directives: { tooltip } }

const stubClipboard = () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

afterEach(() => removeAllToasts())

describe('CopyIcon', () => {
  it('copies, confirms with a toast, and lets the click propagate (outside-click handlers still see it)', async () => {
    const writeText = stubClipboard()
    const outer = vi.fn()
    const wrapper = mount(defineComponent({ render: () => h('div', { onClick: outer }, [h(CopyIcon, { text: 'ASSET-ID' })]) }), { global })
    await wrapper.get('button').trigger('click')
    expect(writeText).toHaveBeenCalledWith('ASSET-ID')
    expect(outer).toHaveBeenCalled()
    await Promise.resolve()
    expect(toastMessages[0]).toMatchObject({ severity: 'info' })
  })

  it('uses one string as accessible name and tooltip, so it is not read twice', async () => {
    const wrapper = mount(CopyIcon, { props: { text: 'ASSET-ID' }, global, attachTo: document.body })
    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe('Copy: ASSET-ID')
    const enter = new Event('pointerenter')
    Object.defineProperty(enter, 'pointerType', { value: 'mouse' })
    button.element.dispatchEvent(enter)
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Copy: ASSET-ID')
    expect(button.attributes('aria-describedby')).toBeUndefined()
    wrapper.unmount()
  })

  it('renders nothing while there is no value to copy', () => {
    expect(
      mount(CopyIcon, { props: { text: undefined }, global })
        .find('button')
        .exists()
    ).toBe(false)
  })

  it('prefers an explicit title', () => {
    expect(
      mount(CopyIcon, { props: { text: 'X', title: 'Copy asset ID: X' }, global })
        .get('button')
        .attributes('aria-label')
    ).toBe('Copy asset ID: X')
  })
})

describe('AssetButton', () => {
  it('has a keyboard-operable selection button with the copy button beside it, not nested inside', async () => {
    const wrapper = mount(AssetButton, { props: { text: 'Token', id: '123', img: 'algo' }, global })
    const row = wrapper.get('[role="button"]')
    expect(row.attributes('tabindex')).toBe('0')
    expect(row.find('button').exists()).toBe(false)
    expect(wrapper.find('.copy-icon').exists()).toBe(true)
    await row.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('selects the asset on a row click, but not when its copy button is used', async () => {
    stubClipboard()
    const wrapper = mount(AssetButton, { props: { text: 'Token', id: '123', img: 'algo' }, global })
    await wrapper.get('.copy-icon').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
