/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text The text to escape
 * @returns HTML-safe text
 */
const escapeHtml = (text: string): string => {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char])
}

/**
 * Highlights "Aramid" text in token names to improve readability when logos are similar
 * @param text The token name to process
 * @returns Object with highlighted flag and processed text/HTML
 */
export const highlightAramidText = (text: string) => {
  const hasAramid = text.toLowerCase().includes('aramid')

  if (!hasAramid) {
    return {
      hasAramid: false,
      text: text,
      html: escapeHtml(text)
    }
  }

  // First escape HTML to prevent XSS, then apply highlighting
  const escapedText = escapeHtml(text)
  const highlightedHtml = escapedText.replace(/aramid/gi, '<span class="aramid-highlight">$&</span>')

  return {
    hasAramid: true,
    text: text,
    html: highlightedHtml
  }
}
