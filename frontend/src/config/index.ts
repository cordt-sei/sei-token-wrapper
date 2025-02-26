import { Config, TokenConfig } from "../types/config";

export const config: Config = {
  testnet: {
    chainConfig: {
      chainId: "sei-atlantic-2",
      chainName: "Sei Atlantic 2 Testnet",
      rpc: "https://sei-testnet-rpc.brocha.in",
      rest: "https://sei-testnet-rest.brocha.in",
      stakeCurrency: {
        coinDenom: "SEI",
        coinMinimalDenom: "usei",
        coinDecimals: 6,
      },
      bech32Config: {
        bech32PrefixAccAddr: "sei",
      },
      currencies: [
        {
          coinDenom: "SEI",
          coinMinimalDenom: "usei",
          coinDecimals: 6,
        },
      ],
      feeCurrencies: [
        {
          coinDenom: "SEI",
          coinMinimalDenom: "usei",
          coinDecimals: 6,
        },
      ],
      coinType: 118,
      gasPriceStep: {
        low: 0.1,
        average: 0.2,
        high: 0.3,
      },
    },
    // Update this after deploying the contract
    contractAddress: "sei1...",
    gasPrice: "0.1usei",
  },
};

// Sample tokens for testing - update with real tokens when available
export const testnetTokens: TokenConfig[] = [
  {
    name: "Test ERC20",
    symbol: "TERC",
    address: "0x1234567890123456789012345678901234567890",
    type: "ERC20",
    decimals: 18,
  },
  {
    name: "Test CW20",
    symbol: "TCW",
    address: "sei1...", // Replace with actual CW20 contract address
    type: "CW20",
    decimals: 6,
  },
];

export const currentNetwork = config.testnet;