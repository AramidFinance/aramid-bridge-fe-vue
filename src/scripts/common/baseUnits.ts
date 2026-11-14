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

/** Displayed (decimal) amount -> base units, truncated; '' for an empty, invalid or negative input. */
export const toBaseUnits = (value: BigNumber.Value | null | undefined, decimals: number): string => {
  const amount = parse(value)
  return amount && !amount.isNegative() ? amount.shiftedBy(decimals).toFixed(0, 1) : ''
}

/** Base units -> displayed (decimal) amount for a number input; NaN for an empty or invalid amount. */
export const fromBaseUnits = (amount: BigNumber.Value | null | undefined, decimals: number): number => parse(amount)?.shiftedBy(-decimals).toNumber() ?? Number.NaN

/** Base units of a token with fromDecimals -> the same amount in base units of a token with toDecimals (exact, truncated); '' if invalid. */
export const rescaleBaseUnits = (amount: BigNumber.Value | null | undefined, fromDecimals: number, toDecimals: number): string =>
  parse(amount)
    ?.shiftedBy(toDecimals - fromDecimals)
    .toFixed(0, 1) ?? ''

/** Fee reserve kept on the account when sending the chain's native token (Max). */
const NATIVE_FEE_RESERVE = 101000

/** The most that can be sent from a base-unit balance: for the native token the fee reserve is kept. */
export const maxSendable = (balance: string, isNative: boolean): string => (isNative ? BigNumber.max(0, new BigNumber(balance).minus(NATIVE_FEE_RESERVE)).toFixed(0, 1) : balance)

/** Whether the value is a base-unit amount: a non-negative integer string. */
export const isBaseUnits = (amount: unknown): amount is string => typeof amount === 'string' && /^\d+$/.test(amount)

/** Whether a base-unit amount is a positive integer (something to send). */
export const isPositiveBaseUnits = (amount: string | null | undefined): boolean => isBaseUnits(amount) && BigInt(amount) > 0n
