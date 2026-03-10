# Digital Health EVVM — Frontend

An OpenClaw framework for clinical agentic engineering. This app connects to your **Digital Health EVVM** on **Base Sepolia** (EVVM ID: 1143) and uses the **Digital Health MATE (DHM)** token.

## Disclaimer

This is an educational prototype and is not affiliated with or endorsed by any healthcare provider or government body.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Connect a wallet on **Base Sepolia** and use:

- **EVVM Core** — View DHM balance, request testnet DHM (faucet), transfer DHM
- **Name Service** — Check username availability, pre-register, complete registration (30 min delay)
- **Staking** — Stake and unstake DHM

## Build

```bash
npm run build
npm run preview   # serve dist/
```

## Contracts (Base Sepolia)

- Core: `0xfE6Ad61c4d93366c79a1406bfE8838A11cF53734`
- Staking: `0x69033E3912C62911846Dc18CB7cFf832FF1b8065`
- NameService: `0x72b01f41883C933db8CB69c60ed4a36fe5fb4A11`
- Treasury: `0x81250D5e3fAbc8811c181B32A293144Cd4459b1b`
- P2PSwap: `0xE72634662FCD079DBdf9561f715ff5099EDE2B88`
