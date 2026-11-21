import { CHAIN_ID_ALGORAND, CHAIN_ID_VOI } from './chainIds'

export interface TxExplorer {
  name: string
  url: string
}

const BIATEC: Record<string, { name: string; base: string }> = {
  [CHAIN_ID_ALGORAND]: { name: 'Biatec Scan', base: 'https://algorand.scan.biatec.io' },
  [CHAIN_ID_VOI]: { name: 'Biatec Scan', base: 'https://voi.scan.biatec.io' }
}

const hostOf = (base: string): string => {
  try {
    return new URL(base).hostname.toLowerCase()
  } catch {
    return base
  }
}

const explorerName = (base: string): string => hostOf(base).replace(/^(www|app|explorer)\./, '')

/** Configured bases are used verbatim (they must end where the tx id starts, e.g. '/tx/'). Explorer links for a tx; Biatec Scan comes first (default) on Algorand and Voi mainnet, configured explorers follow. */
export const getTxExplorers = (chainId: number | string | undefined, configured: string[] | undefined, txId: string): TxExplorer[] => {
  const result: TxExplorer[] = []
  const biatec = chainId === undefined ? undefined : BIATEC[chainId.toString()]
  const id = encodeURIComponent(txId)
  if (biatec) result.push({ name: biatec.name, url: `${biatec.base}/transaction/${id}` })
  for (const raw of configured ?? []) {
    if (!raw) continue
    if (biatec && hostOf(raw) === hostOf(biatec.base)) continue
    const url = `${raw}${id}`
    if (!result.some((e) => e.url === url)) result.push({ name: explorerName(raw), url })
  }
  return result
}
