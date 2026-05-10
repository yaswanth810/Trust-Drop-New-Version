# 🛡️ TrustDrop — Blockchain-Powered NGO Fund Transparency

> Every Rupee. Tracked. Trusted. Transparent.

TrustDrop is a decentralized platform that ensures NGO fund transparency through milestone-based fund release, multi-validator verification, and comprehensive anti-fraud systems. Built on **Polygon Amoy** with **USDC** stablecoin integration.

---

## ✨ Key Features

### 💰 Core Platform
- **Milestone-Based Fund Release** — Donations locked in smart contracts, released only when milestones are verified
- **3/5 Multi-Validator Consensus** — Independent validators must approve before funds move
- **USDC Stablecoin** — No volatility risk; donations denominated in USD
- **UPI Fiat On-Ramp** — Donate in ₹ via UPI (Transak secure session-based integration), no crypto knowledge needed
- **Donor NFT Badges** — Bronze / Silver / Gold / Platinum badges for donors
- **On-Chain Receipts** — Every donation generates a verifiable on-chain receipt

### 🔒 Anti-Fraud Systems (V3)
- **3-Document Proof Requirement** — Invoice, GPS photo, and beneficiary list required per milestone
- **Document-Based Validator Review** — Validators must review all 3 proof documents before approval is unlocked (replaces previous QR-based verification)
- **20% Seed Release** — Automatic 20% advance when campaign fully funded (50% for emergencies)
- **48-Hour Challenge Window** — Anyone can challenge a milestone approval within 48 hours
- **Market Rate Oracle** — On-chain price checking flags suspicious invoices (NORMAL / WARNING / FLAGGED)
- **GST Verification** — Invoice GST numbers validated against Indian government database
- **Emergency Mode** — 2 validator votes activate fast-track approvals for disaster response
- **Whistleblower Rewards** — Report fraud anonymously, earn 10% of locked funds if upheld

### 🌍 Localization & UX
- **Bilingual** — Full English + Telugu (తెలుగు) support
- **Dark / Light Mode** — System-aware theme switching
- **Premium Fintech UI** — Mercury-inspired design with indigo accent, clean typography, and micro-animations
- **Code Splitting** — React.lazy() for optimal load times
- **Network Safety** — Auto-detect wrong chain with one-click switch to Polygon Amoy

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Polygon Amoy Testnet (Chain ID: 80002) |
| **Smart Contracts** | Solidity 0.8.24, OpenZeppelin (ReentrancyGuard, Ownable, ERC-721) |
| **Stablecoin** | Mock USDC (6 decimals) |
| **Frontend** | React 19, Vite 8, Framer Motion |
| **Styling** | Premium CSS Design System (Instrument Serif + DM Sans + DM Mono) |
| **IPFS** | Pinata for document storage |
| **Fiat On-Ramp** | Transak Secure Widget (UPI / INR) via backend session proxy |
| **Oracle** | MarketRateOracle (custom on-chain) |
| **Charts** | Recharts |
| **Wallet** | MetaMask (ethers.js v6) |

---

## 📦 Smart Contracts

| Contract | Description |
|----------|------------|
| **TrustDrop.sol** | Main contract: campaigns, milestones, donations, anti-fraud, challenge window |
| **TrustScore.sol** | NGO reputation tracking (on-chain trust score) |
| **TrustDropNFT.sol** | Donor badge NFTs (ERC-721) — Bronze/Silver/Gold/Platinum tiers |
| **MarketRateOracle.sol** | Market rate reference for invoice fraud detection |

### Deployed Addresses (Polygon Amoy)

| Contract | Address |
|----------|---------|
| **TrustDrop** | `0xEe993650Aa439206D2ec0725413AfE3B9e74b37C` |
| **TrustScore** | `0x1cfC9f1830C6468Bb60B04D4a8F5624311d89fa6` |
| **TrustDropNFT** | `0xa757964991729cb41D4fa1fB662d5022b13F524a` |
| **MarketRateOracle** | `0x7253c9b6E4f7Fd2B1fb9F0480890E3dE4605b70F` |
| **Mock USDC** | `0x8B0180f2101c8260d49339abfEe87927412494B4` |

