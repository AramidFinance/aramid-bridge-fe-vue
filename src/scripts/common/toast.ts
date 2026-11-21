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
  state.messages.push({ id, severity: options.severity ?? 'info', summary: options.summary, detail: options.detail, life })
  // drop the oldest toasts that are not being read (never the new one); if all are, the list may briefly exceed the limit
  for (let i = 0; state.messages.length > MAX_TOASTS && i < state.messages.length - 1;) {
    if (paused.has(state.messages[i].id)) i++
    else state.messages.splice(i, 1)
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

export interface ToastApi {
  add: (options: ToastOptions) => number
  remove: (id: number) => void
  removeAll: () => void
}

const api: ToastApi = { add: addToast, remove: removeToast, removeAll: removeAllToasts }

/** Toast notifications. Safe to call outside components: the store is module-level. */
export const useToast = (): ToastApi => api
