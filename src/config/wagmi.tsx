import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { baseSepolia } from "viem/chains";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});
