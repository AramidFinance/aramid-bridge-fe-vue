import { afterEach, describe, expect, it, vi } from 'vitest'
import { addToast, announce, liveRegions, MAX_TOASTS, removeAllToasts, removeToast, resetAnnouncements, setToastPaused, toastMessages, useToast } from '../toast'

afterEach(() => {
  removeAllToasts()
  resetAnnouncements()
  vi.useRealTimers()
})

describe('toast store', () => {
  it('adds messages with defaults and unique ids', () => {
    const a = addToast({ detail: 'first' })
    const b = addToast({ severity: 'error', summary: 'Oops', detail: 'second', life: 3000 })
    expect(a).not.toBe(b)
    expect(toastMessages).toEqual([
      { id: a, severity: 'info', summary: undefined, detail: 'first', life: undefined },
      { id: b, severity: 'error', summary: 'Oops', detail: 'second', life: 3000 }
    ])
  })

  it('treats a non-positive life as sticky', () => {
    addToast({ detail: 'sticky', life: 0 })
    addToast({ detail: 'negative', life: -5 })
    expect(toastMessages.map((m) => m.life)).toEqual([undefined, undefined])
  })

  it('removes a single message and ignores unknown ids', () => {
    const a = addToast({ detail: 'a' })
    const b = addToast({ detail: 'b' })
    removeToast(a)
    removeToast(9999)
    expect(toastMessages.map((m) => m.id)).toEqual([b])
  })

  it('keeps at most MAX_TOASTS messages, dropping the oldest', () => {
    for (let i = 0; i < MAX_TOASTS + 2; i++) addToast({ detail: `m${i}` })
    expect(toastMessages).toHaveLength(MAX_TOASTS)
    expect(toastMessages[0].detail).toBe('m2')
    expect(toastMessages[MAX_TOASTS - 1].detail).toBe(`m${MAX_TOASTS + 1}`)
  })

  it('skips paused toasts when trimming and never drops the new one', () => {
    const reading = addToast({ detail: 'reading' })
    setToastPaused(reading, true)
    for (let i = 0; i < MAX_TOASTS; i++) addToast({ detail: `m${i}` })
    expect(toastMessages).toHaveLength(MAX_TOASTS)
    expect(toastMessages[0].detail).toBe('reading')
    expect(toastMessages[MAX_TOASTS - 1].detail).toBe(`m${MAX_TOASTS - 1}`)

    // everything paused: the limit is exceeded rather than hiding the newest message
    toastMessages.forEach((m) => setToastPaused(m.id, true))
    addToast({ detail: 'newest' })
    expect(toastMessages).toHaveLength(MAX_TOASTS + 1)
    expect(toastMessages[MAX_TOASTS].detail).toBe('newest')
  })

  it('trims info/success before warnings and errors', () => {
    addToast({ severity: 'error', detail: 'why the tx failed', life: 10000 })
    for (let i = 0; i < MAX_TOASTS; i++) addToast({ severity: 'info', detail: `copied ${i}`, life: 3000 })
    expect(toastMessages).toHaveLength(MAX_TOASTS)
    expect(toastMessages[0].detail).toBe('why the tx failed')
    expect(toastMessages[1].detail).toBe('copied 1')
  })

  it('turns non-string details (e.g. a thrown object) into readable text', () => {
    addToast({ detail: { code: 4001 } as never })
    addToast({ detail: new Error('rejected') as never })
    addToast({ detail: new Error('') as never })
    addToast({ detail: (() => 1) as never })
    expect(toastMessages.map((m) => m.detail)).toEqual(['{"code":4001}', 'rejected', 'Error', '() => 1'])
  })

  it('a polite announcement does not clear an assertive one still being read', () => {
    vi.useFakeTimers()
    announce('Transaction failed', true)
    vi.advanceTimersByTime(50)
    expect(liveRegions.assertive).toBe('Transaction failed')
    announce('Copied')
    expect(liveRegions.assertive).toBe('Transaction failed')
    vi.advanceTimersByTime(50)
    expect(liveRegions.polite).toBe('Copied')
    expect(liveRegions.assertive).toBe('Transaction failed')
  })

  it('clears announced text after a while so stale messages do not linger', () => {
    vi.useFakeTimers()
    announce('Transaction failed', true)
    vi.advanceTimersByTime(50)
    expect(liveRegions.assertive).toBe('Transaction failed')
    vi.advanceTimersByTime(7000)
    expect(liveRegions.assertive).toBe('')
  })

  it('exposes the same store through useToast()', () => {
    const toast = useToast()
    const id = toast.add({ severity: 'success', detail: 'done' })
    expect(toastMessages[0]).toMatchObject({ id, severity: 'success' })
    toast.removeAll()
    expect(toastMessages).toHaveLength(0)
  })
})
