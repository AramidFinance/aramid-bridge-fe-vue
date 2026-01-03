export const submitNearClaimTx = async () => {
  throw Error('Near claim is not yet implemented in aramid vuejs app.')
  // if (isTokenStorageDeposited) {
  //   const claim = appData.claimData;
  //   const soldierIds = claim.soldierAccIds;
  //   const sigBuffer = base64ArrayToConcatenatedBase64(claim.signatures);
  //   const dc = claim.destinationChainData;
  //   const sc = claim.sourceChainData;
  //   const destinationChainData = {
  //     chain_id: dc.chainId,
  //     token_address: dc.tokenId,
  //     amount: dc.amount,
  //     address: dc.addressId,
  //   };
  //   const sourceChainData = {
  //     chain_id: sc.chainId,
  //     token_address: sc.tokenId,
  //     amount: sc.amount,
  //     address: sc.addressId,
  //   };
  //   let releaseTokenArgs = {
  //     max_release_round: String(claim.maxClaimRound),
  //     source_transaction_id: claim.sourceTransactionId,
  //     destination_chain_data: destinationChainData,
  //     source_chain_data: sourceChainData,
  //     note: claim.note,
  //   };
  //   const msgData = {
  //     release_tokens_args: releaseTokenArgs,
  //     soldiers_list: soldierIds,
  //     soldier_signatures: sigBuffer,
  //   };

  //   // appData.claimTxStatus = TX_STATUS.txCompleted;
  //   appData.isNearClaimed = true;
  //   appData.saveTrigger = !appData.saveTrigger;
  //   appData.setAppData(appData);
  //   const actions: any = [
  //     {
  //       type: 'FunctionCall',
  //       params: {
  //         methodName: 'release_tokens',
  //         args: msgData,
  //         gas: '150000000000000',
  //         deposit: '1',
  //       },
  //     },
  //   ];
  //   if (!isNearStorageDeposited) {
  //     actions.unshift({
  //       type: 'FunctionCall',
  //       params: {
  //         methodName: 'storage_deposit',
  //         args: {
  //           account_id: appData.destinationAddress,
  //         },
  //         gas: '150000000000000',
  //         deposit: '10000000000000000000000',
  //       },
  //     });
  //   }
  //   const tx = await appDataComplex.nearWallet?.callMultipleMethod({
  //     contractId: CONTRACT_ADDRESS(appData?.appConfiguration?.environment, appData?.publicConfiguration),
  //     actions: actions,
  //   });
  // } else {
  //   throw Error('Please deposit the storage fee in token contract first to claim.');
  // }
}
