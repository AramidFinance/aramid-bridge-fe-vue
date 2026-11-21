import { reactive, readonly } from 'vue'
import i18n from '@/i18n'

export type Severity = 'success' | 'info' | 'warn' | 'error'

export interface ToastOptions {
  severity?: Severity
  /** Optional bold heading shown above the detail. */
  summary?: string
  /** Message body. */
  detail?: string
  /** Auto-dismiss after this many milliseconds; omit (or pass 0) to keep the toast until closed. */
  life?: number
}

export interface ToastMessage {
  id: number
  severity: Severity
  summary?: string
  detail?: string
  life?: number
}

/** Trim priority: info/success go first, then warnings, then errors. */
const rank = (severity: Severity): number => (severity === 'error' ? 2 : severity === 'warn' ? 1 : 0)

/** Only errors interrupt the screen reader (assertive); warnings and the rest wait politely, toasts and messages alike. */
export const isAssertive = (severity: Severity): boolean => severity === 'error'

/** Call sites pass `e.message ?? e`; make sure a thrown non-Error never renders as "[object Object]". */
export const toText = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string') return value
  const message = typeof value === 'object' ? (value as { message?: unknown }).message : undefined
  if (typeof message === 'string' && message) return message
  // an Error with an empty message reads as "Error" rather than vanishing
  if (value instanceof Error) return String(value)
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

/** Oldest toasts are dropped once this many are on screen, so a burst of errors cannot fill the viewport. */
export const MAX_TOASTS = 5

const state = reactive<{ messages: ToastMessage[] }>({ messages: [] })
let nextId = 1
/** Toasts the user is hovering or has focus in: never trimmed out from under them. */
const paused = new Set<number>()

/** Read-only list of the toasts currently on screen (rendered by `AppToast`). */
export const toastMessages = readonly(state).messages

/**
 * Screen-reader announcements. Screen readers only announce changes to live regions that already exist, so
 * AppToast renders these two persistent visually-hidden regions and anything that appears dynamically (new toasts,
 * inline messages) is mirrored into them instead of relying on freshly inserted role=status elements.
 */
export const liveRegions = reactive({ polite: '', assertive: '' })
const pendingAnnouncements = { polite: [] as string[], assertive: [] as string[] }
let announceTimer: ReturnType<typeof setTimeout> | undefined
/** Announced text is removed again after a while, so stale messages do not linger for virtual-cursor browsing. */
const CLEAR_AFTER_MS = 7000
const clearTimers: Partial<Record<'polite' | 'assertive', ReturnType<typeof setTimeout>>> = {}

/** Queues `text` for the polite (or, when `urgent`, assertive) live region; bursts are batched into one announcement. */
export const announce = (text: string, urgent = false): void => {
  if (!text) return
  const region = urgent ? 'assertive' : 'polite'
  // clear this region first so repeating the same message is announced again; the other region is left alone,
  // so an error still being read is not cut off by an unrelated polite message
  if (!pendingAnnouncements[region].length) liveRegions[region] = ''
  clearTimeout(clearTimers[region])
  pendingAnnouncements[region].push(text)
  if (announceTimer !== undefined) return // already scheduled: it will include this
  announceTimer = setTimeout(() => {
    announceTimer = undefined
    for (const name of ['polite', 'assertive'] as const) {
      if (!pendingAnnouncements[name].length) continue
      liveRegions[name] = pendingAnnouncements[name].join('. ')
      pendingAnnouncements[name] = []
      clearTimers[name] = setTimeout(() => (liveRegions[name] = ''), CLEAR_AFTER_MS)
    }
  }, 50)
}

/** Drops pending announcements and empties the regions (tests, teardown). */
export const resetAnnouncements = (): void => {
  clearTimeout(announceTimer)
  clearTimeout(clearTimers.polite)
  clearTimeout(clearTimers.assertive)
  announceTimer = undefined
  pendingAnnouncements.polite = []
  pendingAnnouncements.assertive = []
  liveRegions.polite = ''
  liveRegions.assertive = ''
}

export const addToast = (options: ToastOptions): number => {
  const id = nextId++
  const life = options.life !== undefined && options.life > 0 ? options.life : undefined
  const message: ToastMessage = { id, severity: options.severity ?? 'info', summary: toText(options.summary), detail: toText(options.detail), life }
  // callers pass `e.message ?? e`, which is '' for an Error without a message: never show (or announce) a blank error
  if (message.severity === 'error' && !message.summary && !message.detail) message.detail = i18n.global.t('error.unknown')
  state.messages.push(message)
  // Over the limit: drop the oldest info/success toasts first, then warnings, then errors - but never one that ranks
  // above the incoming toast (it gives way itself; it was announced above), never the new toast's peers that are
  // being read, and never the new toast otherwise. If nothing can go, the list may briefly exceed the limit.
  for (let rankToDrop = 0; rankToDrop <= 2 && state.messages.length > MAX_TOASTS; rankToDrop++) {
    const droppable = (existing: ToastMessage) => rank(existing.severity) === rankToDrop && !paused.has(existing.id)
    // only info/success give way to higher-ranked toasts; a warning or error is always shown (it may say funds
    // are already in flight), evicting older toasts of any rank instead
    if (rank(message.severity) === 0 && rankToDrop > 0) {
      // only higher-ranked toasts are left: give way, unless they are all being read (then briefly exceed the limit)
      if (state.messages.slice(0, -1).some((existing) => !paused.has(existing.id))) state.messages.pop()
      break
    }
    for (let i = 0; state.messages.length > MAX_TOASTS && i < state.messages.length - 1;) {
      if (droppable(state.messages[i])) state.messages.splice(i, 1)
      else i++
    }
  }
  // announced only if it is actually shown (a toast that gave way is neither drawn nor read)
  if (state.messages.includes(message)) announce([message.summary, message.detail].filter(Boolean).join(': '), isAssertive(message.severity))
  return id
}

/** Marks a toast as being read (hovered/focused) so the MAX_TOASTS trim skips it. */
export const setToastPaused = (id: number, value: boolean): void => {
  if (value) paused.add(id)
  else paused.delete(id)
}

export const removeToast = (id: number): void => {
  const index = state.messages.findIndex((message) => message.id === id)
  if (index !== -1) state.messages.splice(index, 1)
  paused.delete(id)
}

export const removeAllToasts = (): void => {
  state.messages.splice(0, state.messages.length)
  paused.clear()
}

export interface ToastApi {
  add: (options: ToastOptions) => number
  remove: (id: number) => void
  removeAll: () => void
}

const api: ToastApi = { add: addToast, remove: removeToast, removeAll: removeAllToasts }

/** Toast notifications. Safe to call outside components: the store is module-level. */
export const useToast = (): ToastApi => api
