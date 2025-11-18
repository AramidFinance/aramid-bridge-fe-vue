import axios from 'axios'
import type { AppConfiguration } from '../interface/configuration/AppConfiguration'
import { useConfigStore } from '@/stores/config'
import asyncdelay from './asyncDelay'
import logger from '@/scripts/common/conditionalLogger'
let loading: boolean | null = null

const getAppConfiguration = async () => {
  if (loading === true) {
    for (let i = 0; i <= 1000; i++) {
      if (loading) {
        await asyncdelay(10)
      }
    }
  }
  if (loading === null) loading = true
  const configStore = useConfigStore()
  if (loading === false) return configStore.state
  const response = await axios.get('/config.json')
  if (response.status !== 200) {
    logger.error(`Request to /config.json did not returned status 200 (${response.status})`)
    return null
  }
  const config = response.data as AppConfiguration
  configStore.state = config
  loading = false
  return config
}
export default getAppConfiguration
