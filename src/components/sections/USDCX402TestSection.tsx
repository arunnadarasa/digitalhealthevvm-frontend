import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { USDC_BASE_SEPOLIA, X402_USDC_ECHO_URL } from "../../config/contracts";
import { addActivity } from "../../lib/activityLog";

type PaymentRequirement = {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: {
    name?: string;
    version?: string;
    [key: string]: unknown;
  };
};

type PaymentRequired = {
  x402Version: number;
  error: string;
  resource?: {
    url: string;
    description: string;
    mimeType?: string;
  };
  accepts: PaymentRequirement[];
  extensions?: Record<string, unknown>;
};

const CHAIN_ID = 84532; // Base Sepolia

export function USDCX402TestSection() {
  const { address, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [status, setStatus] = useState("");
  const [echoBody, setEchoBody] = useState<string>("");
  const [requirement, setRequirement] = useState<PaymentRequirement | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const fetchPaidContent = async () => {
    setStatus("Fetching…");
    setEchoBody("");
    setRequirement(null);
    setPaymentResponse(null);
    setIsLoading(true);
    try {
      const res = await fetch(X402_USDC_ECHO_URL);

      // Prefer PAYMENT-REQUIRED header (base64 JSON). Fall back to JSON body.
      const header = res.headers.get("PAYMENT-REQUIRED");
      let paymentRequired: PaymentRequired | null = null;
      if (header) {
        const json = atob(header);
        paymentRequired = JSON.parse(json) as PaymentRequired;
        setEchoBody(JSON.stringify(paymentRequired, null, 2));
      } else {
        const body = (await res.json()) as unknown;
        setEchoBody(JSON.stringify(body, null, 2));
        if (typeof body === "object" && body && "accepts" in (body as any)) {
          paymentRequired = body as PaymentRequired;
        }
      }

      if (res.status === 402 && paymentRequired) {
        const req =
          paymentRequired.accepts.find(
            (a) =>
              a.asset?.toLowerCase() === USDC_BASE_SEPOLIA.toLowerCase() ||
              a.extra?.name?.toUpperCase() === "USDC",
          ) ?? paymentRequired.accepts[0];
        if (req) {
          setRequirement(req);
          setStatus("402 Payment Required from PayAI Echo – ready to sign USDC payment.");
        } else {
          setStatus("402 from Echo, but no USDC option found.");
        }
      } else if (res.ok) {
        setStatus("Echo endpoint returned 200 – content already paid / not paywalled.");
      } else {
        setStatus(`Echo request failed: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      setStatus(`Error contacting Echo: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUSDC = async () => {
    if (!address) {
      setStatus("Connect your wallet first.");
      return;
    }
    if (chainId !== CHAIN_ID) {
      setStatus("Switch wallet to Base Sepolia.");
      return;
    }
    if (!requirement) {
      setStatus("No USDC payment requirement available.");
      return;
    }

    setIsSigning(true);
    setStatus("Signing and sending USDC x402 payment to Echo…");
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const validAfter = 0n;
      const validBefore = BigInt(nowSec + 300);
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce =
        "0x" +
        Array.from(nonceBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      const domain = {
        name: requirement.extra?.name ?? "USDC",
        version: requirement.extra?.version ?? "2",
        chainId: CHAIN_ID,
        verifyingContract: requirement.asset as `0x${string}`,
      };

      const types = {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      } as const;

      const message = {
        from: address!,
        to: requirement.payTo as `0x${string}`,
        value: requirement.amount,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      };

      const sig = await signTypedDataAsync({
        domain,
        types,
        primaryType: "TransferWithAuthorization",
        message,
      } as any);

      const paymentPayload = {
        x402Version: 2,
        scheme: requirement.scheme,
        network: requirement.network,
        accepted: {
          scheme: requirement.scheme,
          network: requirement.network,
          amount: requirement.amount,
          asset: requirement.asset,
          payTo: requirement.payTo,
          maxTimeoutSeconds: requirement.maxTimeoutSeconds,
          ...(requirement.extra ? { extra: requirement.extra } : {}),
        },
        payload: {
          signature: sig,
          authorization: message,
        },
        extensions: {},
      };

      const paymentSignature = btoa(JSON.stringify(paymentPayload));

      const res = await fetch(X402_USDC_ECHO_URL, {
        method: "GET",
        headers: {
          "PAYMENT-SIGNATURE": paymentSignature,
        },
      });

      const body = await res.json().catch(() => ({}));

      const paymentResponseHeader =
        res.headers.get("PAYMENT-RESPONSE") ?? res.headers.get("X-PAYMENT-RESPONSE");
      let decodedPaymentResponse: any | null = null;
      if (paymentResponseHeader) {
        try {
          decodedPaymentResponse = JSON.parse(atob(paymentResponseHeader));
        } catch {
          decodedPaymentResponse = null;
        }
      }

      setPaymentResponse(decodedPaymentResponse);
      setEchoBody(JSON.stringify(body, null, 2));

      if (!res.ok) {
        setStatus(
          `Echo payment failed: ${res.status} ${
            (body && (body as any).error) || res.statusText
          }`,
        );
        return;
      }

      const txHash =
        decodedPaymentResponse && typeof decodedPaymentResponse === "object"
          ? (decodedPaymentResponse.transaction as string | undefined)
          : undefined;

      setStatus("USDC x402 payment completed via Echo.");
      addActivity({
        kind: "usdc_x402",
        title: "USDC x402 payment",
        description: "Paid USDC via x402 to Echo merchant (refunded by Echo).",
        txHash,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(
        msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")
          ? "Signing cancelled."
          : `Error signing: ${msg}`,
      );
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <section className="section">
      <h2>Test PayAI Echo (USDC on Base Sepolia)</h2>
      <p>
        This calls the PayAI x402 Echo endpoint for Base Sepolia. If the content is paywalled, the server should return
        a 402 with USDC payment options and an EIP‑712 typed data payload to sign.
      </p>
      <p className="address" style={{ marginBottom: "0.5rem" }}>
        Echo endpoint: <code>{X402_USDC_ECHO_URL}</code>
      </p>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={fetchPaidContent} disabled={isLoading}>
          {isLoading ? "Contacting Echo…" : "Request paid content from Echo"}
        </button>
      </div>
      {status && <p className="status">{status}</p>}

      {requirement && (
        <div style={{ marginTop: "1rem" }}>
          <h3>USDC payment option</h3>
          <p>
            Token: <code>{requirement.asset ?? USDC_BASE_SEPOLIA}</code>
          </p>
          <p>
            Amount: <code>{requirement.amount}</code> {requirement.extra?.name ?? "USDC"}
          </p>
          <p>
            Pay to: <code>{requirement.payTo}</code>
          </p>
        </div>
      )}

      {requirement && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Step 2 – sign & send USDC payment</h3>
          <p>
            This builds an EIP‑3009 <code>transferWithAuthorization</code> for USDC on Base Sepolia, signs it via
            EIP‑712, and sends it back to Echo in a <code>PAYMENT-SIGNATURE</code> header.
          </p>
          <button className="btn btn-primary" onClick={handleSignUSDC} disabled={isSigning}>
            {isSigning ? "Processing…" : "Pay with USDC via x402"}
          </button>
        </div>
      )}

      {paymentResponse && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Payment response</h3>
          <pre style={{ marginTop: "0.5rem", maxHeight: "200px", overflow: "auto" }}>
            {JSON.stringify(paymentResponse, null, 2)}
          </pre>
          <p>
            Echo automatically refunds tokens and covers gas, but this shows the full x402 USDC flow your Agents would
            use for real merchants.
          </p>
        </div>
      )}

      {echoBody && (
        <details style={{ marginTop: "1rem" }}>
          <summary>Raw Echo 402 / response body</summary>
          <pre style={{ marginTop: "0.5rem", maxHeight: "300px", overflow: "auto" }}>{echoBody}</pre>
        </details>
      )}

      {!address && (
        <p className="address">Connect your wallet on Base Sepolia to sign the USDC payment typed data.</p>
      )}
    </section>
  );
}
