import { fromBaseUnits, isPositiveBaseUnits, maxSendable, rescaleBaseUnits, toBaseUnits } from '@/scripts/common/baseUnits'
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
    expect(toBaseUnits(-1, 6)).toBe('')
  })

  it('converts base units to displayed amounts without float division drift', () => {
    expect(fromBaseUnits('5000000', 6)).toBe(5)
    expect(fromBaseUnits('123', 2)).toBe(1.23)
    expect(fromBaseUnits('', 2)).toBeNaN()
    expect(fromBaseUnits('x', 2)).toBeNaN()
  })

  it('rescales base units exactly between decimals', () => {
    expect(rescaleBaseUnits('5000000', 6, 8)).toBe('500000000')
    expect(rescaleBaseUnits('123456789', 8, 6)).toBe('1234567')
    expect(rescaleBaseUnits('1234567890123456789', 18, 18)).toBe('1234567890123456789')
    expect(rescaleBaseUnits('', 6, 8)).toBe('')
  })

  it('recognises positive base-unit amounts', () => {
    expect(isPositiveBaseUnits('1')).toBe(true)
    expect(isPositiveBaseUnits('0')).toBe(false)
    expect(isPositiveBaseUnits('')).toBe(false)
    expect(isPositiveBaseUnits('NaN')).toBe(false)
    expect(isPositiveBaseUnits('-5')).toBe(false)
    expect(isPositiveBaseUnits(undefined)).toBe(false)
  })

  it('keeps the fee reserve when sending the whole native balance', () => {
    expect(maxSendable('5000000', true)).toBe('4899000')
    expect(maxSendable('50000', true)).toBe('0')
    expect(maxSendable('5000000', false)).toBe('5000000')
  })
})
