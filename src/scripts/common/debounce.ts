/**
 * Debounces a function call to prevent excessive executions
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel method
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel: () => void
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedFn = function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }

  // Add cancel method to clear pending debounced calls
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debouncedFn as DebouncedFunction<T>
}

export default debounce
