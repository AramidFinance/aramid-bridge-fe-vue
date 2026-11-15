import { isDefinitelyRejected } from '@/scripts/algo/sendOutcome'
import { describe, expect, it } from 'vitest'

describe('isDefinitelyRejected', () => {
  it('treats only algod 400 responses as a definite rejection', () => {
    expect(isDefinitelyRejected({ response: { status: 400 } })).toBe(true)
    expect(isDefinitelyRejected({ status: 400 })).toBe(true)
  })

  it('treats anything that may have reached algod as possibly accepted', () => {
    expect(isDefinitelyRejected({ response: { status: 408 } })).toBe(false)
    expect(isDefinitelyRejected({ response: { status: 502 } })).toBe(false)
    expect(isDefinitelyRejected(new TypeError('Failed to fetch'))).toBe(false)
    expect(isDefinitelyRejected(undefined)).toBe(false)
  })
})
