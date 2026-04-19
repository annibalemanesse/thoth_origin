# ThothOrigin

ThothOrigin is a DApp that lets authors prove the anteriority of their manuscript on the Ethereum blockchain. A timestamped hash of the file is stored on-chain and materialized as an ERC-721 NFT. Supports versioning and archiving.

> Built as a final certification project at [Alyra](https://alyra.fr) — Promotion Gladys West.

---

## Overview

Authors upload their manuscript file directly in the browser. The SHA-256 hash is computed client-side — **the file never leaves the browser**. Only the hash is sent to the smart contract, which timestamps it on-chain and mints an ERC-721 NFT as proof of anteriority.

Key features:
- Proof of anteriority via SHA-256 hash + on-chain timestamp
- ERC-721 NFT minted to the author's wallet on each deposit
- Manuscript versioning — chain of linked NFTs
- Archiving / unarchiving of manuscripts
- Circuit breaker (pause / unpause) for emergency
- Public verification by hash or tokenId

---

## Stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity ^0.8.28 |
| Contract framework | Hardhat v3 |
| Libraries | OpenZeppelin Contracts |
| Contract tests | Hardhat + ethers.js |
| Frontend | Next.js 16 + React 19 |
| Wallet connection | Reown AppKit + Wagmi v3 + viem |
| Styling | Tailwind CSS v4 |
| Types | TypeScript |
| Testnet | Sepolia (Alchemy / Infura) |

---

## Project Structure

```
thoth_origin/
├── backend/
│   ├── contracts/
│   │   └── ManuscriptRegistry.sol   # Main smart contract
│   ├── test/
│   │   └── ManuscriptRegistry.ts    # Test suite
│   ├── ignition/
│   │   └── modules/                 # Deployment scripts
│   ├── coverage/                    # Coverage report (generated)
│   ├── hardhat.config.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx             # Home
    │   │   ├── deposit/             # Deposit page
    │   │   ├── dashboard/           # Author dashboard
    │   │   └── verify/              # Public verification
    │   ├── components/              # Navbar, ConnectButton
    │   ├── config/                  # Wagmi / AppKit config
    │   ├── context/                 # React providers
    │   └── utils/                   # Hash computation, contract helpers
    ├── next.config.ts
    └── package.json
```

---

## Frontend

### Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/deposit` | Hash a file and register it on-chain (new or new version) |
| `/dashboard` | Author dashboard — list, archive, unarchive manuscripts |
| `/verify` | Public verification by hash or tokenId |

### Key design choices

- **Client-side hashing** — SHA-256 computed in the browser via the Web Crypto API; the file is never uploaded anywhere.
- **Reown AppKit** — handles wallet connection across multiple connectors (MetaMask, WalletConnect, etc.).
- **Wagmi + viem** — typed contract reads and writes, transaction lifecycle management.
- **PDF certificate** — jsPDF generates a downloadable proof-of-deposit certificate.

### Getting Started (frontend)

#### Prerequisites

- Node.js >= 18
- npm >= 9

#### Installation

```bash
cd frontend
npm install
```

#### Environment

Create a `.env.local` file at the root of `frontend/`:

```env
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
```

#### Run

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # production server
```

---

## Smart Contract

**Contract:** `ManuscriptRegistry`
**Token:** `ThothOrigin` (symbol: `THOT`)
**Standard:** ERC-721 + ERC721Enumerable + ERC721Pausable + Ownable
**Network:** Sepolia testnet

### Architecture

```
ManuscriptRegistry
├── ERC721           — NFT standard
├── ERC721Enumerable — iterate tokens by owner (dashboard)
├── ERC721Pausable   — circuit breaker
└── Ownable          — access control
```

### Struct

```solidity
struct Manuscript {
    address author;          // author's wallet — 20 bytes  ┐
    bool    archived;        // archiving flag  —  1 byte   ├─ slot 1 (variable packing)
    uint64  timestamp;       // block.timestamp —  8 bytes  ┘
    uint256 tokenId;         // NFT identifier              → slot 2
    bytes32 hash;            // SHA-256 of the file         → slot 3
    uint256 previousTokenId; // 0 if initial deposit        → slot 4
    string  title;           // title of the work           → slot 5+
}
```

> Variable packing applied: `address + bool + uint64` fit in a single 32-byte storage slot.

### Functions

| Function | Access | Description |
|---|---|---|
| `registerManuscript(bytes32, string)` | external | Register a new manuscript |
| `registerNewVersion(bytes32, string, uint256)` | external | Register a new version of an existing manuscript |
| `archiveManuscript(uint256)` | external | Archive a manuscript |
| `unarchiveManuscript(uint256)` | external | Unarchive a manuscript |
| `getManuscriptByHash(bytes32)` | external view | Retrieve a manuscript by hash |
| `getManuscriptByTokenId(uint256)` | external view | Retrieve a manuscript by tokenId |
| `getManuscriptsByAuthor(address)` | external view | Retrieve manuscripts by author (up to MAX_MANUSCRIPTS_PER_QUERY) |
| `pause()` / `unpause()` | external onlyOwner | Circuit breaker |

### Events

```solidity
event ManuscriptRegistered(uint256 indexed tokenId, address indexed author, bytes32 hash, string title, uint64 timestamp, uint256 previousTokenId);
event ManuscriptArchived(uint256 indexed tokenId, address indexed author, uint64 timestamp);
event ManuscriptUnarchived(uint256 indexed tokenId, address indexed author, uint64 timestamp);
```

### Security

- **Hash deduplication** — reverts if hash already registered
- **Ownership check** — `authorOnly` modifier on archive/unarchive/version
- **No versioning on archived** — reverts if `previousTokenId` is archived
- **Title validation** — non-empty, max 100 characters
- **Circuit breaker** — `whenNotPaused` on all write functions, view functions remain accessible
- **Reentrancy** — no ETH transfer, risk analyzed and ruled out
- **Timestamp dependence** — `uint64` timestamp used as informational only, not as logic condition
- **Overflow** — native Solidity ≥ 0.8

### Getting Started (backend)

#### Installation

```bash
cd backend
npm install
```

#### Environment

Create a `.env` file at the root of `backend/`:

```env
PRIVATE_KEY=your_wallet_private_key
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

> Never commit your `.env` file. It is already listed in `.gitignore`.

#### Compile

```bash
npx hardhat compile
```

#### Test

```bash
npx hardhat test
```

#### Coverage

```bash
npx hardhat coverage
```

Current coverage: **94.34%** (min required: 80%)

#### Deploy (local)

```bash
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/ManuscriptRegistry.ts --network localhost
```

#### Deploy (Sepolia)

```bash
npx hardhat ignition deploy ./ignition/modules/ManuscriptRegistry.ts --network sepolia
```

---

## Tests

49 tests covering all contract functions:

| Describe | Tests |
|---|---|
| `registerManuscript` | 7 |
| `registerNewVersion` | 8 |
| `registerNewVersion chain depth` | 2 |
| `archiveManuscript` | 6 |
| `archiveManuscript cascade` | 2 |
| `unarchiveManuscript` | 6 |
| `unarchiveManuscript cascade` | 2 |
| `getManuscriptByHash` | 5 |
| `getManuscriptByTokenId` | 5 |
| `getManuscriptsByAuthor` | 5 |
| `_update` | 1 |

---

## Team

| Name | Role | Training |
|---|---|---|
| Anaïs | Blockchain Developer | Développement Blockchain |
| Sergueï | Founder & Consultant | Consulting Blockchain |
| Thip Lili | Legal | Consulting Blockchain |
| Alexis | Consultant | Consulting Blockchain |
| Matthieu | Consultant & Web3 Writer | Consulting Blockchain |

---

## License

MIT

---

*𓅱𓇋𓏏𓅭𓏏𓈖 · Djéhouty · scribe of the gods · guardian of writings · Ethereum Sepolia · ERC-721*
