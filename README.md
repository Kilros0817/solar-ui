# Contract Collaboration Platform UI

A decentralized contract management dApp frontend built with Next.js, React, TypeScript, and Tailwind CSS. It connects to the `SolarDMS` smart contract on Base Sepolia and provides role-based contract workflows, document collaboration, e-signatures, and real-time updates.

## Overview

This application lets teams manage the full lifecycle of a contract on-chain:

- Users request accounts and are assigned roles/divisions by an admin.
- Legal users create contracts and assign sections to division leaders.
- Division leaders assign clauses to members, who submit contributions.
- Legal reviews sections and division leaders review clauses.
- Clients review and e-sign the final contract.
- Documents are stored on IPFS (via Pinata) and referenced by CID in the smart contract.

## Features

- **Role-based access control** — Admin, Legal Team, Division Leader, Division Member, Client, and No Role.
- **Account registration & approval** — New users request access; admins approve or decline.
- **Dashboard** — Contract list and status based on user role.
- **Contract creation** — Upload a contract, assign sections to division leaders, and publish to the blockchain.
- **Section & clause assignment** — Break contracts into sections and clauses with per-member assignments.
- **Review & approval workflow** — Section legal review and clause leader review with approve/reject actions.
- **Client review & e-signature** — Clients review submitted contracts and sign them on-chain.
- **Document statuses** — Pending, Request, Approved, Rejected, Esigned.
- **Analytics** — Contract activity dashboard.
- **Real-time updates** — WebSocket integration refreshes contract data as on-chain events occur.
- **Wallet login** — Web3Auth passwordless email login with Wagmi/Viem.

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State & Web3:** [Wagmi](https://wagmi.sh/) + [Viem](https://viem.sh/)
- **Authentication:** [Web3Auth](https://web3auth.io/) (email passwordless)
- **UI Components:** [Radix UI Primitives](https://www.radix-ui.com/)
- **Charts & Editor:** [Recharts](https://recharts.org/), [Lexical](https://lexical.dev/)
- **Real-time:** Socket.IO client
- **Network:** Base Sepolia testnet

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (installed with Node.js)

## Getting Started

1. Clone the repository and open the project directory:

   ```powershell
   npm install
   ```

2. Start the development server:

   ```powershell
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

The app redirects unauthenticated users to `/login` and unregistered users to `/register`.

## Available Scripts

- `npm run dev` — Start the development server on `http://localhost:3000`.
- `npm run build` — Build the production application.
- `npm run start` — Start the production server.
- `npm run lint` — Run ESLint.

## Project Structure

```text
solar-ui/
├── abis/              # Smart contract ABIs
│   └── SolarDMS.json
├── app/               # Next.js App Router pages and providers
│   ├── page.tsx       # Entry point (redirects based on auth state)
│   ├── layout.tsx
│   ├── provider.tsx   # Wagmi, Web3Auth, and React context providers
│   ├── contexts/      # React contexts for users, contracts, assignments, etc.
│   ├── components/    # Reusable UI components
│   ├── dashboard/
│   ├── new-contract/
│   ├── contract/
│   ├── approved/
│   ├── pending/
│   ├── rejected/
│   ├── esigned/
│   ├── client-contracts/
│   ├── legal-review/
│   ├── review/
│   ├── clause-assignments/
│   ├── section-assignments/
│   ├── my-contracts/
│   ├── clients/
│   ├── divisions/
│   ├── analytics/
│   ├── templates/
│   ├── pending-users/
│   ├── login/
│   └── register/
├── utils/             # Utility functions, contract config, and constants
│   ├── constants.ts
│   ├── contracts.ts
│   ├── Web3AuthConnectorInstance.ts
│   └── Web3AuthStore.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

## Smart Contract & Network Configuration

The UI is pre-configured for the Base Sepolia testnet. Contract addresses and RPC endpoints are hardcoded in the source for the current deployment:

- **SolarDMS contract:** `0x4048677f4e33361D5a3BCee9826d7f4a7104d32d`
- **TBDelegator contract:** `0xd2bB2A349354612713079A014615Fb582259261C`
- **TBSponsor contract:** `0x0d8e9E3Efa9DAD7Aa4b761c132ADF6ddEB7d16B4`
- **Network RPCs:** `https://base-sepolia.g.alchemy.com/v2/...`

These are defined in:

- `abis/SolarDMS.json` — contract ABI and address.
- `utils/constants.ts` — RPC URLs, API endpoints, roles, divisions, and contract helper addresses.
- `utils/contracts.ts` — exported `SDMSContract` config.

To use your own deployment, update the values in those files.

## Backend & IPFS

The frontend talks to a REST backend and IPFS gateway:

- **API base:** `https://api.tomeblock.com`
- **IPFS gateway:** `https://jade-wonderful-hawk-382.mypinata.cloud/ipfs/`

These endpoints are defined in `utils/constants.ts`. Replace them if you run your own backend or Pinata gateway.

## Roles & Divisions

User roles and divisions are represented on-chain as enum values:

**Roles**

- 0 — No Role
- 1 — Division Member
- 2 — Division Leader
- 3 — Legal Team
- 4 — Admin
- 5 — Client

**Divisions**

- 0 — No Division
- 1 — Legal
- 2 — Project Management
- 3 — Preconstruction
- 4 — Estimating
- 5 — Finance
- 6 — Accounting
- 7 — Risk Management
- 8 — Insurance
- 9 — Safety

## Notes

- The project currently uses Web3Auth's **Sapphire Devnet** and **email passwordless** login.
- The Web3Auth `clientId` is hardcoded in `utils/Web3AuthConnectorInstance.ts`. For a production deployment, replace it with your own Web3Auth project's client ID.
- The app uses `swcMinify` and `reactStrictMode: false` as configured in `next.config.js`.
