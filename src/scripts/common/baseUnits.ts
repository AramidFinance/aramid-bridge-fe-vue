import BigNumber from 'bignumber.js'

/** A finite BigNumber for the value, or undefined (bignumber.js 11 throws on invalid strings). */
const parse = (value: BigNumber.Value | null | undefined): BigNumber | undefined => {
  if (value === '' || value === null || value === undefined) return undefined
  try {
    const amount = new BigNumber(value)
    return amount.isFinite() ? amount : undefined
  } catch {
    return undefined
  }
}

/** Displayed (decimal) amount -> base units, truncated; '' for an empty or invalid input. */
export const toBaseUnits = (value: BigNumber.Value | null | undefined, decimals: number): string => parse(value)?.shiftedBy(decimals).toFixed(0, 1) ?? ''

/** Base units -> displayed (decimal) amount for a number input; NaN for an empty or invalid amount. */
export const fromBaseUnits = (amount: BigNumber.Value | null | undefined, decimals: number): number => parse(amount)?.shiftedBy(-decimals).toNumber() ?? Number.NaN
