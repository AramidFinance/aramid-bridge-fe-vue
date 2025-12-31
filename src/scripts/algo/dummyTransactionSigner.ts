import type algosdk from 'algosdk'

const dummyTransactionSigner = async (txnGroup: algosdk.Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
  return [] as Uint8Array[]
}
export default dummyTransactionSigner
