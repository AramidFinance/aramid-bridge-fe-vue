import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { addToast, removeAllToasts, toastMessages } from '@/scripts/common/toast'
import AppToast from '../AppToast.vue'

let wrapper: VueWrapper | undefined

// real Teleport (content lands in document.body), transitions disabled so items render synchronously
const mountToast = () => {
  wrapper = mount(AppToast, { attachTo: document.body, global: { mocks: { $t: (key: string) => key }, stubs: { transition: false, 'transition-group': false } } })
}

const $ = (selector: string) => document.querySelector<HTMLElement>(selector)
const items = () => document.querySelectorAll<HTMLElement>('.toast')

/** Lets the announcer's 50 ms clear-then-set delay run and re-render. */
const flushAnnouncement = async () => {
  await nextTick()
  vi.advanceTimersByTime(50)
  await nextTick()
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  removeAllToasts()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('AppToast', () => {
  it('renders summary, detail and severity', async () => {
    mountToast()
    addToast({ severity: 'error', summary: 'Failed', detail: 'Something broke' })
    await nextTick()
    const [item] = items()
    expect(item.classList).toContain('toast--error')
    expect(item.textContent).toContain('Failed')
    expect(item.textContent).toContain('Something broke')
  })

  it('announces new toasts through persistent live regions by urgency', async () => {
    mountToast()
    const polite = $('[aria-live="polite"]')!
    const assertive = $('[aria-live="assertive"]')!
    expect(polite.textContent).toBe('')

    addToast({ severity: 'success', detail: 'Copied' })
    addToast({ severity: 'error', summary: 'Failed', detail: 'Rejected' })
    await flushAnnouncement()
    expect(polite.textContent).toBe('Copied')
    expect(assertive.textContent).toBe('Failed: Rejected')

    // the same message again is re-announced (region cleared first), in the same live region node
    addToast({ severity: 'success', detail: 'Copied' })
    await nextTick()
    expect(polite.textContent).toBe('')
    await flushAnnouncement()
    expect($('[aria-live="polite"]')).toBe(polite)
    expect(polite.textContent).toBe('Copied')
    expect(assertive.textContent).toBe('')
  })

  it('closes when the close button is clicked', async () => {
    mountToast()
    addToast({ detail: 'bye' })
    await nextTick()
    $('button[aria-label="common.close"]')!.click()
    expect(toastMessages).toHaveLength(0)
  })

  it('auto-dismisses after its life and pauses while hovered', async () => {
    mountToast()
    addToast({ detail: 'timed', life: 3000 })
    await nextTick()
    const [item] = items()

    vi.advanceTimersByTime(1000)
    item.dispatchEvent(new Event('mouseenter'))
    await nextTick()
    vi.advanceTimersByTime(10000)
    expect(toastMessages).toHaveLength(1)
    expect($('.toast__progress')!.style.animationPlayState).toBe('paused')

    item.dispatchEvent(new Event('mouseleave'))
    vi.advanceTimersByTime(1999)
    expect(toastMessages).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toastMessages).toHaveLength(0)
  })

  it('pauses while focus is inside the toast', async () => {
    mountToast()
    addToast({ detail: 'timed', life: 1000 })
    await nextTick()
    const close = $('button[aria-label="common.close"]')!

    close.focus()
    vi.advanceTimersByTime(5000)
    expect(toastMessages).toHaveLength(1)
    close.blur()
    vi.advanceTimersByTime(1000)
    expect(toastMessages).toHaveLength(0)
  })

  it('keeps sticky toasts until closed', async () => {
    mountToast()
    addToast({ detail: 'sticky' })
    await nextTick()
    vi.advanceTimersByTime(60000)
    expect(toastMessages).toHaveLength(1)
    expect($('.toast__progress')).toBeNull()
  })
})
