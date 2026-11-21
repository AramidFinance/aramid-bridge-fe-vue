import { describe, expect, it } from 'vitest'
import shortenAddress from '../shortenAddress'

describe('shortenAddress', () => {
  it('keeps the start and end around an ellipsis', () => {
    expect(shortenAddress('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4)).toBe('ABCD...WXYZ')
  })

  it('never "shortens" into something as long or longer (no characters silently dropped)', () => {
    // 2*4 + 3 = 11: an 11-character value would come out as 11 characters with 3 hidden
    expect(shortenAddress('ABCDEFGHIJK', 4)).toBe('ABCDEFGHIJK')
    expect(shortenAddress('ABCDEFGHIJ', 4)).toBe('ABCDEFGHIJ')
    expect(shortenAddress('ABCDEFGHIJKL', 4)).toBe('ABCD...IJKL')
  })
})
