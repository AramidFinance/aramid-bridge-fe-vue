import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppMessage from '../AppMessage.vue'

describe('AppMessage', () => {
  it('renders slot content with the severity style', () => {
    const wrapper = mount(AppMessage, { props: { severity: 'warn' }, slots: { default: 'Low balance' } })
    expect(wrapper.text()).toBe('Low balance')
    expect(wrapper.classes()).toContain('message--warn')
    expect(wrapper.attributes('role')).toBe('status') // a standing warning must not interrupt
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('announces errors assertively', () => {
    expect(mount(AppMessage, { props: { severity: 'error' }, slots: { default: 'Failed' } }).attributes('role')).toBe('alert')
  })

  it('defaults to a polite info message', () => {
    const wrapper = mount(AppMessage, { slots: { default: 'FYI' } })
    expect(wrapper.classes()).toContain('message--info')
    expect(wrapper.attributes('role')).toBe('status')
  })
})
