import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { addToast, MAX_TOASTS, removeAllToasts, resetAnnouncements, toastMessages } from '@/scripts/common/toast'
import AppToast from '../AppToast.vue'

let wrapper: VueWrapper | undefined

// real Teleport (content lands in document.body), transitions disabled so items render synchronously
const mountToast = () => {
  wrapper = mount(AppToast, { attachTo: document.body, global: { mocks: { $t: (key: string) => key }, stubs: { transition: false, 'transition-group': false } } })
}

const $ = (selector: string) => document.querySelector<HTMLElement>(selector)
const items = () => document.querySelectorAll<HTMLElement>('.toast')

const pointer = (el: Element, type: 'pointerenter' | 'pointerleave', pointerType = 'mouse') => {
  const event = new Event(type)
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  el.dispatchEvent(event)
}

/** Lets the announcer's 50 ms clear-then-set delay run and re-render. */
const flushAnnouncement = async () => {
  await nextTick()
  vi.advanceTimersByTime(50)
  await nextTick()
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.restoreAllMocks()
  wrapper?.unmount()
  wrapper = undefined
  removeAllToasts()
  resetAnnouncements()
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
    // the assertive region is left alone (an error may still be being read)
    expect(assertive.textContent).toBe('Failed: Rejected')
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
    pointer(item, 'pointerenter')
    await nextTick()
    vi.advanceTimersByTime(10000)
    expect(toastMessages).toHaveLength(1)
    expect($('.toast__progress')!.style.animationPlayState).toBe('paused')

    pointer(item, 'pointerleave')
    vi.advanceTimersByTime(1999)
    expect(toastMessages).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toastMessages).toHaveLength(0)
  })

  it('is not paused by a touch tap (touch never sends a reliable leave)', async () => {
    mountToast()
    addToast({ detail: 'timed', life: 1000 })
    await nextTick()
    pointer(items()[0], 'pointerenter', 'touch')
    vi.advanceTimersByTime(1000)
    expect(toastMessages).toHaveLength(0)
  })

  it('does not trim a toast that is being read when the list is full', async () => {
    mountToast()
    addToast({ detail: 'reading this' })
    await nextTick()
    pointer(items()[0], 'pointerenter')
    for (let i = 0; i < MAX_TOASTS; i++) addToast({ detail: `burst ${i}` })
    expect(toastMessages.map((m) => m.detail)).toContain('reading this')
    expect(toastMessages).toHaveLength(MAX_TOASTS)
  })

  it('moves focus to a neighbouring toast, then back to where it came from, when closing with the keyboard', async () => {
    const origin = document.createElement('button')
    document.body.append(origin)
    mountToast()
    addToast({ detail: 'first' })
    addToast({ detail: 'second' })
    await nextTick()
    origin.focus()
    const [first, second] = [...document.querySelectorAll<HTMLElement>('.toast__close')]

    first.focus()
    first.click()
    await nextTick()
    expect(document.activeElement).toBe(second)

    second.click()
    await nextTick()
    expect(document.activeElement).toBe(origin)
  })

  it('falls back to the app focus anchor when there is nowhere to return focus to', async () => {
    const root = document.createElement('div')
    root.id = 'app-focus-anchor'
    root.tabIndex = -1
    document.body.append(root)
    mountToast()
    addToast({ detail: 'only' })
    await nextTick()
    const close = $('.toast__close')!
    close.focus() // e.g. reached with a screen reader's virtual cursor: no relatedTarget
    close.click()
    await nextTick()
    expect(document.activeElement).toBe(root)
  })

  it('forgets where focus came from once the user leaves the toasts for the page', async () => {
    const root = document.createElement('div')
    root.id = 'app-focus-anchor'
    root.tabIndex = -1
    const a = document.createElement('button')
    document.body.append(root, a)
    mountToast()
    addToast({ detail: 'only' })
    await nextTick()
    const close = $('.toast__close')!

    a.focus()
    close.focus() // Tab in from A: A is remembered
    a.focus() // Shift+Tab back out without closing: forgotten
    a.blur()
    close.focus() // reached later with no relatedTarget (e.g. screen reader virtual cursor)
    close.click()
    await nextTick()
    expect(document.activeElement).toBe(root)
  })

  it('is not paused by mouse focus (pressing the close button and releasing elsewhere)', async () => {
    mountToast()
    addToast({ detail: 'timed', life: 1000 })
    await nextTick()
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(false) // not :focus-visible
    $('.toast__close')!.focus()
    vi.advanceTimersByTime(1000)
    expect(toastMessages).toHaveLength(0)
  })

  it('leaves focus alone when a toast is closed with the mouse', async () => {
    mountToast()
    addToast({ detail: 'first', life: 1000 })
    addToast({ detail: 'second', life: 1000 })
    await nextTick()
    const [first, second] = [...document.querySelectorAll<HTMLElement>('.toast__close')]
    first.focus() // browsers focus a clicked button...
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(false) // ...but not :focus-visible
    first.click()
    await nextTick()
    expect(document.activeElement).not.toBe(second)
    // the remaining toast is not paused by stolen focus
    vi.advanceTimersByTime(1000)
    expect(toastMessages).toHaveLength(0)
  })

  it('announces each toast once, when it is added (even one trimmed in the same burst)', async () => {
    addToast({ severity: 'error', detail: 'old' })
    vi.advanceTimersByTime(50)
    mountToast()
    expect($('[aria-live="assertive"]')!.textContent).toBe('old')
    addToast({ severity: 'error', detail: 'new' })
    await flushAnnouncement()
    expect($('[aria-live="assertive"]')!.textContent).toBe('new')

    for (let i = 0; i < MAX_TOASTS + 2; i++) addToast({ detail: `burst ${i}` })
    await flushAnnouncement()
    expect($('[aria-live="polite"]')!.textContent).toContain('burst 0')
  })

  it('is a labelled landmark only while there are notifications', async () => {
    mountToast()
    expect($('.toast-region')!.hasAttribute('aria-label')).toBe(false)
    addToast({ detail: 'hi' })
    await nextTick()
    expect($('.toast-region')!.getAttribute('aria-label')).toBe('common.notifications')
  })

  it('announces toasts that arrive in quick succession together', async () => {
    mountToast()
    addToast({ severity: 'error', detail: 'Chain failed' })
    await nextTick()
    vi.advanceTimersByTime(20)
    addToast({ severity: 'error', detail: 'Asset failed' })
    await flushAnnouncement()
    expect($('[aria-live="assertive"]')!.textContent).toBe('Chain failed. Asset failed')
  })

  it('pauses while focus is inside the toast', async () => {
    mountToast()
    addToast({ detail: 'timed', life: 1000 })
    await nextTick()
    const close = $('button[aria-label="common.close"]')!

    const outside = document.createElement('button')
    document.body.append(outside)

    close.focus()
    vi.advanceTimersByTime(5000)
    expect(toastMessages).toHaveLength(1)
    // the window losing focus (alt-tab: no relatedTarget) keeps it paused
    close.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    vi.advanceTimersByTime(5000)
    expect(toastMessages).toHaveLength(1)
    // moving focus to the page resumes the timer
    outside.focus()
    vi.advanceTimersByTime(1000)
    expect(toastMessages).toHaveLength(0)
  })

  it('resumes when focus moves to nothing (click on page background), unlike a window blur', async () => {
    mountToast()
    addToast({ detail: 'timed', life: 1000 })
    await nextTick()
    const close = $('.toast__close')!
    close.focus()
    close.blur() // focus goes to <body>: no relatedTarget, but the window still has focus
    await Promise.resolve()
    vi.advanceTimersByTime(1000)
    expect(toastMessages).toHaveLength(0)
  })

  it('hands focus off when a toast expires with (mouse) focus inside it', async () => {
    const anchor = document.createElement('span')
    anchor.id = 'app-focus-anchor'
    anchor.tabIndex = -1
    document.body.append(anchor)
    mountToast()
    addToast({ detail: 'expiring', life: 1000 })
    await nextTick()
    vi.spyOn(Element.prototype, 'matches').mockReturnValue(false) // mouse focus: does not pause
    $('.toast__close')!.focus()
    vi.advanceTimersByTime(1000)
    expect(toastMessages).toHaveLength(0)
    expect(document.activeElement).toBe(anchor)
  })

  it('hands focus off when a focused toast is removed by something other than its close button', async () => {
    const anchor = document.createElement('span')
    anchor.id = 'app-focus-anchor'
    anchor.tabIndex = -1
    document.body.append(anchor)
    mountToast()
    addToast({ detail: 'only' })
    await nextTick()
    $('.toast__close')!.focus()
    removeAllToasts()
    await nextTick()
    expect(document.activeElement).toBe(anchor)
  })

  it('pins a leaving toast where it was, so it fades out in place instead of jumping to the top', async () => {
    mountToast()
    addToast({ detail: 'first' })
    addToast({ detail: 'second' })
    await nextTick()
    const second = items()[1]
    Object.defineProperty(second, 'offsetTop', { value: 96 })
    Object.defineProperty(second, 'offsetWidth', { value: 384 })
    second.querySelector<HTMLElement>('.toast__close')!.click()
    await nextTick()
    expect(second.style.top).toBe('96px')
    expect(second.style.width).toBe('384px')
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
