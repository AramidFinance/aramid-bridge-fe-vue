import { fromBaseUnits, toBaseUnits } from '@/scripts/common/baseUnits'
import { describe, expect, it } from 'vitest'

describe('base units', () => {
  it('converts displayed amounts to truncated base units', () => {
    expect(toBaseUnits(5, 6)).toBe('5000000')
    expect(toBaseUnits(0.1234567, 6)).toBe('123456')
    expect(toBaseUnits('1.5', 0)).toBe('1')
  })

  it('gives an empty amount for an empty or invalid input (never NaN)', () => {
    expect(toBaseUnits('', 6)).toBe('')
    expect(toBaseUnits(null, 6)).toBe('')
    expect(toBaseUnits(Number.NaN, 6)).toBe('')
    expect(toBaseUnits('1e', 6)).toBe('')
  })

  it('converts base units to displayed amounts without float division drift', () => {
    expect(fromBaseUnits('5000000', 6)).toBe(5)
    expect(fromBaseUnits('123', 2)).toBe(1.23)
    expect(fromBaseUnits('', 2)).toBeNaN()
    expect(fromBaseUnits('x', 2)).toBeNaN()
  })
})
