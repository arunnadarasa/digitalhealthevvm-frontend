import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useEvmSendTransaction } from "../../hooks/useEvmSendTransaction";
import { useSignMessage } from "wagmi";
import { formatUnits, parseUnits, encodeFunctionData } from "viem";
import {
  ADDRESSES,
  DHM_TOKEN,
  CHAIN_ID,
  EVVM_ID,
  TOKEN_SYMBOL,
  NETWORK_DISPLAY_NAME,
} from "../../config/contracts";
import { evvmAbi } from "../../abis";
import { buildEvvmPayMessageCoreDoc } from "../../lib/evvmSign";
import { addActivity } from "../../lib/activityLog";

const FAUCET_AMOUNT = parseUnits("1000", 18);

export function EVVMSection() {
  const { address, chainId } = useAccount();
  const [faucetStatus, setFaucetStatus] = useState("");
  const [isFaucetPending, setIsFaucetPending] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [isTransferPending, setIsTransferPending] = useState(false);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "getBalance",
    args: address ? [address, DHM_TOKEN] : undefined,
  });

  const { data: metadata } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "getEvvmMetadata",
  });

  const { data: isStaker } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "isAddressStaker",
    args: address ? [address] : undefined,
  });

  const { data: syncNonce } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "getNextCurrentSyncNonce",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
  });

  const { sendTransaction } = useEvmSendTransaction();
  const { signMessageAsync } = useSignMessage();

  const handleFaucet = async () => {
    if (!address) return;
    setIsFaucetPending(true);
    setFaucetStatus("Requesting…");
    try {
      const txHash = await sendTransaction({
        to: ADDRESSES.evvm,
        data: encodeFunctionData({
          abi: evvmAbi,
          functionName: "addBalance",
          args: [address, DHM_TOKEN, FAUCET_AMOUNT],
        }),
      });
      await refetchBalance();
      setFaucetStatus(`Done! You received 1000 ${TOKEN_SYMBOL}.`);
      addActivity({
        kind: "dhm_faucet",
        title: `Received ${TOKEN_SYMBOL} from faucet`,
        description: `1000 ${TOKEN_SYMBOL} to ${address.slice(0, 6)}…${address.slice(-4)}`,
        txHash: txHash as string,
      });
    } catch (e) {
      setFaucetStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setIsFaucetPending(false);
    }
  };

  const handleTransfer = async () => {
    if (!address || chainId !== CHAIN_ID || syncNonce == null || !recipient || !amount) return;

    const trimmedRecipient = recipient.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmedRecipient)) {
      setTransferStatus("Invalid recipient address.");
      return;
    }

    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(amount, 18);
    } catch {
      setTransferStatus("Invalid amount.");
      return;
    }
    if (parsedAmount <= 0n) {
      setTransferStatus("Amount must be greater than 0.");
      return;
    }

    const bal = (balance as bigint) ?? 0n;
    if (bal < parsedAmount) {
      setTransferStatus(`Insufficient balance. You have ${formatUnits(bal, 18)} ${TOKEN_SYMBOL}.`);
      return;
    }

    setIsTransferPending(true);
    setTransferStatus("Signing…");
    try {
      const nonce = syncNonce as bigint;
      const payMessage = buildEvvmPayMessageCoreDoc(
        EVVM_ID,
        ADDRESSES.evvm,
        trimmedRecipient as `0x${string}`,
        "",
        DHM_TOKEN,
        parsedAmount,
        0n,
        address,
        nonce,
        false
      );
      const signature = await signMessageAsync({ message: payMessage });

      setTransferStatus("Submitting…");
      await sendTransaction({
        to: ADDRESSES.evvm,
        data: encodeFunctionData({
          abi: evvmAbi,
          functionName: "pay",
          args: [
            address,
            trimmedRecipient as `0x${string}`,
            "",
            DHM_TOKEN,
            parsedAmount,
            0n,
            address,
            nonce,
            false,
            signature as `0x${string}`,
          ],
        }),
      });

      await refetchBalance();
      setTransferStatus(`Sent ${amount} ${TOKEN_SYMBOL} to ${trimmedRecipient.slice(0, 6)}…${trimmedRecipient.slice(-4)}`);
      setRecipient("");
      setAmount("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTransferStatus(
        msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") ? "Signing cancelled." : `Error: ${msg}`
      );
    } finally {
      setIsTransferPending(false);
    }
  };

  return (
    <section className="section">
      <h2>EVVM Core</h2>
      <p>
        View your principal token balance ({TOKEN_SYMBOL}) and EVVM metadata on {NETWORK_DISPLAY_NAME}. On-chain name is
        shown below when available (deploy metadata may use &quot;Mate Token&quot; / MATE on Tempo).
      </p>
      {address && (
        <div className="grid-2">
          <div>
            <div className="form-row">
              <label>{TOKEN_SYMBOL} balance</label>
              <div>
                {balance !== undefined && balance !== null ? formatUnits(balance as bigint, 18) : "—"} {TOKEN_SYMBOL}
              </div>
            </div>
            <div className="form-row">
              <label>Staker Status</label>
              <div>
                <span className={isStaker ? "badge badge-success" : "badge"}>
                  {isStaker === true ? "Staker" : "Non‑staker"}
                </span>
              </div>
            </div>
            <div className="form-row">
              <label>Testnet Faucet</label>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleFaucet} disabled={isFaucetPending}>
                  {isFaucetPending ? "Requesting…" : `Get 1000 ${TOKEN_SYMBOL}`}
                </button>
              </div>
              {faucetStatus && <p className="status">{faucetStatus}</p>}
            </div>
          </div>
          <div>
            {metadata && typeof metadata === "object" && "EvvmName" in metadata
              ? (() => {
                  const m = metadata as unknown as {
                    EvvmName: string;
                    principalTokenSymbol: string;
                    principalTokenName: string;
                    reward: bigint;
                  };
                  return (
                    <>
                      <div className="form-row">
                        <label>EVVM Name</label>
                        <div>{m.EvvmName}</div>
                      </div>
                      <div className="form-row">
                        <label>Token</label>
                        <div>
                          {m.principalTokenSymbol} ({m.principalTokenName})
                        </div>
                      </div>
                      <div className="form-row">
                        <label>Reward / Era</label>
                        <div>
                          {formatUnits(m.reward, 18)} {TOKEN_SYMBOL}
                        </div>
                      </div>
                    </>
                  );
                })()
              : null}
          </div>
        </div>
      )}

      {address && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>Transfer {TOKEN_SYMBOL}</h3>
          <div className="form-row">
            <label>Recipient Address</label>
            <input type="text" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Amount ({TOKEN_SYMBOL})</label>
            <input type="text" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleTransfer}
              disabled={isTransferPending || chainId !== CHAIN_ID || !recipient || !amount}
            >
              {chainId !== CHAIN_ID
                ? `Switch to ${NETWORK_DISPLAY_NAME} first`
                : isTransferPending
                  ? "Sending…"
                  : `Send ${TOKEN_SYMBOL}`}
            </button>
          </div>
          {transferStatus && <p className="status">{transferStatus}</p>}
        </div>
      )}

      {!address && <p className="address">Connect wallet to view balance and metadata.</p>}
    </section>
  );
}
