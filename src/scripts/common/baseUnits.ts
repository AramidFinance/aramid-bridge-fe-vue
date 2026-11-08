import BigNumber from 'bignumber.js'

/** Displayed (decimal) amount -> base units, truncated. */
export const toBaseUnits = (value: BigNumber.Value, decimals: number): string => new BigNumber(value).shiftedBy(decimals).toFixed(0, 1)

/** Base units -> displayed (decimal) amount for a number input. */
export const fromBaseUnits = (amount: BigNumber.Value, decimals: number): number => new BigNumber(amount).shiftedBy(-decimals).toNumber()

/** Base units of a token with fromDecimals -> the same amount in base units of a token with toDecimals, truncated. */
export const rescaleBaseUnits = (amount: BigNumber.Value, fromDecimals: number, toDecimals: number): string => new BigNumber(amount).shiftedBy(toDecimals - fromDecimals).toFixed(0, 1)
