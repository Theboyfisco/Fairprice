# GoalLine ⚡ — Trustless World Cup Prediction Market

> **Superteams × TxLINE Track Submission**  
> **Network**: Solana Devnet  
> **Live Demo**:https://t-xcool-prediction-markets-and-sett-red.vercel.app/  
> **Demo Video**:https://www.loom.com/share/38c090a4ae6340dd8e600aa5cdd3dd11/ 


GoalLine is a **permissionless, cryptographically-verifiable prediction market** for the FIFA World Cup 2026. It leverages TxLINE's real-time data streams and Merkle-proof infrastructure to enable users to place USDC bets on match outcomes without relying on a centralized oracle for settlement.

---

## 🏆 Hackathon Track Alignment

We built GoalLine to perfectly align with the core requirements of the TxLINE track:

1. **Data-Driven Web3 Platform**: The frontend ingests TxLINE's high-speed Server-Sent Events (SSE) Stream to power a highly responsive UI. Match scores, events, and fixture states update dynamically in real-time.
2. **Permissionless Results Validation**: We implemented a custom on-chain settlement engine. The Solana program uses Cross-Program Invocations (CPIs) into TxLINE's `validate_stat` instruction to confirm match outcomes trustlessly.
3. **No P2P Asset Transfers with TxLINE credits**: The application strictly holds **USDC** (via a custom PDA faucet for devnet testing) in escrow. TxLINE credits are completely isolated.
4. **Custom On-Chain Settlement Engine**: Smart contracts automatically automate contract releases and unlock funds directly to user wallets the second a verified TxLINE proof is submitted on-chain.

---

## 🏗️ Architecture & Data Flow

GoalLine uses a hybrid architecture, combining a fast Next.js 14 frontend with a secure Anchor-based Solana program.

```text
  User Browser
      │
      ├── GET  /api/fixtures        ──→  TxLINE: GET /api/fixtures/snapshot
      ├── GET  /api/odds/:id        ──→  TxLINE: GET /api/odds/snapshot/{fixtureId}
      ├── SSE  /api/stream          ──→  TxLINE: SSE /api/scores/stream (live)
      └── POST /api/validate        ──→  TxLINE: GET /api/scores/stat-validation
              │
              │ (Merkle proof JSON passed to Wallet)
              ▼
  Solana Devnet ── GoalLine Program (GL1neprog1111111111111111111111111111111111)
              │
              └── settle_market() ──CPI──→ TxLINE validate_stat program (6pW64gN1s2uq...)
                                           (verifies Merkle proof on-chain)
                                           returns bool: predicate passed?
                                           │
                                           └── market.winner = Some(result)
                                               vault unlocked for winners
```

### TxLINE API Integration
We deeply integrated the TxLINE API as the primary data source across four core endpoints:
1. `GET /api/fixtures/snapshot`: Seeds the prediction dashboard with all 104 World Cup match schedules.
2. `GET /api/odds/snapshot/{fixtureId}`: Displays consensus betting odds (1X2, Over/Under, BTTS).
3. `SSE /api/scores/stream`: Powers real-time score updates across the UI (scoreboard, match cards, feed panel) without polling.
4. `GET /api/scores/stat-validation`: Fetches the cryptographic Merkle proof for the on-chain settlement CPI.

---

## 🔒 Smart Contract Security & Logic

The `goalline-program` is written in Rust using the Anchor framework. Code quality, determinism, and security were top priorities:

- **Oracle Spoofing Protection**: The `settle_market` instruction strictly constraints the oracle program address to the canonical TxLINE Devnet Program ID (`6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J`).
- **Token Spoofing Protection**: The `create_market` instruction locks the accepted mint to the internal PDA-owned USDC faucet, preventing users from creating markets with fake or malicious SPL tokens.
- **Race Condition Guards**: The `place_bet` instruction validates prediction changes *before* executing the SPL token transfer, ensuring user funds are never locked unnecessarily.
- **Proportional Payouts**: Winners receive a mathematically precise share of the total pool: `(user_bet / winning_pool) × total_pool`. Zero platform fees are extracted.

### Program Instructions

| Instruction | Description |
|---|---|
| `initialize_mint` | Creates the PDA-owned test-USDC mint |
| `request_faucet` | Mints 1,000 USDC to the caller for testing |
| `create_market` | Opens a new prediction market for a fixture + market type |
| `place_bet` | Locks USDC in the market's vault, records prediction |
| `settle_market` | CPIs into TxLINE to verify the match result and sets the market winner |
| `claim_winnings` | Transfers proportional winnings from the vault to the winning bettor |

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ and `npm`
- Phantom or Solflare wallet browser extension (set to Solana Devnet)

### Frontend Setup
```bash
# 1. Clone the repository and navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create a .env.local file (Requires TxLINE API Keys)
# NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
# NEXT_PUBLIC_TXLINE_API_BASE=https://txline-dev.txodds.com/api
# TXLINE_JWT=your_jwt_here
# TXLINE_API_TOKEN=your_token_here
# NODE_TLS_REJECT_UNAUTHORIZED="0" # Required for TxLINE devnet SSL certs

# 4. Run the development server
npm run dev
```

Navigate to `http://localhost:3000` to interact with the platform.

### Smart Contract Deployment (Optional)
The smart contracts are pre-deployed to devnet. If you wish to build and deploy locally, please see `SETUP.md` for full Solana CLI and Anchor WSL2 instructions.

---

## 📝 Team Feedback on TxLINE API

**What we liked most:**
- The unified JSON schema across all endpoints is fantastic. It drastically reduced the parsing overhead on the frontend.
- The `validate_stat` primitive is brilliant. Allowing us to offload the heavy lifting of outcome verification directly to the TxLINE oracle via CPI made the smart contract logic incredibly lean and purely focused on escrow mechanics.
- The SSE stream is blazing fast.

**Where we hit friction:**
- The Devnet SSL Certificate issue (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) caused our Next.js backend fetches to fail silently initially. We had to implement `NODE_TLS_REJECT_UNAUTHORIZED="0"` to bypass it.
- Future matches without published odds return a `403` instead of a standard `404` or an empty schema, requiring custom fallback error handling in our `/api/odds` wrapper.

---

*Disclaimer: Participants are responsible for ensuring compliance with all applicable laws. TxLINE and Superteam Earn do not endorse illegal betting activity. This is an experimental submission.*
