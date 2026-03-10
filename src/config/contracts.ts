// Digital Health EVVM — deployed on Base Sepolia (2026-03-10)
export const CHAIN_ID = 84532; // Base Sepolia
export const EVVM_ID = 1143n;
export const DHM_TOKEN = "0x0000000000000000000000000000000000000001" as `0x${string}`;

export const ADDRESSES = {
  evvm: "0xfE6Ad61c4d93366c79a1406bfE8838A11cF53734" as const,
  staking: "0x69033E3912C62911846Dc18CB7cFf832FF1b8065" as const,
  nameService: "0x72b01f41883C933db8CB69c60ed4a36fe5fb4A11" as const,
  treasury: "0x81250D5e3fAbc8811c181B32A293144Cd4459b1b" as const,
  estimator: "0x3f74916f4B0DE0AA3C1156D7810E175ebfBdF3e5" as const,
  p2pSwap: "0xE72634662FCD079DBdf9561f715ff5099EDE2B88" as const,
};

/** x402 DHM server base URL (local or Fly.io). */
export const X402_SERVER_URL =
  (import.meta.env.VITE_X402_SERVER_URL as string | undefined) || "http://localhost:8080";

/** Base Sepolia USDC used by PayAI Echo. */
export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`;

/** x402 USDC PayAI Echo endpoint for Base Sepolia. */
export const X402_USDC_ECHO_URL =
  (import.meta.env.VITE_X402_USDC_ECHO_URL as string | undefined) ||
  "https://x402.payai.network/api/base-sepolia/paid-content";
