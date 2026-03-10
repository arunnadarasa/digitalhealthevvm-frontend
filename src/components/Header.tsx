import { useState, useEffect } from "react";
import { useAccount, useBalance, useChainId, useSwitchChain, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatEther } from "viem";
import { CHAIN_ID } from "../config/contracts";

const CHAIN_CONFIG: Record<number, { name: string; explorer: string; faucet: string }> = {
  [CHAIN_ID]: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    faucet: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
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
                  title="Switch to Base Sepolia"
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
                <span className="eth-balance" title="Base Sepolia ETH">
                  {ethBalance?.value !== undefined ? `${parseFloat(formatEther(ethBalance.value)).toFixed(4)} ETH` : "— ETH"}
                </span>
                <a href={chainConfig.faucet} target="_blank" rel="noopener noreferrer" className="faucet-link" title="Get Base Sepolia ETH">
                  Faucet
                </a>
              </div>
              <a
                href={`${chainConfig.explorer}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wallet-addr wallet-link"
                title="View on Basescan"
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
