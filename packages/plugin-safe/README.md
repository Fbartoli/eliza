# Safe Plugin for AgentKit

This plugin integrates [Safe](https://safe.global/) functionality into AgentKit, allowing agents to interact with Safe wallets for secure transaction management.

## Features

- Create and manage Safe wallets
- Send native currency transactions
- Send ERC20 token transfers
- Execute arbitrary contract calls

## Setup

1. Install the package:
```bash
pnpm add @elizaos/plugin-safe
```

2. Set required environment variables:
```bash
WALLET_PRIVATE_KEY=your_private_key
RPC_URL=your_ethereum_rpc_url
```

## Usage

### Plugin Registration

```typescript
import { agentKitPlugin as safePlugin } from "@elizaos/plugin-safe";

// Register the plugin with your agent
agent.registerPlugin(safePlugin);
```

### Available Actions

1. **SEND_NATIVE_CURRENCY**
   - Send native currency (ETH) to an address
   - Parameters:
     - `to`: Recipient address (hex)
     - `value`: Amount in wei (string)

2. **SEND_ERC20**
   - Send ERC20 tokens
   - Parameters:
     - `to`: Recipient address (hex)
     - `value`: Amount in wei (string)
     - `erc20Address`: Token contract address (hex)

3. **CALL_CONTRACT**
   - Execute arbitrary contract calls
   - Parameters:
     - `to`: Contract address (hex)
     - `data`: Encoded function call data (hex)
     - `value`: Amount of native currency to send (string)

### Wallet Provider

The plugin includes a wallet provider that exposes the Safe wallet address. This can be accessed through the agent's provider system.

## Error Handling

The plugin includes comprehensive error handling for:
- Missing environment variables
- Safe wallet creation failures
- Transaction execution errors

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build
```

## Dependencies

- @elizaos/core
- @safe-global/sdk-starter-kit
- @langchain/core

## License

MIT
