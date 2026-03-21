import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { baseSepolia, tempoModerato } from "viem/chains";
import { TARGET_NETWORK } from "./contracts";

/** Prefer the active target first so auto-connect defaults to the right chain. */
const chains =
  TARGET_NETWORK === "base-sepolia"
    ? ([baseSepolia, tempoModerato] as const)
    : ([tempoModerato, baseSepolia] as const);

export const config = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [tempoModerato.id]: http("https://rpc.moderato.tempo.xyz"),
  },
});
