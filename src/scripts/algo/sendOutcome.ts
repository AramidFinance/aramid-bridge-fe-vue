/**
 * Whether sending a signed transaction definitely failed, i.e. it was not accepted. algod answers a
 * rejected transaction with 400; any other failure (a proxy's 408 or 5xx, a timeout, a dropped
 * connection) may come after the transaction was forwarded, so it may still have been accepted.
 */
export const isDefinitelyRejected = (e: any): boolean => (e?.response?.status ?? e?.status) === 400
