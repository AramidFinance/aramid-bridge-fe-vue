import { describe, expect, it } from 'vitest'
import { formatTooltip, tooltipWithDetail } from '../formatTooltip'

// translations contain a literal backslash followed by "n" (written '\\n' here), not a newline
const ESCAPED_NEWLINE = '\\n'

describe('formatTooltip', () => {
  it('turns escaped \\n sequences into newlines', () => {
    expect(formatTooltip(`a${ESCAPED_NEWLINE}b`)).toBe('a\nb')
  })

  it('appends a detail paragraph only when there is one', () => {
    expect(tooltipWithDetail(`Connect${ESCAPED_NEWLINE}your wallet`, 'ADDR')).toBe('Connect\nyour wallet\n\nADDR')
    expect(tooltipWithDetail('Connect', false)).toBe('Connect')
    expect(tooltipWithDetail('Connect', '')).toBe('Connect')
  })
})
