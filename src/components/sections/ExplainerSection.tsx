export function ExplainerSection() {
  return (
    <section className="section">
      <h2>How the payments work</h2>
      <p>
        Most participants in the OpenClaw Clinical Hackathon are not blockchain engineers. This section explains the
        two payment rails in simple language so you can focus on building useful Clinical Agents.
      </p>
      <div className="grid-2">
        <div>
          <h3>1. Paying with USDC via x402 (PayAI style)</h3>
          <p>
            Imagine a website that says, &quot;to see this MRI report, please pay a small fee&quot;. Instead of showing
            a credit card form, the server replies with a special &quot;402 Payment Required&quot; response.
          </p>
          <p>
            An Agent (or your browser) reads that 402 response, prepares a USDC payment, asks your wallet to sign, and
            then re-sends the request with the signature. Once the server sees that you have paid, it returns the real
            content.
          </p>
          <p>
            In this template, that flow is reserved for USDC and PayAI-style Echo merchants, where USDC lives outside
            of EVVM and uses normal EVM payment tools.
          </p>
        </div>
        <div>
          <h3>2. Paying with DHM via EVVM Core (gasless-style)</h3>
          <p>
            Digital Health MATE (DHM) lives inside EVVM Core on Base Sepolia. Here, you don&apos;t need special token
            extensions like EIP‑3009. Instead, EVVM has two built-in ideas:
          </p>
          <ul>
            <li>
              <strong>Async nonces</strong>: each signed payment has a unique number so it can only be used once,
              stopping replays.
            </li>
            <li>
              <strong>Executors / fishers</strong>: a &quot;helper&quot; address submits your signed payment on-chain
              and can be rewarded with a small fee.
            </li>
          </ul>
          <p>
            For the hackathon, that means an OpenClaw Agent can ask you to sign an EVVM <code>pay()</code> message
            (DHM from you to an Equipment or MRI Agent). A backend server or trusted executor then submits it on-chain,
            and once confirmed, your Agent gets access to the protected clinical resource.
          </p>
        </div>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>How to think about this as a builder</h3>
        <ul>
          <li>
            <strong>Lovable / no‑code developers</strong>: treat the x402 server like a &quot;smart paywall&quot;.
            Your UI just needs to handle &quot;I got a 402, let my Agent pay, then show the result&quot;.
          </li>
          <li>
            <strong>OpenClaw Agents</strong>: your agent plans the payment, calls the wallet for a signature, and calls
            the 402 server again with proof of payment.
          </li>
          <li>
            <strong>Clinical teams</strong>: think in terms of &quot;MRI Agent&quot; or &quot;Equipment Agent&quot; that
            can receive tiny DHM payments for access, scheduling or data sharing – without needing to learn Solidity.
          </li>
        </ul>
        <p>
          The important idea: you get two clear rails – USDC + x402, and DHM + EVVM – and you can mix and match them in
          your agent workflows depending on who is paying for what.
        </p>
      </div>
    </section>
  );
}
