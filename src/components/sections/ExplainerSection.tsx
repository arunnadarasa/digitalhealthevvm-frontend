import { TARGET_NETWORK } from "../../config/contracts";
import { TEMPO_MODERATO_FEE_TOKENS } from "../../config/tempoStablecoins";

export function ExplainerSection() {
  return (
    <section className="section">
      <h2>How the payments work</h2>
      <p>
        Most participants in the OpenClaw Clinical Hackathon are not blockchain engineers. This section explains the two
        payment rails in simple language so you can focus on building useful Clinical Agents.
      </p>
      {TARGET_NETWORK === "tempo-moderato" && (
        <div className="tempo-fee-callout">
          <h3>Tempo Moderato: fee stablecoins (not ETH)</h3>
          <p>
            On chain <strong>42431</strong>, transaction fees are paid in USD stablecoins (<strong>6 decimals</strong>),
            not native ETH. The testnet commonly uses four fee tokens; the public faucet often tops up all of them:
          </p>
          <table className="tempo-fee-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {TEMPO_MODERATO_FEE_TOKENS.map((t) => (
                <tr key={t.address}>
                  <td>{t.name}</td>
                  <td>
                    <code className="mono-addr">{t.address}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small">
            PathUSD matches <code>viem/tempo</code> <code>Addresses.pathUsd</code>. See{" "}
            <a href="https://docs.tempo.xyz" target="_blank" rel="noopener noreferrer">
              docs.tempo.xyz
            </a>{" "}
            for faucets and network details.
          </p>
        </div>
      )}
      <div className="grid-2">
        <div>
          <h3>1. Paying with USDC via MPP-style HTTP (Echo)</h3>
          <p>
            Imagine a website that says, &quot;to see this MRI report, please pay a small fee&quot;. The server replies
            with HTTP <strong>402 Payment Required</strong> and payment instructions (the same pattern used for{" "}
            <strong>MPP</strong> — Machine Payments Protocol — on Tempo; see{" "}
            <a href="https://mpp.dev" target="_blank" rel="noopener noreferrer">
              mpp.dev
            </a>
            ).
          </p>
          <p>
            An Agent (or your browser) reads that response, prepares a USDC payment (EIP‑3009{" "}
            <code>transferWithAuthorization</code>), asks your wallet to sign, and re-sends the request with proof. Once
            the server accepts payment, it returns the content.
          </p>
          <p>
            In this template, that flow uses USDC on Base Sepolia and the Echo demo endpoint — stablecoin lives outside
            EVVM and uses normal EVM tooling.
          </p>
        </div>
        <div>
          <h3>2. Paying with DHM via EVVM Core (MPP-aligned paywall)</h3>
          <p>
            Digital Health MATE (DHM) lives inside EVVM Core. For paywalled APIs, your backend can return 402 and an EVVM
            payment option; the client signs an EVVM <code>pay()</code> message instead of EIP‑3009.
          </p>
          <ul>
            <li>
              <strong>Async nonces</strong>: each signed payment has a unique number so it can only be used once,
              stopping replays.
            </li>
            <li>
              <strong>Executors / fishers</strong>: a helper address can submit your signed payment on-chain and take a
              small fee.
            </li>
          </ul>
          <p>
            On <strong>Tempo</strong>, the same pay-for-HTTP story often uses the <code>mppx</code> client and wallet
            bundles (see the DanceTempo reference app). Here on Base Sepolia we keep the EVVM signature path so the
            hackathon template stays wallet-light.
          </p>
        </div>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>How to think about this as a builder</h3>
        <ul>
          <li>
            <strong>Lovable / no‑code developers</strong>: treat the MPP backend like a smart paywall — handle &quot;I
            got a 402, let my Agent pay, then show the result&quot;.
          </li>
          <li>
            <strong>OpenClaw Agents</strong>: plan the payment, request a wallet signature, and call the API again with
            proof of payment.
          </li>
          <li>
            <strong>Clinical teams</strong>: think in terms of &quot;MRI Agent&quot; or &quot;Equipment Agent&quot; that
            receives tiny DHM payments for access or scheduling — without learning Solidity.
          </li>
        </ul>
        <p>
          Two rails: <strong>USDC + HTTP payment</strong> (Echo demo), and <strong>DHM + EVVM</strong> — mix them in
          agent workflows depending on who pays.
        </p>
      </div>
    </section>
  );
}
