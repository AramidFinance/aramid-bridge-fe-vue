import { describe, expect, it } from 'vitest'
import { getTxExplorers } from '../txExplorers'

describe('getTxExplorers', () => {
  it('puts Biatec Scan first for Algorand and Voi', () => {
    expect(getTxExplorers(416001, ['https://allo.info/tx/'], 'A')).toEqual([
      { name: 'Biatec Scan', url: 'https://algorand.scan.biatec.io/transaction/A' },
      { name: 'allo.info', url: 'https://allo.info/tx/A' }
    ])
    expect(getTxExplorers('416101', undefined, 'A')).toEqual([{ name: 'Biatec Scan', url: 'https://voi.scan.biatec.io/transaction/A' }])
  })
  it('dedupes a configured Biatec explorer and normalises the trailing slash', () => {
    const r = getTxExplorers(416101, ['https://VOI.scan.biatec.io/transaction/', 'https://x.io/tx'], 'A')
    expect(r.map((e) => e.url)).toEqual(['https://voi.scan.biatec.io/transaction/A', 'https://x.io/tx/A'])
  })
  it('keeps configured explorers for other chains and encodes the id', () => {
    expect(getTxExplorers(1, ['https://e/tx/'], 'a/b')).toEqual([{ name: 'e', url: 'https://e/tx/a%2Fb' }])
    expect(getTxExplorers(undefined, [''], 'A')).toEqual([])
  })
})
