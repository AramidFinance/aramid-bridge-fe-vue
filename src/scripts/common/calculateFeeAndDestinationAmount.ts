import BigNumber from 'bignumber.js'
import formatBaseAmount from './formatBaseAmount'
import { useAppStore } from '@/stores/app'

const calculateFeeAndDestinationAmount = () => {
  console.log('calculateFeeAndDestinationAmount')
  const store = useAppStore()
  if (!store.state.sourceTokenConfiguration) {
    console.log('store.state.sourceTokenConfiguration missing')
    return
  }
  if (!store.state.destinationTokenConfiguration) {
    console.log('store.state.destinationTokenConfiguration missing')
    return
  }
  if (!store.state.routeConfig) {
    console.log('store.state.routeConfig missing')
    return
  }

  const feeTokenConfiguration = store.state.sourceTokenConfiguration

  const sourceAmount = new BigNumber(store.state.sourceAmount)
  // const fee = sourceAmount.minus(new BigNumber(sourceAmount.dividedToIntegerBy(1.001)).toFixed(0, 1));
  console.log('dest chain tokens:', store.state.routeConfig, store.state.feeToken, store.state.destinationToken)
  const feeAlternatives = store.state.routeConfig.feeAlternatives
  let feeMultiplier: number | null = null
  for (let i = 0; i < feeAlternatives.length; i++) {
    // loop through fee alternatives to find minimum applicable fee
    const feeAlt = feeAlternatives[i]
    const currFeeMultiplier = feeAlt.sourcePercent
    if (sourceAmount.gte(new BigNumber(feeAlt.minimumAmount)) && feeTokenConfiguration && feeTokenConfiguration.isPremium === feeAlt.ifPremiumTokenUsed) {
      if (!feeMultiplier || currFeeMultiplier < feeMultiplier) {
        feeMultiplier = currFeeMultiplier
      }
    }
  }
  if (!feeMultiplier) feeMultiplier = 0.001 // default value if it's undefined

  console.log('fee multiplier:', feeMultiplier, '\nfee token:', feeTokenConfiguration, '\ntoken configs:', store.state.routeConfig, '\ndestination token:', store.state.destinationToken)
  const fee = new BigNumber(sourceAmount.multipliedBy(feeMultiplier))
  const feeAmount = fee.toFixed(0, 0)
  let updated = false
  store.state.feePercentage = feeMultiplier * 100
  if (store.state.feeAmount != feeAmount) {
    store.state.feeAmount = feeAmount
    updated = true
  }
  const feeAmountFormatted = formatBaseAmount(feeAmount, store.state.sourceTokenConfiguration.decimals) // fee token is source token
  if (store.state.feeAmountFormatted != feeAmountFormatted) {
    store.state.feeAmountFormatted = feeAmountFormatted
    updated = true
  }

  const decDiff = store.state.destinationTokenConfiguration.decimals - store.state.sourceTokenConfiguration.decimals
  // algo 2 eth 18 - 6 = 12
  // eth 2 algo 6 - 18 = -12
  const destInSourceDecimals = sourceAmount.minus(fee)
  // console.log(sourceAmount, destInSourceDecimals, fee);
  if (decDiff > 0) {
    // source token has more decimals than destination token
    console.log('source token has more decimals than destination token')
    const destinationAmount = destInSourceDecimals.multipliedBy(10 ** decDiff).toFixed(0, 1)
    if (store.state.destinationAmount != destinationAmount) {
      store.state.destinationAmount = destinationAmount
      updated = true
    }
  } else if (decDiff == 0) {
    // source token and destination token have same decimals
    console.log('same decimals', destInSourceDecimals.toFixed(0, 1))
    const destinationAmount = destInSourceDecimals.toFixed(0, 1)
    if (store.state.destinationAmount != destinationAmount) {
      store.state.destinationAmount = destinationAmount
      updated = true
    }
  } else if (decDiff < 0) {
    // destination token has more decimals than source token
    console.log('destination token has more decimals than source token')
    const destinationAmount = destInSourceDecimals.dividedToIntegerBy(10 ** (-1 * decDiff)).toFixed(0, 1)
    if (store.state.destinationAmount != destinationAmount) {
      store.state.destinationAmount = destinationAmount
      updated = true
    }
  }
  const destinationAmountFormatted = formatBaseAmount(store.state.destinationAmount, store.state.destinationTokenConfiguration.decimals)
  if (store.state.destinationAmountFormatted != destinationAmountFormatted) {
    store.state.destinationAmountFormatted = destinationAmountFormatted
    updated = true
  }
  if (updated) {
    console.log('calculate destination amount update:', {
      sourceAmount: store.state.sourceAmount,
      feeAmount: store.state.feeAmount,
      destinationAmount: store.state.destinationAmount
    })
  }
}

export default calculateFeeAndDestinationAmount
