export const isWalletForChain = (id: string, chainId: number): boolean => {
  const db: any = {
    '101003': {
      walletconnect: true,
      biatec: true
    },
    '416001': {
      wc: true,
      pera: true,
      defly: true,
      exodus: true,
      biatec: true,
      lute: true,
      walletconnect: true
    },
    '416101': {
      walletconnect: true,
      biatec: true,
      kibisis: true,
      lute: true
    },
    '416102': {
      walletconnect: true,
      biatec: true,
      kibisis: true
    }
  }
  if (!db[chainId.toString()]) return false
  return db[chainId.toString()][id]
}
