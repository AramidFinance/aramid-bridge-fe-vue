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

/** Read-only list of the toasts currently on screen (rendered by `AppToast`). */
export const toastMessages = readonly(state).messages

export const addToast = (options: ToastOptions): number => {
  const id = nextId++
  const life = options.life !== undefined && options.life > 0 ? options.life : undefined
  state.messages.push({ id, severity: options.severity ?? 'info', summary: options.summary, detail: options.detail, life })
  if (state.messages.length > MAX_TOASTS) state.messages.splice(0, state.messages.length - MAX_TOASTS)
  return id
}

export const removeToast = (id: number): void => {
  const index = state.messages.findIndex((message) => message.id === id)
  if (index !== -1) state.messages.splice(index, 1)
}

export const removeAllToasts = (): void => {
  state.messages.splice(0, state.messages.length)
}

export interface ToastApi {
  add: (options: ToastOptions) => number
  remove: (id: number) => void
  removeAll: () => void
}

const api: ToastApi = { add: addToast, remove: removeToast, removeAll: removeAllToasts }

/** Toast notifications. Safe to call outside components: the store is module-level. */
export const useToast = (): ToastApi => api
