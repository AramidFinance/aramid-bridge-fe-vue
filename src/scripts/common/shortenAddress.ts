const shortenAddress = (address: string, length: number) => {
  const addrStr = address?.toString()
  // "..." costs 3 characters: only shorten when the result is actually shorter than the original
  if (!addrStr || !address || address.length <= length * 2 + 3) return address
  return addrStr.substring(0, length) + '...' + addrStr.substring(addrStr.length - length)
}
export default shortenAddress
