/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `tempo-moderato` (default) | `base-sepolia` — see `src/config/contracts.ts` */
  readonly VITE_TARGET_NETWORK?: string;
  /** Local backend for EVVM DHM MPP paywall demo (default http://localhost:8080) */
  readonly VITE_MPP_SERVER_URL?: string;
  /** Echo / PayAI USDC paywall URL (Base Sepolia) */
  readonly VITE_MPP_USDC_ECHO_URL?: string;
  /** @deprecated use VITE_MPP_SERVER_URL */
  readonly VITE_X402_SERVER_URL?: string;
  /** @deprecated use VITE_MPP_USDC_ECHO_URL */
  readonly VITE_X402_USDC_ECHO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
