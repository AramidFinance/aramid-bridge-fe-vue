import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { liveRegions, resetAnnouncements } from '@/scripts/common/toast'
import AppMessage from '../AppMessage.vue'

/** settle delay + the announcer's clear-then-set delay */
const settle = () => vi.advanceTimersByTime(1000 + 50)

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

  it('announces non-error messages politely through the persistent live region once settled', () => {
    const wrapper = mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Escrow is low' } })
    expect(wrapper.attributes('role')).toBeUndefined()
    settle()
    expect(liveRegions.polite).toBe('Escrow is low')
    expect(liveRegions.assertive).toBe('')
  })

  it('stays quiet when it flickers in and out, but announces each time it really comes back', () => {
    mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Flicker' } }).unmount()
    settle()
    expect(liveRegions.polite).toBe('')

    mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Back again' } }).unmount()
    mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Back again' } })
    settle()
    expect(liveRegions.polite).toBe('Back again')
  })

  it('announces its new text when the content changes while shown', async () => {
    const text = ref('First')
    mount(defineComponent({ components: { AppMessage }, setup: () => ({ text }), template: `<AppMessage severity="info">{{ text }}</AppMessage>` }))
    settle()
    expect(liveRegions.polite).toBe('First')
    text.value = 'Second'
    await nextTick()
    settle()
    expect(liveRegions.polite).toBe('Second')
  })

  it('uses role=alert for errors (announced on insertion), without a duplicate live-region announcement', () => {
    const wrapper = mount(AppMessage, { props: { severity: 'error' }, slots: { default: 'Failed' } })
    expect(wrapper.attributes('role')).toBe('alert')
    settle()
    expect(liveRegions.polite).toBe('')
    expect(liveRegions.assertive).toBe('')
  })

  it('defaults to info', () => {
    expect(mount(AppMessage, { slots: { default: 'FYI' } }).classes()).toContain('message--info')
  })
})