> All contracts verified on [Sourcify](https://sourcify.dev/) and viewable on [Polygon Amoy Explorer](https://amoy.polygonscan.com).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Polygon Amoy testnet MATIC (from [faucet](https://faucet.polygon.technology/))

### Setup
```bash
# Clone and install
git clone https://github.com/yaswanth810/Trust-Drop-New-Version.git
cd Trust-Drop-New-Version
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your contract addresses and Transak keys

# Start development server
npm run dev
```

### Deploy Contracts (via Remix)
1. Open [Remix IDE](https://remix.ethereum.org/)
2. Import contracts from `contracts/` folder
3. Compile with Solidity 0.8.24+
4. Deploy in order:
   - **TrustScore.sol** → no constructor args
   - **TrustDropNFT.sol** → no constructor args
   - **MarketRateOracle.sol** → no constructor args
   - **TrustDrop.sol** → pass TrustScore & NFT addresses as constructor args
5. Transfer ownership of TrustScore & TrustDropNFT to the TrustDrop contract address
6. Update `.env` with deployed addresses

### MetaMask Setup
1. Open MetaMask → Settings → Networks → Add Network
2. **Network Name:** Polygon Amoy
3. **RPC URL:** `https://rpc-amoy.polygon.technology`
4. **Chain ID:** `80002`
5. **Currency:** MATIC
6. **Explorer:** `https://amoy.polygonscan.com`

---

## 🎯 Demo Walkthrough

### As a Donor 🧑‍💻
1. Connect MetaMask → Switch to Polygon Amoy
2. Browse campaigns on Home page (emergency campaigns pinned to top)
3. Click a campaign → View milestone progress
4. Donate via **UPI** (₹) or **Crypto** (USDC) tab
5. Track your donations on **My Donations** page (accessible from navbar)
6. Earn NFT badges based on cumulative donation amount

### As an NGO 🏢
1. Create Campaign → Set milestones with descriptions, amounts, and deadlines
2. When milestone is complete → Submit 3-Doc Proof (Invoice + GPS Photo + Beneficiary List)
3. System auto-checks: Market rate oracle + GST verification
4. Wait for 3 validator approvals → Funds released after 48h challenge window

### As a Validator ✅
1. Register as Validator (stake 0.01 MATIC)
2. Review pending milestones on Validator Dashboard
3. **View all 3 documents** — Invoice, GPS Photo, and Beneficiary List (must review all before approval button unlocks)
4. See price check badges and GST verification status
5. Approve milestone → Funds scheduled for release after challenge window

### Report Fraud 🚨
1. Navigate to Report Fraud page
2. Select campaign + milestone + reason
3. Upload evidence to IPFS → Pay 0.001 MATIC anti-spam stake
4. Track report status on My Reports page
5. If upheld: campaign frozen + reporter receives 10% reward

---

## 📁 Project Structure
```
Trust-Drop/
├── contracts/                # Solidity smart contracts
│   ├── TrustDrop.sol         # Main contract (V3 with anti-fraud)
│   ├── TrustScore.sol        # NGO reputation system
│   ├── TrustDropNFT.sol      # Donor badge NFTs (ERC-721)
│   └── MarketRateOracle.sol  # Price fraud detection oracle
├── plugins/
│   └── transak-proxy.js      # Vite server middleware for Transak API
├── scripts/
│   ├── deploy.js             # Deployment script
│   └── seedDemoData.js       # Demo data seeding
├── src/
│   ├── abi/                  # Contract ABIs (human-readable + JSON)
│   ├── components/           # Reusable UI components
│   │   ├── ActivityFeed.jsx  # Real-time on-chain event feed
│   │   ├── BadgeShowcase.jsx # NFT badge display grid
│   │   ├── CampaignCard.jsx  # Campaign display card
│   │   ├── DonateModal.jsx   # Crypto + UPI donation modal
│   │   ├── HeroSection.jsx   # Premium landing hero
│   │   ├── MilestoneTracker.jsx  # Visual milestone stepper
│   │   ├── Navbar.jsx        # Responsive navigation
│   │   ├── Footer.jsx        # Site footer
│   │   ├── NetworkBanner.jsx # Wrong-chain detector
│   │   ├── OnChainReceipt.jsx # Transaction receipt card
│   │   ├── QRGenerator.jsx   # Beneficiary QR code generator
│   │   ├── TransakWidget.jsx # UPI fiat on-ramp (secure session)
│   │   ├── TrustScoreBadge.jsx # Circular trust score gauge
│   │   └── ValidatorPanel.jsx # Validator 3-doc review panel
│   ├── context/              # React contexts
│   │   ├── Web3Context.jsx   # Wallet & contract state
│   │   └── ThemeContext.jsx  # Dark/light mode
│   ├── pages/                # Route pages
│   │   ├── Home.jsx          # Campaign listing + stats
│   │   ├── CampaignDetail.jsx # Campaign detail + donate + proof
│   │   ├── CreateCampaign.jsx # Campaign creation form
│   │   ├── ValidatorDashboard.jsx # Validator review panel
│   │   ├── Analytics.jsx     # Platform analytics + charts
│   │   ├── MyDonations.jsx   # Donor history + receipts + badges
│   │   ├── Whistleblower.jsx # Fraud reporting
│   │   ├── MyReports.jsx     # Report tracking
│   │   ├── Confirm.jsx       # Beneficiary confirmation (bilingual)
│   │   └── NgoProfile.jsx    # NGO trust score profile
│   ├── utils/                # Helpers & utilities
│   │   ├── contract.js       # Smart contract interactions
│   │   ├── helpers.js        # Formatting & USDC utils
│   │   ├── oracle.js         # Market rate & GST verification
│   │   └── ipfs.js           # Pinata IPFS upload
│   ├── locales/              # i18n translations
│   │   ├── en.json           # English
│   │   └── te.json           # Telugu (తెలుగు)
│   ├── App.jsx               # Router + lazy loading
│   └── index.css             # Premium design system (v3)
├── plugins/
│   └── transak-proxy.js      # Secure Transak session proxy
└── vite.config.js            # Vite build configuration
```

---

## 🔐 Security Features

- **ReentrancyGuard** — All fund transfer functions protected
- **Ownable Access Control** — Admin operations restricted to contract owner
- **Challenge Window** — 48-hour cooling period before fund release
- **Anti-Spam Staking** — Validators stake 0.01 MATIC, fraud reporters stake 0.001 MATIC
- **On-Chain Verification** — All proofs, votes, and confirmations recorded immutably
- **Market Rate Oracle** — Automated invoice cost validation against category benchmarks
- **Secure Transak Integration** — API secret kept server-side via Vite middleware proxy

---

## 🎨 Design System

TrustDrop uses a premium fintech-grade design system inspired by Mercury:

- **Typography**: Instrument Serif (headings), DM Sans (body), DM Mono (code/amounts)
- **Color Palette**: Indigo (#6C5CE7) accent, cool white backgrounds, rich black text
- **Components**: Card-based layouts, semantic badges, animated progress bars
- **Themes**: Light-first with full dark mode support
- **Animations**: Framer Motion micro-interactions, smooth page transitions

---

## 🔗 Links

- **GitHub:** [github.com/yaswanth810/Trust-Drop-New-Version](https://github.com/yaswanth810/Trust-Drop-New-Version)
- **Polygon Amoy Explorer:** [amoy.polygonscan.com](https://amoy.polygonscan.com)
- **IPFS Gateway:** [gateway.pinata.cloud](https://gateway.pinata.cloud)
- **Transak:** [transak.com](https://transak.com)

---

## 👥 Team

Built for Hackathon 2026 — Vizag, India 🇮🇳

## 🤝 Contributors

<a href="https://github.com/balu061128">
  <img src="https://github.com/balu061128.png" width="60" height="60" style="border-radius:50%" alt="balu061128"/>
  <br />
  <sub><b>balu061128</b></sub>
</a>

---

## 📝 License

MIT © 2026 TrustDrop Team
