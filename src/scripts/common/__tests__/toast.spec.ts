import { afterEach, describe, expect, it } from 'vitest'
import { addToast, MAX_TOASTS, removeAllToasts, removeToast, setToastPaused, toastMessages, useToast } from '../toast'

afterEach(() => removeAllToasts())

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

  it('exposes the same store through useToast()', () => {
    const toast = useToast()
    const id = toast.add({ severity: 'success', detail: 'done' })
    expect(toastMessages[0]).toMatchObject({ id, severity: 'success' })
    toast.removeAll()
    expect(toastMessages).toHaveLength(0)
  })
})
