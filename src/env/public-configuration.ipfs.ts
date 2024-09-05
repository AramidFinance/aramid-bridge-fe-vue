import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'

const config: PublicConfigurationRoot = {
  addresses: {
    config: 'EGRNQAIVBY4O47XJNCLIYZGSHBQIKYC25VWEHBQVFRUACCXBR7TDSKISSA',
    configObj: {
      address: 'EGRNQAIVBY4O47XJNCLIYZGSHBQIKYC25VWEHBQVFRUACCXBR7TDSKISSA',
      chainId: 101003
    },
    proofs: 'FJMKOR6EDJ2YFF5B7Y3LJKZ3JG53ZRYLGHIJ3MTFMI5OVDPKPPBVETMGFU',
    proofsObj: {
      address: 'FJMKOR6EDJ2YFF5B7Y3LJKZ3JG53ZRYLGHIJ3MTFMI5OVDPKPPBVETMGFU',
      chainId: 101003
    },
    claims: 'Y23J3FZTGOQN6U5LKX6CGM4J3R6RXKVKGPH4H4UKRBHE5PYIK6IKDDHIGY',
    claimsObj: {
      address: 'Y23J3FZTGOQN6U5LKX6CGM4J3R6RXKVKGPH4H4UKRBHE5PYIK6IKDDHIGY',
      chainId: 101003
    },
    roundOracle: 'ARAMIDXXYOGENNKBIXUS7GTZR3FNV7S7JFE7K5Y7B66AVKNV5IQSUTFAO4',
    roundOracleObj: {
      address: 'ARAMIDXXYOGENNKBIXUS7GTZR3FNV7S7JFE7K5Y7B66AVKNV5IQSUTFAO4',
      chainId: 101003
    },
    escrow: 'todo',
    escrowObj: {
      address: 'todo',
      chainId: 101003
    },
    soldiersCommObj: {
      address: 'JDAT5II37K3RCTDXR2DTYWMCI4W66PO6NMHIQ5HMWSF3CKVE7SVWD2VTNQ',
      chainId: 101003
    }
  },
  chains: {
    '101003': {
      chainId: 101003,
      name: 'AramidChain',
      type: 'algo',
      folder: 'algo',
      tokens: {},
      address: 'VINY6VJDHYYSKTRE54XHOUMS5ISV6A5XHOV3HMMLBNJNHNLIMYFRMLLXOI',
      logo: 'algo',
      blockExplorers: ['https://app.dappflow.org/explorer/transaction/'],
      soldiersByRound: [
        {
          validFrom: 0,
          validUntil: 999999999,
          signThreshold: 3,
          sendThreshold: 3,
          soldiers: {
            's2-1': '55LMB3P7DIYSL4VHUZQDPO36JLD5FKNJ4LVBFG7CUZDYA5DABMTGUF3RSA',
            's2-2': 'JJY3IRHNIQIEFEPCPBGAMNQBBGOAZZZHMHDO4FD3PVDHZQAGQIGOLOQXDI',
            's3-1': 'Q5GB5LAP7DRIWBVBR6KJABKK7VXULI4CCNZOQFR3BYMMRLREIBQI3565ZE',
            's3-2': 'WKS2LO5DN6X4TMLQF2LG74MRXWYRLMO3X5UYCUKKW6FPF23J7D4JGURDJQ'
          }
        }
      ]
    },
    '416001': {
      chainId: 416001,
      name: 'Algorand',
      type: 'algo',
      folder: 'algo',
      address: 'VINY6VJDHYYSKTRE54XHOUMS5ISV6A5XHOV3HMMLBNJNHNLIMYFRMLLXOI',
      logo: 'algo',
      blockExplorers: ['https://allo.info/tx/'],
      tokens: {
        '0': {
          tokenId: '0',
          name: 'Algo',
          symbol: 'aAlgo',
          decimals: 6,
          chainId: 416001,
          type: 'algo',
          isPremium: false,
          logo: 'algo'
        },
        '31566704': {
          tokenId: '31566704',
          name: 'USDC',
          symbol: 'aUSC',
          decimals: 6,
          chainId: 416001,
          type: 'algo',
          isPremium: false,
          logo: 'usdc'
        },
        '1241944285': {
          tokenId: '1241944285',
          name: 'Gold',
          symbol: 'gold',
          decimals: 6,
          chainId: 416001,
          type: 'algo',
          isPremium: false,
          logo: 'gold'
        },
        '1392374998': {
          tokenId: '1392374998',
          name: 'Voi Testnet',
          symbol: 'aVoitest',
          decimals: 6,
          chainId: 416001,
          type: 'algo',
          isPremium: false,
          logo: 'aramid-voi'
        }
      },
      soldiersByRound: [
        {
          validFrom: 0,
          validUntil: 999999999,
          signThreshold: 3,
          sendThreshold: 3,
          soldiers: {
            's2-1': '55LMB3P7DIYSL4VHUZQDPO36JLD5FKNJ4LVBFG7CUZDYA5DABMTGUF3RSA',
            's2-2': 'JJY3IRHNIQIEFEPCPBGAMNQBBGOAZZZHMHDO4FD3PVDHZQAGQIGOLOQXDI',
            's3-1': 'Q5GB5LAP7DRIWBVBR6KJABKK7VXULI4CCNZOQFR3BYMMRLREIBQI3565ZE',
            's3-2': 'WKS2LO5DN6X4TMLQF2LG74MRXWYRLMO3X5UYCUKKW6FPF23J7D4JGURDJQ'
          }
        }
      ]
    },
    '416102': {
      chainId: 416102,
      name: 'VoiTest',
      type: 'algo',
      folder: 'algo',
      address: 'VINY6VJDHYYSKTRE54XHOUMS5ISV6A5XHOV3HMMLBNJNHNLIMYFRMLLXOI',
      logo: 'voi',
      blockExplorers: ['https://voitest-explorer.k1-fi.a-wallet.net/explorer/transaction/'],
      tokens: {
        '0': {
          tokenId: '0',
          name: 'Voi',
          symbol: 'aVoitest',
          decimals: 6,
          chainId: 416102,
          type: 'algo',
          isPremium: false,
          logo: 'voi'
        },
        '26168978': {
          tokenId: '26168978',
          name: 'Aramid USDc',
          symbol: 'aUSC',
          decimals: 6,
          chainId: 416102,
          type: 'algo',
          isPremium: true,
          logo: 'aramid-usdc'
        },
        '26174498': {
          tokenId: '26174498',
          name: 'Gold',
          symbol: 'gold',
          decimals: 6,
          chainId: 416102,
          type: 'algo',
          isPremium: false,
          logo: 'gold'
        },
        '26174499': {
          tokenId: '26174499',
          name: 'Algo Mainnet',
          symbol: 'aAlgo',
          decimals: 6,
          chainId: 416102,
          type: 'algo',
          isPremium: false,
          logo: 'aramid-algo'
        }
      },
      soldiersByRound: [
        {
          validFrom: 0,
          validUntil: 999999999,
          signThreshold: 3,
          sendThreshold: 3,
          soldiers: {
            's2-1': '55LMB3P7DIYSL4VHUZQDPO36JLD5FKNJ4LVBFG7CUZDYA5DABMTGUF3RSA',
            's2-2': 'JJY3IRHNIQIEFEPCPBGAMNQBBGOAZZZHMHDO4FD3PVDHZQAGQIGOLOQXDI',
            's3-1': 'Q5GB5LAP7DRIWBVBR6KJABKK7VXULI4CCNZOQFR3BYMMRLREIBQI3565ZE',
            's3-2': 'WKS2LO5DN6X4TMLQF2LG74MRXWYRLMO3X5UYCUKKW6FPF23J7D4JGURDJQ'
          }
        }
      ]
    }
  },
  chains2tokens: {
    '416001': {
      '416102': {
        '0': {
          '26174499': {
            sourceChain: 416001,
            sourceToken: '0',
            sourceName: 'Algo',
            sourceSymbol: 'aAlgo',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'algo',
            destinationChain: 416102,
            destinationToken: '26174499',
            destinationName: 'Algo Mainnet',
            destinationSymbol: 'aAlgo',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'aramid-algo',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '100000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        },
        '31566704': {
          '26168978': {
            sourceChain: 416001,
            sourceToken: '31566704',
            sourceName: 'USDC',
            sourceSymbol: 'aUSC',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'usdc',
            destinationChain: 416102,
            destinationToken: '26168978',
            destinationName: 'Aramid USDc',
            destinationSymbol: 'aUSC',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'aramid-usdc',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '100000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        },
        '1241944285': {
          '26174498': {
            sourceChain: 416001,
            sourceToken: '1241944285',
            sourceName: 'Gold',
            sourceSymbol: 'gold',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'gold',
            destinationChain: 416102,
            destinationToken: '26174498',
            destinationName: 'Gold',
            destinationSymbol: 'gold',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'gold',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        },
        '1392374998': {
          '0': {
            sourceChain: 416001,
            sourceToken: '1392374998',
            sourceName: 'Voi Testnet',
            sourceSymbol: 'aVoitest',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'aramid-voi',
            destinationChain: 416102,
            destinationToken: '0',
            destinationName: 'Voi',
            destinationSymbol: 'aVoitest',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'voi',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '100000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        }
      }
    },
    '416102': {
      '416001': {
        '0': {
          '1392374998': {
            sourceChain: 416102,
            sourceToken: '0',
            sourceName: 'Voi',
            sourceSymbol: 'aVoitest',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'voi',
            destinationChain: 416001,
            destinationToken: '1392374998',
            destinationName: 'Voi Testnet',
            destinationSymbol: 'aVoitest',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'aramid-voi',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '100000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        },
        '26168978': {
          '31566704': {
            sourceChain: 416102,
            sourceToken: '26168978',
            sourceName: 'Aramid USDc',
            sourceSymbol: 'aUSC',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'aramid-usdc',
            destinationChain: 416001,
            destinationToken: '31566704',
            destinationName: 'USDC',
            destinationSymbol: 'aUSC',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'usdc',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '100000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        },
        '26174498': {
          '1241944285': {
            sourceChain: 416102,
            sourceToken: '26174498',
            sourceName: 'Gold',
            sourceSymbol: 'gold',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'gold',
            destinationChain: 416001,
            destinationToken: '1241944285',
            destinationName: 'Gold',
            destinationSymbol: 'gold',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'gold',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        },
        '26174499': {
          '0': {
            sourceChain: 416102,
            sourceToken: '26174499',
            sourceName: 'Algo Mainnet',
            sourceSymbol: 'aAlgo',
            sourceDecimals: 6,
            sourceType: 'algo',
            sourceTokenLogo: 'aramid-algo',
            destinationChain: 416001,
            destinationToken: '0',
            destinationName: 'Algo',
            destinationSymbol: 'aAlgo',
            destinationDecimals: 6,
            destinationType: 'algo',
            destinationTokenLogo: 'algo',
            feeAlternatives: [
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '100000',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: false
              },
              {
                validFrom: 0,
                validUntil: 999999999,
                minimumAmount: '1',
                maximumAmount: '999999999000000',
                sourceConst: 0,
                sourcePercent: 0.001,
                destinationConst: 0,
                destinationPercent: 0,
                ifPremiumTokenUsed: true
              }
            ]
          }
        }
      }
    }
  }
}

export default config
