#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "No .env file found. Please create one first."
  exit 1
fi

# Check if contract address is set
if [ -z "$NEXT_PUBLIC_CONTRACT_ADDRESS" ]; then
  echo "Contract address not found in .env file."
  echo "Please deploy the contract first or manually set NEXT_PUBLIC_CONTRACT_ADDRESS."
  exit 1
fi

# Update the frontend config file
CONFIG_FILE="frontend/src/config/index.ts"

# Create the updated config
cat > $CONFIG_FILE << EOL
import { Config, TokenConfig } from "../types/config";

export const config: Config = {
  testnet: {
    chainConfig: {
      chainId: "${NEXT_PUBLIC_SEI_CHAIN_ID}",
      chainName: "Sei Atlantic 2 Testnet",
      rpc: "${NEXT_PUBLIC_SEI_RPC}",
      rest: "${NEXT_PUBLIC_SEI_REST}",
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
    contractAddress: "${NEXT_PUBLIC_CONTRACT_ADDRESS}",
    gasPrice: "${GAS_PRICES}",
  },
};

// Sample tokens for testing
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
EOL

echo "Frontend config updated with contract address: ${NEXT_PUBLIC_CONTRACT_ADDRESS}"