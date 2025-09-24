export interface PublicIndexerProvider {
  id: string
  providerName: string
  providerURL: string
  indexerHost: string
  indexerPort: number
  host: string
  header: string
  token: string
  registrationRequired: boolean
  supportsARC0014: boolean
  limitPerSecond: number
}
