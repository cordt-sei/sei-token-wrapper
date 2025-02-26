#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  source .env
else
  echo "No .env file found. Please create one based on the template."
  exit 1
fi

# Configuration from env variables
CONTRACT_NAME=${CONTRACT_NAME}
NETWORK=${SEI_NETWORK}
CHAIN_ID=${SEI_CHAIN_ID}
NODE=${SEI_RPC}
DEPLOYER=${DEPLOYER_WALLET}
GAS_PRICES=${GAS_PRICES}
GAS_ADJUSTMENT=${GAS_ADJUSTMENT}

# Display configuration
echo "Deployment Configuration:"
echo "------------------------"
echo "Network: $NETWORK"
echo "Chain ID: $CHAIN_ID"
echo "RPC Node: $NODE"
echo "Deployer: $DEPLOYER"
echo "------------------------"

# Ensure the script is run from the project root
if [ ! -d "contracts" ] || [ ! -d "scripts" ]; then
    echo "Please run this script from the project root directory"
    exit 1
fi

# Build the contract
echo "Building the contract..."
cd contracts/token-wrapper
cargo wasm
cd ../..

# Optimize the wasm (assumes sei-rust-optimizer is installed)
echo "Optimizing the wasm binary..."
if command -v sei-rust-optimizer &> /dev/null; then
    sei-rust-optimizer ./contracts/token-wrapper
    WASM_PATH="./artifacts/${CONTRACT_NAME}.wasm"
    echo "Using optimized binary: $WASM_PATH"
else
    echo "sei-rust-optimizer not found, using unoptimized binary"
    WASM_PATH="./contracts/token-wrapper/target/wasm32-unknown-unknown/release/${CONTRACT_NAME}.wasm"
    echo "Using unoptimized binary: $WASM_PATH"
fi

# Store the contract
echo "Storing the contract on ${NETWORK}..."
STORE_RESULT=$(sei-cli tx wasm store "$WASM_PATH" \
    --from "$DEPLOYER" \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    --gas-prices "$GAS_PRICES" \
    --gas auto \
    --gas-adjustment "$GAS_ADJUSTMENT" \
    -y \
    -b block \
    --output json)

# Extract the code ID
CODE_ID=$(echo "$STORE_RESULT" | jq -r '.logs[0].events[] | select(.type == "store_code") | .attributes[] | select(.key == "code_id") | .value')
echo "Contract stored with code ID: $CODE_ID"

# Instantiate the contract
echo "Instantiating the contract..."
INIT_RESULT=$(sei-cli tx wasm instantiate "$CODE_ID" '{}' \
    --from "$DEPLOYER" \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    --label "${CONTRACT_NAME}-v1" \
    --admin "$DEPLOYER" \
    --gas-prices "$GAS_PRICES" \
    --gas auto \
    --gas-adjustment "$GAS_ADJUSTMENT" \
    -y \
    -b block \
    --output json)

# Extract the contract address
CONTRACT_ADDR=$(echo "$INIT_RESULT" | jq -r '.logs[0].events[] | select(.type == "instantiate") | .attributes[] | select(.key == "_contract_address") | .value')
echo "Contract instantiated at address: $CONTRACT_ADDR"

# Save the deployment info
echo "Saving deployment information..."
mkdir -p ./deployments
cat > "./deployments/${NETWORK}.json" << EOL
{
  "network": "${NETWORK}",
  "chainId": "${CHAIN_ID}",
  "codeId": ${CODE_ID},
  "contractAddress": "${CONTRACT_ADDR}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOL

# Update .env file with contract address
if grep -q "NEXT_PUBLIC_CONTRACT_ADDRESS" .env; then
  # Update existing variable
  sed -i "s|NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=\"$CONTRACT_ADDR\"|" .env
else
  # Add variable if it doesn't exist
  echo "NEXT_PUBLIC_CONTRACT_ADDRESS=\"$CONTRACT_ADDR\"" >> .env
fi

echo "Deployment complete!"
echo "Contract address: $CONTRACT_ADDR"
echo "Code ID: $CODE_ID"
echo "Deployment info saved to: ./deployments/${NETWORK}.json"
echo ".env file updated with contract address"