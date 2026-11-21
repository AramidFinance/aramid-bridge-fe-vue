import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import tooltip from '@/directives/tooltip'
import { useAppStore } from '@/stores/app'
import ShortTx from '../ShortTx.vue'

const TX = 'TXABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTU'

const render = (chain: string | number = 416001) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAppStore()
  const wrapper = mount(ShortTx, {
    props: { txId: TX, chain: Number(chain) },
    global: { plugins: [pinia, createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missingWarn: false, fallbackWarn: false })], directives: { tooltip } }
  })
  return { wrapper, store }
}

describe('ShortTx', () => {
  it('renders without a link for an unknown chain, and links once the configuration loads', async () => {
    const { wrapper, store } = render(555)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('TXAB...RSTU')

    store.state.publicConfiguration = {} as never // partial configuration without chains
    await nextTick()
    expect(wrapper.find('a').exists()).toBe(false)

    store.state.publicConfiguration = { chains: { '1': { blockExplorers: ['x'] } } } as never
    await nextTick()
    expect(wrapper.find('a').exists()).toBe(false)

    store.state.publicConfiguration = { chains: { '555': { blockExplorers: ['https://explorer/tx/'] } } } as never
    await nextTick()
    expect(wrapper.get('a').attributes('href')).toBe(`https://explorer/tx/${TX}`)
    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('defaults to Biatec Scan and lists other explorers in a dropdown', async () => {
    const { wrapper, store } = render()
    store.state.publicConfiguration = { chains: { '416001': { blockExplorers: ['https://allo.info/tx/'] } } } as never
    await nextTick()
    const links = wrapper.findAll('a')
    expect(links[0].attributes('href')).toBe(`https://algorand.scan.biatec.io/transaction/${TX}`)
    expect(wrapper.findAll('li a').map((a) => a.attributes('href'))).toEqual([`https://allo.info/tx/${TX}`])
  })

  it('closes the dropdown on Escape and on outside click', async () => {
    const { wrapper, store } = render()
    store.state.publicConfiguration = { chains: { '416001': { blockExplorers: ['https://allo.info/tx/'] } } } as never
    await nextTick()
    const details = wrapper.get('details')
    const el = details.element as HTMLDetailsElement
    el.open = true
    await details.trigger('toggle')
    await details.trigger('keydown', { key: 'Escape' })
    expect(el.open).toBe(false)
    el.open = true
    await details.trigger('toggle')
    document.body.click()
    expect(el.open).toBe(false)
  })

  it('uses Voi Biatec Scan on Voi', async () => {
    const { wrapper } = render(416101)
    await nextTick()
    expect(wrapper.get('a').attributes('href')).toBe(`https://voi.scan.biatec.io/transaction/${TX}`)
  })
})
