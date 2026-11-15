/** Logs an error and shows it as an error toast. */
export const showError = (toast: { add: (message: { severity: 'error'; detail: string; life: number }) => void }, e: any, life = 3000): void => {
  console.error(e)
  toast.add({
    severity: 'error',
    detail: e?.message ?? String(e),
    life
  })
}
