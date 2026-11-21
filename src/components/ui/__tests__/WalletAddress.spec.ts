import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import tooltip from '@/directives/tooltip'
import WalletAddress from '../WalletAddress.vue'

const ADDRESS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWX'
const render = (props: Record<string, unknown>) => mount(WalletAddress, { props, global: { directives: { tooltip } } })

describe('WalletAddress', () => {
  it('shortens the address and makes it focusable so the full value is reachable', () => {
    const span = render({ address: ADDRESS }).get('span')
    expect(span.text()).toBe('ABCD...UVWX')
    expect(span.attributes('tabindex')).toBe('0')
  })

  it('adds no tab stop when the full address is already visible', () => {
    const span = render({ address: ADDRESS, length: 30 }).get('span')
    expect(span.text()).toBe(ADDRESS)
    expect(span.attributes('tabindex')).toBeUndefined()
  })

  it('adds no tab stop or own tooltip inside an interactive parent (whose tooltip carries the address)', () => {
    const span = render({ address: ADDRESS, focusable: false }).get('span')
    expect(span.attributes('tabindex')).toBeUndefined()
    span.element.dispatchEvent(Object.assign(new Event('pointerenter'), { pointerType: 'mouse' }))
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
  })
})
