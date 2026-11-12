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

/** Base units of a token with fromDecimals -> the same amount in base units of a token with toDecimals (exact, truncated); '' if invalid. */
export const rescaleBaseUnits = (amount: BigNumber.Value | null | undefined, fromDecimals: number, toDecimals: number): string =>
  parse(amount)
    ?.shiftedBy(toDecimals - fromDecimals)
    .toFixed(0, 1) ?? ''

/** Whether a base-unit amount is a positive integer (something to send). */
export const isPositiveBaseUnits = (amount: string | null | undefined): boolean => !!amount && /^\d+$/.test(amount) && BigInt(amount) > 0n
