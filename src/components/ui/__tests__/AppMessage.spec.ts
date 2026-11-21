import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { liveRegions, resetAnnouncements } from '@/scripts/common/toast'
import AppMessage from '../AppMessage.vue'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  resetAnnouncements()
  vi.useRealTimers()
})

describe('AppMessage', () => {
  it('renders slot content with the severity style and icon', () => {
    const wrapper = mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Low balance' } })
    expect(wrapper.text()).toBe('Low balance')
    expect(wrapper.classes()).toContain('message--warn')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('announces non-error messages politely through the persistent live region', () => {
    const wrapper = mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Escrow is low' } })
    expect(wrapper.attributes('role')).toBeUndefined()
    vi.advanceTimersByTime(50)
    expect(liveRegions.polite).toBe('Escrow is low')
    expect(liveRegions.assertive).toBe('')
  })

  it('uses role=alert for errors (announced on insertion), without a duplicate live-region announcement', () => {
    const wrapper = mount(AppMessage, { props: { severity: 'error' }, slots: { default: 'Failed' } })
    expect(wrapper.attributes('role')).toBe('alert')
    vi.advanceTimersByTime(50)
    expect(liveRegions.polite).toBe('')
    expect(liveRegions.assertive).toBe('')
  })

  it('does not re-announce the same message when it flickers back within a few seconds', () => {
    mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Flicker' } }).unmount()
    vi.advanceTimersByTime(50)
    resetAnnouncements()
    mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Flicker' } })
    vi.advanceTimersByTime(50)
    expect(liveRegions.polite).toBe('')
  })

  it('defaults to info', () => {
    expect(mount(AppMessage, { slots: { default: 'FYI' } }).classes()).toContain('message--info')
  })
})
