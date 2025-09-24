export interface PublicAlgodProvider {
  id: string
  providerName: string
  providerURL: string
  algodHost: string
  algodPort: number
  host: string
  header: string
  token: string
  registrationRequired: boolean
  supportsARC0014: boolean
  limitPerSecond: number
}
