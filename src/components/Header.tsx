import { useState, useEffect } from "react";
import { useAccount, useBalance, useChainId, useSwitchChain, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits } from "viem";
import { baseSepolia, tempoModerato } from "viem/chains";
import { CHAIN_ID, NETWORK_DISPLAY_NAME } from "../config/contracts";
import { TEMPO_MODERATO_FEE_TOKENS, TEMPO_MODERATO_FEE_DECIMALS } from "../config/tempoStablecoins";

type ChainUi = { name: string; explorer: string; faucet: string; nativeDecimals: number; nativeLabel: string };

const CHAIN_CONFIG: Record<number, ChainUi> = {
  [baseSepolia.id]: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    faucet: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
    nativeDecimals: 18,
    nativeLabel: "ETH",
  },
  [tempoModerato.id]: {
    name: "Tempo Moderato",
    explorer: "https://explore.moderato.tempo.xyz",
    faucet: "https://docs.tempo.xyz",
    nativeDecimals: 6,
    nativeLabel: "USD",
  },
};

export function Header() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: ethBalance } = useBalance({ address });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (!isConnected || chainId === undefined || chainId === CHAIN_ID) return;
    switchChainAsync({ chainId: CHAIN_ID }).catch(() => {});
  }, [isConnected, chainId, switchChainAsync]);

  const chainConfig = CHAIN_CONFIG[chainId] ?? CHAIN_CONFIG[CHAIN_ID];

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSwitchChain = async () => {
    setIsSwitching(true);
    try {
      await switchChainAsync({ chainId: CHAIN_ID });
    } finally {
      setIsSwitching(false);
    }
  };

  const nativeDisplay =
    ethBalance?.value !== undefined && chainConfig
      ? `${parseFloat(formatUnits(ethBalance.value, chainConfig.nativeDecimals)).toFixed(4)} ${chainConfig.nativeLabel}`
      : `— ${chainConfig?.nativeLabel ?? "—"}`;

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">Digital Health EVVM</h1>
        <div className="wallet">
          {isConnected && address ? (
            <div className="wallet-connected">
              {chainId !== CHAIN_ID && (
                <button
                  type="button"
                  className="btn btn-chain"
                  onClick={handleSwitchChain}
                  disabled={isSwitching}
                  title={`Switch to ${NETWORK_DISPLAY_NAME}`}
                >
                  {isSwitching ? "…" : "Switch Chain"}
                </button>
              )}
              {chainId === CHAIN_ID && (
                <span className="btn btn-chain" style={{ cursor: "default" }}>
                  {chainConfig.name}
                </span>
              )}
              <div className="wallet-balance-row">
                <span
                  className="eth-balance"
                  title={
                    chainId === tempoModerato.id
                      ? `Wallet-reported balance for the active fee token (${TEMPO_MODERATO_FEE_DECIMALS} decimals)`
                      : `Native balance on ${chainConfig.name}`
                  }
                >
                  {nativeDisplay}
                </span>
                <a href={chainConfig.faucet} target="_blank" rel="noopener noreferrer" className="faucet-link" title="Faucet / docs">
                  Faucet
                </a>
              </div>
              {chainId === tempoModerato.id && (
                <p className="tempo-fee-tokens-hint" title="Tempo Moderato testnet fee stablecoins">
                  Fees: {TEMPO_MODERATO_FEE_TOKENS.map((t) => t.symbol).join(" · ")} · {TEMPO_MODERATO_FEE_DECIMALS}{" "}
                  decimals
                </p>
              )}
              <a
                href={`${chainConfig.explorer}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wallet-addr wallet-link"
                title="View on explorer"
              >
                {address.slice(0, 6)}…{address.slice(-4)}
              </a>
              <button className="btn btn-copy" onClick={copyAddress} title="Copy address">
                {copied ? "Copied!" : "Copy"}
              </button>
              <button className="btn" onClick={() => disconnect()}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => connect({ connector: injected() })}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
