#!/bin/bash
set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sei Token Wrapper Setup ===${NC}"

# Check if .env file exists, create if it doesn't
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file from template...${NC}"
  cp .env.template .env
  echo -e "${GREEN}Created .env file. Please edit it with your configuration.${NC}"
  echo -e "${YELLOW}Edit the .env file now? (y/n)${NC}"
  read -r answer
  if [[ "$answer" =~ ^[Yy] ]]; then
    ${EDITOR:-nano} .env
  fi
else
  echo -e "${GREEN}.env file already exists.${NC}"
fi

# Check for Rust and required targets
echo -e "${BLUE}Checking Rust installation...${NC}"
if ! command -v rustc &> /dev/null; then
  echo -e "${RED}Rust not found. Please install Rust:${NC}"
  echo -e "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  exit 1
fi

echo -e "${BLUE}Checking wasm32 target...${NC}"
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
  echo -e "${YELLOW}Installing wasm32 target...${NC}"
  rustup target add wasm32-unknown-unknown
  echo -e "${GREEN}wasm32 target installed.${NC}"
else
  echo -e "${GREEN}wasm32 target already installed.${NC}"
fi

# Check for sei-cli (optional, only needed for deployment)
echo -e "${BLUE}Checking sei-cli installation...${NC}"
if ! command -v sei-cli &> /dev/null; then
  echo -e "${YELLOW}sei-cli not found. This is only needed for deployment, not for development.${NC}"
  echo -e "${YELLOW}You can install it later from https://github.com/sei-protocol/sei-chain${NC}"
else
  echo -e "${GREEN}sei-cli is installed.${NC}"
fi

# Check for jq
if ! command -v jq &> /dev/null; then
  echo -e "${RED}jq not found. Please install jq:${NC}"
  echo -e "apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
  exit 1
fi

# Make scripts executable
echo -e "${BLUE}Making scripts executable...${NC}"
chmod +x scripts/*.sh

# Copy .env.template if it doesn't exist
if [ ! -f .env.template ]; then
  echo -e "${YELLOW}Creating .env.template...${NC}"
  cp .env .env.template
  # Replace actual values with placeholders
  sed -i 's|DEPLOYER_WALLET=.*|DEPLOYER_WALLET="your-wallet-name"|' .env.template
  sed -i 's|DEPLOYER_MNEMONIC=.*|DEPLOYER_MNEMONIC="your twelve or twenty four word mnemonic goes here"|' .env.template
  sed -i 's|NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=""|' .env.template
  echo -e "${GREEN}.env.template created.${NC}"
fi

# Run tests
echo -e "${BLUE}Running tests...${NC}"
./scripts/test.sh

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Edit .env file with your configuration if you haven't already"
echo -e "2. Deploy the contract: ./scripts/deploy.sh"
echo -e "3. Update frontend config: ./scripts/update-config.sh"
echo -e "4. Run the frontend: cd frontend && npm install && npm run dev"