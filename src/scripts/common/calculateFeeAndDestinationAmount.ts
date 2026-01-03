import { useAppStore } from '@/stores/app'
import BigNumber from 'bignumber.js'
import formatBaseAmount from './formatBaseAmount'

const calculateFeeAndDestinationAmount = () => {
  //console.log('calculateFeeAndDestinationAmount')
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
  //console.log('dest chain tokens:', store.state.routeConfig, store.state.feeToken, store.state.destinationToken)
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

  //console.log('fee multiplier:', feeMultiplier, '\nfee token:', feeTokenConfiguration, '\ntoken configs:', store.state.routeConfig, '\ndestination token:', store.state.destinationToken)
  const fee = new BigNumber(sourceAmount.multipliedBy(feeMultiplier))
  const feeAmount = fee.toFixed(0, 0)
  store.state.feePercentage = feeMultiplier * 100
  let updated = false
  if (store.state.feeAmount != feeAmount) {
    store.state.feeAmount = feeAmount
    const feeAmountFormatted = formatBaseAmount(feeAmount, store.state.sourceTokenConfiguration.decimals) // fee token is source token
    if (store.state.feeAmountFormatted != feeAmountFormatted) {
      store.state.feeAmountFormatted = feeAmountFormatted
    }

    const decDiff = store.state.destinationTokenConfiguration.decimals - store.state.sourceTokenConfiguration.decimals
    // algo 2 eth 18 - 6 = 12
    // eth 2 algo 6 - 18 = -12
    const destInSourceDecimals = sourceAmount.minus(fee)
    // console.log(sourceAmount, destInSourceDecimals, fee);
    if (decDiff > 0) {
      // source token has more decimals than destination token
      //console.log('source token has more decimals than destination token')
      const destinationAmount = destInSourceDecimals.multipliedBy(10 ** decDiff).toFixed(0, 1)
      if (store.state.destinationAmount != destinationAmount) {
        store.state.destinationAmount = destinationAmount
        updated = true
      }
    } else if (decDiff == 0) {
      // source token and destination token have same decimals
      //console.log('same decimals', destInSourceDecimals.toFixed(0, 1))
      const destinationAmount = destInSourceDecimals.toFixed(0, 1)
      if (store.state.destinationAmount != destinationAmount) {
        store.state.destinationAmount = destinationAmount
        updated = true
      }
    } else if (decDiff < 0) {
      // destination token has more decimals than source token
      //console.log('destination token has more decimals than source token')
      const destinationAmount = destInSourceDecimals.dividedToIntegerBy(10 ** (-1 * decDiff)).toFixed(0, 1)
      if (store.state.destinationAmount != destinationAmount) {
        store.state.destinationAmount = destinationAmount
        updated = true
      }
    }

    const sourceAmountNet = new BigNumber(store.state.sourceAmount).minus(new BigNumber(store.state.feeAmount)).toFixed(0, 1)
    if (store.state.sourceAmountNet != sourceAmountNet) {
      store.state.sourceAmountNet = sourceAmountNet
      updated = true
    }
    // prevent rounding issue with. The destinationAmount should be 1094000000000000 aramid-transfer/v1:j{"destinationNetwork":8453,"destinationAddress":"","destinationToken":"0xb23556658b1E25E0268409053274E09Ed50e2595","feeAmount":2,"destinationAmount":1094904000000000,"note":"aramid","sourceAmount":1094}

    if (decDiff == 0 && store.state.destinationAmount != store.state.sourceAmountNet) {
      if (new BigNumber(store.state.destinationAmount).gt(new BigNumber(store.state.sourceAmountNet))) {
        // take the smaller number
        store.state.destinationAmount = store.state.sourceAmountNet
        updated = true
      } else {
        // take the smaller number
        store.state.sourceAmountNet = store.state.destinationAmount
      }
    } else if (decDiff > 0) {
      // source token has fewer decimals than destination token
      const destinationInSourceDecimals = new BigNumber(store.state.destinationAmount).dividedToIntegerBy(10 ** decDiff).toFixed(0, 1)
      const sourceInDestinationDecimals = new BigNumber(store.state.sourceAmountNet).multipliedBy(10 ** decDiff).toFixed(0, 1)
      if (store.state.destinationAmount != sourceInDestinationDecimals) {
        const difference = new BigNumber(store.state.destinationAmount).minus(new BigNumber(sourceInDestinationDecimals))
        //console.log('difference', difference.toFixed(0, 1))
        if (difference.gt(0)) {
          // destination amount is greater than source amount all based in destination decimals
          store.state.destinationAmount = sourceInDestinationDecimals
          updated = true
        } else {
          // source amount is greater than destination amount all based in destination decimals
          store.state.sourceAmountNet = destinationInSourceDecimals
          // when source token is updated, we need to update the fee amount as well
          store.state.feeAmount = new BigNumber(store.state.feeAmount).minus(difference).toFixed(0, 0)
          store.state.feeAmountFormatted = formatBaseAmount(store.state.feeAmount, store.state.sourceTokenConfiguration.decimals)

          updated = true
        }
      }
    } else if (decDiff < 0) {
      // source token has more decimals than destination token
      const power = new BigNumber(10).pow(-1 * decDiff)
      const destinationInSourceDecimals = new BigNumber(store.state.destinationAmount).multipliedBy(power).toFixed(0, 1)
      const sourceInDestinationDecimals = new BigNumber(store.state.sourceAmountNet).dividedToIntegerBy(power).toFixed(0, 1)
      if (store.state.sourceAmountNet != destinationInSourceDecimals) {
        const difference = new BigNumber(store.state.sourceAmountNet).minus(new BigNumber(destinationInSourceDecimals))
        //console.log('difference', difference.toFixed(0, 1))
        if (difference.gt(0)) {
          // source amount is greater than destination amount all based in source decimals
          store.state.sourceAmountNet = destinationInSourceDecimals
          // when source token is updated, we need to update the fee amount as well
          store.state.feeAmount = new BigNumber(store.state.feeAmount).plus(difference).toFixed(0, 0)
          store.state.feeAmountFormatted = formatBaseAmount(store.state.feeAmount, store.state.sourceTokenConfiguration.decimals)
          updated = true
        } else {
          // destination amount is greater than source amount all based in source decimals
          store.state.destinationAmount = sourceInDestinationDecimals

          updated = true
        }
      }
    }
    const destinationAmountFormatted = formatBaseAmount(store.state.destinationAmount, store.state.destinationTokenConfiguration.decimals)
    if (store.state.destinationAmountFormatted != destinationAmountFormatted) {
      store.state.destinationAmountFormatted = destinationAmountFormatted
    }
    // if (updated) {
    //   console.log('calculate destination amount update 2:', {
    //     sourceAmount: store.state.sourceAmount,
    //     sourceAmountNet: store.state.sourceAmountNet,
    //     feeAmount: store.state.feeAmount,
    //     destinationAmount: store.state.destinationAmount
    //   })
    // }
  }
}

export default calculateFeeAndDestinationAmount
