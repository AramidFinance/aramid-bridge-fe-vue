import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import tooltip from '@/directives/tooltip'
import { useAppStore } from '@/stores/app'
import ShortTx from '../ShortTx.vue'

const TX = 'TXABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTU'

const render = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAppStore()
  const wrapper = mount(ShortTx, { props: { txId: TX, chain: 416001 }, global: { plugins: [pinia], directives: { tooltip }, mocks: { $t: (key: string) => key } } })
  return { wrapper, store }
}

describe('ShortTx', () => {
  it('renders without a link for an unknown chain, and links once the configuration loads', async () => {
    const { wrapper, store } = render()
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('TXAB...RSTU')

    store.state.publicConfiguration = { chains: { '1': { blockExplorers: ['x'] } } } as never
    await nextTick()
    expect(wrapper.find('a').exists()).toBe(false)

    store.state.publicConfiguration = { chains: { '416001': { blockExplorers: ['https://explorer/tx/'] } } } as never
    await nextTick()
    expect(wrapper.get('a').attributes('href')).toBe(`https://explorer/tx/${TX}`)
  })
})
