#!/bin/bash
set -e

# Ensure the script is run from the project root
if [ ! -d "contracts" ] || [ ! -d "scripts" ]; then
    echo "Please run this script from the project root directory"
    exit 1
fi

# Run the unit tests
echo "Running unit tests..."
cargo test --workspace

# Build the contract in library mode
echo "Building the contract..."
(cd contracts/token-wrapper && cargo wasm --lib)

# Generate the schema (only on native target, not wasm)
echo "Generating schema..."
(cd contracts/token-wrapper && cargo schema)

echo "Tests and validation complete!"