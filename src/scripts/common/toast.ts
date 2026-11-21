import { reactive, readonly } from 'vue'

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

/** Errors and warnings are the last toasts to be trimmed. */
export const isUrgent = (severity: Severity): boolean => severity === 'error' || severity === 'warn'

/** Only errors interrupt the screen reader (assertive); warnings and the rest wait politely, toasts and messages alike. */
export const isAssertive = (severity: Severity): boolean => severity === 'error'

/** Call sites pass `e.message ?? e`; make sure a thrown non-Error never renders as "[object Object]". */
export const toText = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'object' && typeof (value as { message?: unknown }).message === 'string') return (value as { message: string }).message
  try {
    return JSON.stringify(value)
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

export const addToast = (options: ToastOptions): number => {
  const id = nextId++
  const life = options.life !== undefined && options.life > 0 ? options.life : undefined
  state.messages.push({ id, severity: options.severity ?? 'info', summary: toText(options.summary), detail: toText(options.detail), life })
  // Over the limit: drop the oldest info/success toasts first, then warnings/errors. Never the new toast or one
  // being read; if nothing else can go, the list may briefly exceed the limit.
  for (const urgentPass of [false, true]) {
    for (let i = 0; state.messages.length > MAX_TOASTS && i < state.messages.length - 1;) {
      const message = state.messages[i]
      if (paused.has(message.id) || isUrgent(message.severity) !== urgentPass) i++
      else state.messages.splice(i, 1)
    }
  }
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

/**
 * Screen-reader announcements. Screen readers only announce changes to live regions that already exist, so
 * AppToast renders these two persistent visually-hidden regions and anything that appears dynamically (new toasts,
 * inline messages) is mirrored into them instead of relying on freshly inserted role=status elements.
 */
export const liveRegions = reactive({ polite: '', assertive: '' })
const pendingAnnouncements = { polite: [] as string[], assertive: [] as string[] }
let announceTimer: ReturnType<typeof setTimeout> | undefined

/** Queues `text` for the polite (or, when `urgent`, assertive) live region; bursts are batched into one announcement. */
export const announce = (text: string, urgent = false): void => {
  if (!text) return
  const region = urgent ? 'assertive' : 'polite'
  // clear this region first so repeating the same message is announced again; the other region is left alone,
  // so an error still being read is not cut off by an unrelated polite message
  if (!pendingAnnouncements[region].length) liveRegions[region] = ''
  pendingAnnouncements[region].push(text)
  if (announceTimer !== undefined) return // already scheduled: it will include this
  announceTimer = setTimeout(() => {
    announceTimer = undefined
    for (const name of ['polite', 'assertive'] as const) {
      if (!pendingAnnouncements[name].length) continue
      liveRegions[name] = pendingAnnouncements[name].join('. ')
      pendingAnnouncements[name] = []
    }
  }, 50)
}

/** Drops pending announcements and empties the regions (tests, teardown). */
export const resetAnnouncements = (): void => {
  clearTimeout(announceTimer)
  announceTimer = undefined
  pendingAnnouncements.polite = []
  pendingAnnouncements.assertive = []
  liveRegions.polite = ''
  liveRegions.assertive = ''
}

export interface ToastApi {
  add: (options: ToastOptions) => number
  remove: (id: number) => void
  removeAll: () => void
}

const api: ToastApi = { add: addToast, remove: removeToast, removeAll: removeAllToasts }

/** Toast notifications. Safe to call outside components: the store is module-level. */
export const useToast = (): ToastApi => api
