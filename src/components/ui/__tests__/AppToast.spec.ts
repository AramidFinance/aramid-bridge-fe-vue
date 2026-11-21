import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { addToast, removeAllToasts, toastMessages } from '@/scripts/common/toast'
import AppToast from '../AppToast.vue'

const mountToast = () =>
  mount(AppToast, {
    attachTo: document.body,
    global: { mocks: { $t: (key: string) => key }, stubs: { teleport: true, transition: false, 'transition-group': false } }
  })

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  removeAllToasts()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('AppToast', () => {
  it('renders summary, detail and severity', async () => {
    const wrapper = mountToast()
    addToast({ severity: 'error', summary: 'Failed', detail: 'Something broke' })
    await nextTick()
    const item = wrapper.get('li')
    expect(item.classes()).toContain('toast--error')
    expect(item.attributes('role')).toBe('alert')
    expect(item.text()).toContain('Failed')
    expect(item.text()).toContain('Something broke')
    wrapper.unmount()
  })

  it('uses a polite status role for info and success', async () => {
    const wrapper = mountToast()
    addToast({ severity: 'success', detail: 'ok' })
    await nextTick()
    expect(wrapper.get('li').attributes('role')).toBe('status')
    wrapper.unmount()
  })

  it('closes when the close button is clicked', async () => {
    const wrapper = mountToast()
    addToast({ detail: 'bye' })
    await nextTick()
    await wrapper.get('button[aria-label="common.close"]').trigger('click')
    expect(toastMessages).toHaveLength(0)
    wrapper.unmount()
  })

  it('auto-dismisses after its life and pauses while hovered', async () => {
    const wrapper = mountToast()
    addToast({ detail: 'timed', life: 3000 })
    await nextTick()
    const item = wrapper.get('li')

    vi.advanceTimersByTime(1000)
    await item.trigger('mouseenter')
    vi.advanceTimersByTime(10000)
    expect(toastMessages).toHaveLength(1)
    expect(wrapper.get('.toast__progress').attributes('style')).toContain('animation-play-state: paused')

    await item.trigger('mouseleave')
    vi.advanceTimersByTime(1999)
    expect(toastMessages).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toastMessages).toHaveLength(0)
    wrapper.unmount()
  })

  it('keeps sticky toasts until closed', async () => {
    const wrapper = mountToast()
    addToast({ detail: 'sticky' })
    await nextTick()
    vi.advanceTimersByTime(60000)
    expect(toastMessages).toHaveLength(1)
    expect(wrapper.find('.toast__progress').exists()).toBe(false)
    wrapper.unmount()
  })
})
