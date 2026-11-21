/**
 * Converts literal \n characters in translated strings to actual newlines.
 * This is needed because JSON translation files use \\n (escaped), which
 * become literal \n strings in JavaScript. The tooltip styles
 * (`.aramid-tooltip__text` in main.css) use whitespace-pre-line CSS to properly render newlines.
 *
 * @param text - The translated text that may contain literal \n characters
 * @returns The text with actual newline characters
 */
export function formatTooltip(text: string): string {
  return text.replace(/\\n/g, '\n')
}

/**
 * Formats `text` like {@link formatTooltip} and appends `detail` (e.g. the full wallet address) as its own paragraph,
 * so keyboard users who can only focus the enclosing button still get it.
 */
export function tooltipWithDetail(text: string, detail?: string | false | null): string {
  const formatted = formatTooltip(text)
  return detail ? `${formatted}\n\n${detail}` : formatted
}
