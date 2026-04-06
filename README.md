# ThothOrigin 

## Backend

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
	bool    hasParent;       // is a new version —  1 byte  │
	uint64  timestamp;       // block.timestamp —  8 bytes  ┘
	uint256 previousTokenId; // 0 if initial deposit        → slot 2
	bytes32 hash;            // SHA-256 of the file         → slot 3
	string  title;           // title of the work           → slot 4+
}
```

> Variable packing applied: `address + bool + bool + uint64` fit in a single 32-byte storage slot.

### Functions

| Function | Access | Description |
|---|---|---|
| `registerManuscript(bytes32, string)` | external | Register a new manuscript |
| `registerNewVersion(bytes32, string, uint256)` | external | Register a new version of an existing manuscript |
| `archiveManuscript(uint256)` | external | Archive a manuscript |
| `unarchiveManuscript(uint256)` | external | Unarchive a manuscript |
| `getManuscriptByHash(bytes32)` | external view | Retrieve a manuscript by hash |
| `getManuscriptByTokenId(uint256)` | external view | Retrieve a manuscript by tokenId |
| `getManuscriptsByAuthor(address, uint256)` | external view | Retrieve all manuscripts by author (paginated) |
| `pause()` / `unpause()` | external onlyOwner | Circuit breaker |

### Events

```solidity
event ManuscriptRegistered(uint256 indexed tokenId, address indexed author, bytes32 hash, string title, uint64 timestamp, uint256 previousTokenId, bool hasParent);
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

---

## Stack

| Layer | Technology |
|---|---|
| Language | Solidity ^0.8.28 |
| Framework | Hardhat v3 |
| Libraries | OpenZeppelin Contracts |
| Tests | Hardhat + ethers.js |
| Types | TypeScript |
| Testnet | Sepolia (Alchemy / Infura) |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
git clone https://github.com/<your-repo>/thoth_origin.git
cd thoth_origin/backend
npm install
```

### Environment

Create a `.env` file at the root of `backend/`:

```env
PRIVATE_KEY=your_wallet_private_key
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

> Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Usage

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

### Coverage

```bash
npx hardhat coverage
```

Current coverage: **94.34%** (min required: 80%)

### Deploy (local)

```bash
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/ManuscriptRegistry.ts --network localhost
```

### Deploy (Sepolia)

```bash
npx hardhat ignition deploy ./ignition/modules/ManuscriptRegistry.ts --network sepolia
```

---

## Tests

42 tests covering all contract functions:

| Describe | Tests |
|---|---|
| `registerManuscript` | 7 |
| `registerNewVersion` | 8 |
| `archiveManuscript` | 6 |
| `unarchiveManuscript` | 6 |
| `getManuscriptByHash` | 5 |
| `getManuscriptByTokenId` | 5 |
| `getManuscriptsByAuthor` | 5 |

---

## Project Structure

```
backend/
├── contracts/
│   └── ManuscriptRegistry.sol   # Main smart contract
├── test/
│   └── ManuscriptRegistry.ts    # Test suite
├── ignition/
│   └── modules/                 # Deployment scripts
├── coverage/                    # Coverage report (generated)
├── hardhat.config.ts
└── package.json
```

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
