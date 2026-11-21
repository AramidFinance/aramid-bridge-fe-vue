export interface TxExplorer {
  name: string
  url: string
}

const BIATEC: Record<string, { name: string; base: string }> = {
  '416001': { name: 'Biatec Scan', base: 'https://algorand.scan.biatec.io' },
  '416101': { name: 'Biatec Scan', base: 'https://voi.scan.biatec.io' }
}

const explorerName = (base: string): string => {
  try {
    return new URL(base).hostname.replace(/^(www|app|explorer)\./, '')
  } catch {
    return base
  }
}

/** Explorer links for a tx; Biatec Scan comes first (default) on Algorand and Voi, configured explorers follow. */
export const getTxExplorers = (chainId: number | string | undefined, configured: string[] | undefined, txId: string): TxExplorer[] => {
  const result: TxExplorer[] = []
  const biatec = chainId === undefined ? undefined : BIATEC[chainId.toString()]
  const id = encodeURIComponent(txId)
  if (biatec) result.push({ name: biatec.name, url: `${biatec.base}/transaction/${id}` })
  for (const base of configured ?? []) {
    if (!base) continue
    if (biatec && base.startsWith(biatec.base)) continue
    result.push({ name: explorerName(base), url: `${base}${id}` })
  }
  return result
}

export const getAddressUrl = (chainId: number | string | undefined, address: string): string | undefined => {
  const biatec = chainId === undefined ? undefined : BIATEC[chainId.toString()]
  return biatec ? `${biatec.base}/address/${encodeURIComponent(address)}` : undefined
}
