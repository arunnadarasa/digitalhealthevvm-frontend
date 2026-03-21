import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/wagmi";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { EVVMSection } from "./components/sections/EVVMSection";
import { NameServiceSection } from "./components/sections/NameServiceSection";
import { StakingSection } from "./components/sections/StakingSection";
import { ExplainerSection } from "./components/sections/ExplainerSection";
import { MppDhmTestSection } from "./components/sections/MppDhmTestSection";
import { MppUsdcTestSection } from "./components/sections/MppUsdcTestSection";
import { RecentTransactionsSection } from "./components/sections/RecentTransactionsSection";
import "./App.css";
import { NETWORK_DISPLAY_NAME, TARGET_NETWORK } from "./config/contracts";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <div className="app">
            <Header />
            <main className="main">
              <p className="hackathon-intro">
                {TARGET_NETWORK === "tempo-moderato" ? (
                  <>
                    EVVM UI for <strong>{NETWORK_DISPLAY_NAME}</strong> (Tempo testnet). Principal token label:{" "}
                    <strong>MATE</strong> (Mate Token) per deploy metadata — use the faucet in EVVM Core to fund tests.
                  </>
                ) : (
                  <>
                    This is a starter template for participants of the{" "}
                    <a
                      href="https://clinicalhackathon.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wallet-link"
                    >
                      OpenClaw Clinical Hackathon
                    </a>{" "}
                    to explore nanopayments using digital currencies between different OpenClaw Agents.
                  </>
                )}
              </p>
              <p className="disclaimer">
                This is an educational prototype and is not affiliated with or endorsed by any healthcare provider or
                government body.
              </p>
              <ExplainerSection />
              <MppUsdcTestSection />
              <MppDhmTestSection />
              <RecentTransactionsSection />
              <EVVMSection />
              <NameServiceSection />
              <StakingSection />
            </main>
          </div>
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
