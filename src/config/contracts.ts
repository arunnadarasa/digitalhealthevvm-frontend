/**
 * Target chain: set `VITE_TARGET_NETWORK` in `.env` (see `.env.example`).
 * - `tempo-moderato` — EVVM on Tempo Moderato (42431), matches `EVVM Tempo` deploy / BaseInputs.sol
 * - `base-sepolia` — original Digital Health demo on Base Sepolia
 */
export type TargetNetwork = "base-sepolia" | "tempo-moderato";

const env = import.meta.env.VITE_TARGET_NETWORK as string | undefined;
export const TARGET_NETWORK: TargetNetwork =
  env === "base-sepolia" ? "base-sepolia" : "tempo-moderato";

// --- Base Sepolia (84532) — Digital Health MATE demo ---------------------------------

const BASE_SEPOLIA = {
  CHAIN_ID: 84532 as const,
  EVVM_ID: 1143n,
  /** Principal token in Core metadata (placeholder address). */
  DHM_TOKEN: "0x0000000000000000000000000000000000000001" as `0x${string}`,
  ADDRESSES: {
    evvm: "0xfE6Ad61c4d93366c79a1406bfE8838A11cF53734",
    staking: "0x69033E3912C62911846Dc18CB7cFf832FF1b8065",
    nameService: "0x72b01f41883C933db8CB69c60ed4a36fe5fb4A11",
    treasury: "0x81250D5e3fAbc8811c181B32A293144Cd4459b1b",
    estimator: "0x3f74916f4B0DE0AA3C1156D7810E175ebfBdF3e5",
    p2pSwap: "0xE72634662FCD079DBdf9561f715ff5099EDE2B88",
  } as const,
  TOKEN_SYMBOL: "DHM",
  NETWORK_DISPLAY_NAME: "Base Sepolia",
  TX_EXPLORER_BASE: "https://sepolia.basescan.org",
} as const;

// --- Tempo Moderato (42431) — EVVM Tempo testnet deploy ------------------------------

/** Matches `input/BaseInputs.sol` EvvmMetadata + Deploy.s.sol broadcast (chain 42431). */
const TEMPO_MODERATO = {
  CHAIN_ID: 42431 as const,
  /** Registry ID unset until registered on Sepolia; use 0 for signing. */
  EVVM_ID: 0n,
  DHM_TOKEN: "0x0000000000000000000000000000000000000001" as `0x${string}`,
  ADDRESSES: {
    evvm: "0xd43072d851e15cd96d54374b95f2c5ea91ff959c",
    staking: "0xd75d635b61925574e4d43f82daffd002a37b3197",
    nameService: "0xcd2d3b3cb5cc5997dbdc8677418d97d70bddeee0",
    treasury: "0x5dd43e0543939bc4987e066dee73dda77a8e0b5f",
    estimator: "0x0c941b85519d95552cccf1a2f1d0bd6905093733",
    p2pSwap: "0x0979328cb08ae6ba375b8f31c9dd6d23db041eb0",
  } as const,
  /** On-chain metadata uses Mate Token / MATE (see BaseInputs.sol). */
  TOKEN_SYMBOL: "MATE",
  NETWORK_DISPLAY_NAME: "Tempo Moderato",
  TX_EXPLORER_BASE: "https://explore.moderato.tempo.xyz",
} as const;

export const CHAIN_ID =
  TARGET_NETWORK === "base-sepolia" ? BASE_SEPOLIA.CHAIN_ID : TEMPO_MODERATO.CHAIN_ID;
export const EVVM_ID =
  TARGET_NETWORK === "base-sepolia" ? BASE_SEPOLIA.EVVM_ID : TEMPO_MODERATO.EVVM_ID;
export const DHM_TOKEN =
  TARGET_NETWORK === "base-sepolia" ? BASE_SEPOLIA.DHM_TOKEN : TEMPO_MODERATO.DHM_TOKEN;
export const ADDRESSES =
  TARGET_NETWORK === "base-sepolia" ? BASE_SEPOLIA.ADDRESSES : TEMPO_MODERATO.ADDRESSES;
export const TOKEN_SYMBOL =
  TARGET_NETWORK === "base-sepolia" ? BASE_SEPOLIA.TOKEN_SYMBOL : TEMPO_MODERATO.TOKEN_SYMBOL;
export const NETWORK_DISPLAY_NAME =
  TARGET_NETWORK === "base-sepolia"
    ? BASE_SEPOLIA.NETWORK_DISPLAY_NAME
    : TEMPO_MODERATO.NETWORK_DISPLAY_NAME;
export const TX_EXPLORER_BASE =
  TARGET_NETWORK === "base-sepolia"
    ? BASE_SEPOLIA.TX_EXPLORER_BASE
    : TEMPO_MODERATO.TX_EXPLORER_BASE;

export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`;

/**
 * MPP-style HTTP payment demos (Base Sepolia). Aligns with Machine Payments Protocol on Tempo; reference:
 * DanceTempo (`mppx`, OpenAPI at `/openapi.json`, `docs/MPPSCAN_DISCOVERY.md` in your Tempo repo checkout).
 * Legacy: `VITE_X402_SERVER_URL` / `VITE_X402_USDC_ECHO_URL` still work if the new vars are unset.
 */
export const MPP_SERVER_URL =
  (import.meta.env.VITE_MPP_SERVER_URL as string | undefined) ||
  (import.meta.env.VITE_X402_SERVER_URL as string | undefined) ||
  "http://localhost:8080";

export const MPP_USDC_ECHO_URL =
  (import.meta.env.VITE_MPP_USDC_ECHO_URL as string | undefined) ||
  (import.meta.env.VITE_X402_USDC_ECHO_URL as string | undefined) ||
  "https://x402.payai.network/api/base-sepolia/paid-content";
