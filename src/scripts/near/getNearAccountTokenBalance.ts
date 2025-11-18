import BigNumber from 'bignumber.js'
import logger from '@/scripts/common/conditionalLogger'

export const getNearAccountTokenBalance = async (nearWallet: any, token: string, account: string) => {
  try {
    const balance = await nearWallet.viewMethod({ method: 'ft_balance_of', args: { account_id: account }, contractId: token })
    return new BigNumber(balance)
  } catch (e) {
    logger.debug('file: getNearAccountTokenBalance.ts:11  getNearAccountTokenBalance  e:', e, nearWallet.accountId, token)
    return new BigNumber(0)
  }
}
