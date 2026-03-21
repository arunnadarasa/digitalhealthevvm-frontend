import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { MPP_SERVER_URL, TARGET_NETWORK } from "../../config/contracts";
import { buildEvvmPayMessageCoreDoc } from "../../lib/evvmSign";
import type { Hex } from "viem";
import { addActivity } from "../../lib/activityLog";

type PaymentOption = {
  id: string;
  type: string;
  chainId: number;
  evvmId: string;
  coreAddress: string;
  token: string;
  to?: string;
  suggestedNonce?: string;
  amount: string;
  priorityFee: string;
  executor: string | null;
  isAsyncExec: boolean;
  uiHint?: string;
};

type PaymentRequiredBody = {
  resource: string;
  description: string;
  to?: string;
  suggestedNonce?: string;
  options: PaymentOption[];
};

const DEMO_AMOUNT_READABLE = "0.1";

/** EVVM DHM paywall demo (HTTP 402 + EVVM signature). Aligned with Tempo MPP / pay-for-HTTP patterns (DanceTempo reference: `mppx`, OpenAPI discovery). */
export function MppDhmTestSection() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [fetchStatus, setFetchStatus] = useState("");
  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);
  const [payStatus, setPayStatus] = useState("");
  const [unlockedContent, setUnlockedContent] = useState<{ title: string; body: string } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const CHAIN_ID = 84532; // Base Sepolia

  const handleFetchProtected = async () => {
    setPaymentOption(null);
    setUnlockedContent(null);
    setPayStatus("");
    setFetchStatus("Fetching…");
    setIsFetching(true);
    try {
      const res = await fetch(`${MPP_SERVER_URL}/clinical/mri-slot`);
      const paymentRequired = res.headers.get("PAYMENT-REQUIRED") === "1" || res.status === 402;

      if (paymentRequired && res.status === 402) {
        const body = (await res.json()) as PaymentRequiredBody;
        const opt = body.options?.find((o) => o.type === "evvm_pay" || o.id === "dhm-evvm") ?? body.options?.[0];
        if (opt) {
          setPaymentOption(opt as PaymentOption);
          setFetchStatus(`402 Payment Required — pay ${DEMO_AMOUNT_READABLE} DHM to unlock (MPP-style resource).`);
        } else {
          setFetchStatus("402 but no DHM option in response.");
        }
      } else if (res.ok) {
        const data = await res.json();
        setUnlockedContent(data.content ?? null);
        setFetchStatus("Resource already unlocked.");
      } else {
        setFetchStatus(`Request failed: ${res.status} ${res.statusText}. Is the MPP backend running at ${MPP_SERVER_URL}?`);
      }
    } catch (e) {
      setFetchStatus(
        `Error: ${e instanceof Error ? e.message : String(e)}. Is the server running at ${MPP_SERVER_URL}?`
      );
    } finally {
      setIsFetching(false);
    }
  };

  const handlePayWithDHM = async () => {
    if (!address || !paymentOption) return;
    if (chainId !== CHAIN_ID) {
      setPayStatus("Switch to Base Sepolia first.");
      return;
    }

    const to = paymentOption.to as Hex | undefined;
    if (!to) {
      setPayStatus("Server did not return a recipient (to).");
      return;
    }

    const amount = BigInt(paymentOption.amount);
    const priorityFee = BigInt(paymentOption.priorityFee || "0");
    const nonce = BigInt(paymentOption.suggestedNonce ?? Date.now());
    const executor = (paymentOption.executor as Hex) ?? ("0x0000000000000000000000000000000000000000" as Hex);
    const coreAddress = paymentOption.coreAddress as Hex;
    const token = paymentOption.token as Hex;

    setIsPaying(true);
    setPayStatus("Sign the EVVM pay() message in your wallet…");
    try {
      const payMessage = buildEvvmPayMessageCoreDoc(
        BigInt(paymentOption.evvmId),
        coreAddress,
        to,
        "",
        token,
        amount,
        priorityFee,
        executor,
        nonce,
        paymentOption.isAsyncExec ?? true
      );
      const signature = await signMessageAsync({ message: payMessage });
      if (!signature) throw new Error("No signature returned");

      setPayStatus("Submitting payment to server…");
      const res = await fetch(`${MPP_SERVER_URL}/payments/evvm/dhm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: address,
          to,
          toIdentity: "",
          token,
          amount: paymentOption.amount,
          priorityFee: paymentOption.priorityFee ?? "0",
          executor,
          nonce: paymentOption.suggestedNonce ?? nonce.toString(),
          isAsyncExec: paymentOption.isAsyncExec ?? true,
          signature: signature as string,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayStatus(data.error || `Payment failed: ${res.status}`);
        return;
      }
      setUnlockedContent(data.content ?? null);
      setPayStatus(`Paid. Tx: ${data.txHash ?? "—"}`);
      setPaymentOption(null);
      addActivity({
        kind: "dhm_mpp",
        title: "DHM MPP payment",
        description: `Paid ${DEMO_AMOUNT_READABLE} DHM to unlock MRI slot`,
        txHash: (data.txHash as string | undefined) ?? undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPayStatus(
        msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") ? "Signing cancelled." : `Error: ${msg}`
      );
    } finally {
      setIsPaying(false);
    }
  };

  if (TARGET_NETWORK !== "base-sepolia") {
    return (
      <section className="section">
        <h2>MPP (DHM / EVVM)</h2>
        <p>
          This DHM paywall demo targets Base Sepolia. Set <code>VITE_TARGET_NETWORK=base-sepolia</code> in <code>.env</code>{" "}
          and rebuild. For live Tempo MPP + <code>mppx</code>, use the DanceTempo reference app (same repo as your Tempo
          checkout).
        </p>
      </section>
    );
  }

  return (
    <section className="section">
      <h2>MPP — EVVM DHM paywall</h2>
      <p>
        Request a protected resource from your local backend. The server returns HTTP 402; you pay with DHM via EVVM{" "}
        <code>pay()</code> (async nonce + executor). Same pay-for-HTTP idea as{" "}
        <a href="https://mpp.dev" target="_blank" rel="noopener noreferrer">
          MPP
        </a>{" "}
        on Tempo — this stack uses EVVM signatures instead of <code>mppx</code> wallet bundles.
      </p>
      <p className="address" style={{ marginBottom: "0.5rem" }}>
        Backend: <code>{MPP_SERVER_URL}</code> (<code>VITE_MPP_SERVER_URL</code>)
      </p>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleFetchProtected} disabled={isFetching}>
          {isFetching ? "Fetching…" : "Fetch protected resource (MRI slot)"}
        </button>
      </div>
      {fetchStatus && <p className="status">{fetchStatus}</p>}

      {paymentOption && address && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Pay with DHM</h3>
          <p>
            {DEMO_AMOUNT_READABLE} DHM → {paymentOption.to?.slice(0, 6)}…{paymentOption.to?.slice(-4)}
          </p>
          <button className="btn btn-primary" onClick={handlePayWithDHM} disabled={isPaying || chainId !== CHAIN_ID}>
            {chainId !== CHAIN_ID
              ? "Switch to Base Sepolia"
              : isPaying
                ? "Paying…"
                : `Pay ${DEMO_AMOUNT_READABLE} DHM`}
          </button>
          {payStatus && <p className="status">{payStatus}</p>}
        </div>
      )}

      {unlockedContent && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <h3>{unlockedContent.title}</h3>
          <p>{unlockedContent.body}</p>
        </div>
      )}

      {!address && (
        <p className="address">Connect your wallet (Base Sepolia) and ensure you have some DHM to run the test.</p>
      )}
    </section>
  );
}
