# BLACKHAT Wallet Inspector

Read-only public Bitcoin and Ethereum wallet address inspection. No seed phrases, passwords, private keys, signing, transfers, or wallet connections.

## Render configuration
- Environment: Node
- Branch: main
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`
- Node.js >= 20

Powered by public Blockstream and Blockscout endpoints, which may impose rate limits. Ethereum balance covers native ETH only; BTC includes mempool balance. This is not a custodial wallet.
