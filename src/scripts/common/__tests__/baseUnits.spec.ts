import { fromBaseUnits, rescaleBaseUnits, toBaseUnits } from '@/scripts/common/baseUnits'
import { describe, expect, it } from 'vitest'

describe('base units', () => {
  it('converts displayed amounts to truncated base units', () => {
    expect(toBaseUnits(5, 6)).toBe('5000000')
    expect(toBaseUnits(0.1234567, 6)).toBe('123456')
    expect(toBaseUnits('1.5', 0)).toBe('1')
  })

  it('converts base units to displayed amounts without float division drift', () => {
    expect(fromBaseUnits('5000000', 6)).toBe(5)
    expect(fromBaseUnits('123', 2)).toBe(1.23)
  })

  it('rescales base units exactly between decimals', () => {
    expect(rescaleBaseUnits('5000000', 6, 8)).toBe('500000000')
    expect(rescaleBaseUnits('500000000', 8, 6)).toBe('5000000')
    expect(rescaleBaseUnits('1234567890123456789', 18, 18)).toBe('1234567890123456789')
    expect(rescaleBaseUnits('123456789', 8, 6)).toBe('1234567')
  })
})
