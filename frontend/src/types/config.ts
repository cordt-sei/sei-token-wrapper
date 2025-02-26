export interface ChainConfig {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  stakeCurrency: {
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  };
  bech32Config: {
    bech32PrefixAccAddr: string;
  };
  currencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  }>;
  feeCurrencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  }>;
  coinType: number;
  gasPriceStep: {
    low: number;
    average: number;
    high: number;
  };
}

export interface NetworkConfig {
  chainConfig: ChainConfig;
  contractAddress: string;
  gasPrice: string;
}

export interface Config {
  testnet: NetworkConfig;
}

export interface TokenConfig {
  name: string;
  symbol: string;
  address: string;
  type: 'ERC20' | 'CW20';
  logo?: string;
  decimals: number;
}