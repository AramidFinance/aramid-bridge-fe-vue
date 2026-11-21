import { describe, expect, it } from 'vitest'
import { formatTooltip, tooltipWithDetail } from '../formatTooltip'

describe('formatTooltip', () => {
  it('turns escaped \n sequences into newlines', () => {
    expect(formatTooltip('a\nb')).toBe('a\nb')
  })

  it('appends a detail paragraph only when there is one', () => {
    expect(tooltipWithDetail('Connect\nyour wallet', 'ADDR')).toBe('Connect\nyour wallet\n\nADDR')
    expect(tooltipWithDetail('Connect', false)).toBe('Connect')
    expect(tooltipWithDetail('Connect', '')).toBe('Connect')
  })
})
