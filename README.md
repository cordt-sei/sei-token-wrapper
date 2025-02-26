# Sei Token Wrapper

A unified token wrapper for Sei blockchain that enables wrapping and unwrapping of both ERC20 and CW20 tokens into native Sei tokens.

## Features

- Wrap ERC20 tokens from EVM-compatible chains into Sei native tokens
- Wrap CW20 tokens from CosmWasm contracts into Sei native tokens
- Unwrap tokens back to their original form
- Unified interface for handling both token types
- Query functionality to discover wrapped tokens

## Project Structure

```sh
sei-token-wrapper/
├── contracts/       # Smart contract code
├── frontend/        # Web interface
└── scripts/         # Deployment and testing scripts
```

## Development Setup

### Prerequisites

- Rust 1.72.0+
- wasm32-unknown-unknown target
- Node.js 18+ (for frontend)

### Building the Contract

```bash
# Build the WebAssembly binary
cargo wasm

# Generate JSON schema
cargo schema
```

### Testing

```bash
# Run unit tests
cargo unit-test
```

### Deployment

The contract can be deployed to the Sei testnet (atlantic-2) using the provided deployment script:

```bash
./scripts/deploy.sh
```

## Contract Interface

### Execute Messages

- **Receive**: Handles CW20 token deposits
- **WrapERC20**: Wraps ERC20 tokens into Sei native tokens
- **Unwrap**: Unwraps tokens back to either ERC20 or CW20 form

### Query Messages

- **TokenInfo**: Get information about a wrapped token by denom
- **WrappedDenom**: Find the wrapped denom for a token address
- **ListWrappedTokens**: List all wrapped tokens with pagination

## Frontend

The frontend provides a user interface for:

- Connecting to Sei wallet
- Wrapping tokens (ERC20 or CW20)
- Unwrapping tokens
- Viewing wrapped token balances

To run the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

## License

[MIT License](LICENSE)

## Acknowledgements

Special thanks to Aritz of CrownFi for the research and development work that provided the concept and foundation on which this project was built. His contributions to the Sei ecosystem and token standards interoperability have been invaluable in making this wrapper possible.
