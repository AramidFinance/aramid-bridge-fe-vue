export interface TxExplorer {
  name: string
  url: string
}

const BIATEC: Record<string, { name: string; base: string }> = {
  '416001': { name: 'Biatec Scan', base: 'https://algorand.scan.biatec.io' },
  '416101': { name: 'Biatec Scan', base: 'https://voi.scan.biatec.io' }
}

const hostOf = (base: string): string => {
  try {
    return new URL(base).hostname.toLowerCase()
  } catch {
    return base
  }
}

const explorerName = (base: string): string => hostOf(base).replace(/^(www|app|explorer)\./, '')

/** Explorer links for a tx; Biatec Scan comes first (default) on Algorand and Voi mainnet, configured explorers follow. */
export const getTxExplorers = (chainId: number | string | undefined, configured: string[] | undefined, txId: string): TxExplorer[] => {
  const result: TxExplorer[] = []
  const biatec = chainId === undefined ? undefined : BIATEC[chainId.toString()]
  const id = encodeURIComponent(txId)
  if (biatec) result.push({ name: biatec.name, url: `${biatec.base}/transaction/${id}` })
  for (const raw of configured ?? []) {
    if (!raw) continue
    if (biatec && hostOf(raw) === hostOf(biatec.base)) continue
    const base = raw.endsWith('/') ? raw : `${raw}/`
    result.push({ name: explorerName(raw), url: `${base}${id}` })
  }
  return result
}
