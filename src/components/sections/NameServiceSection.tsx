import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useEvmSendTransaction } from "../../hooks/useEvmSendTransaction";
import { useSignMessage } from "wagmi";
import {
  CHAIN_ID,
  ADDRESSES,
  DHM_TOKEN,
  EVVM_ID,
  TOKEN_SYMBOL,
  NETWORK_DISPLAY_NAME,
  TX_EXPLORER_BASE,
} from "../../config/contracts";
import { nameServiceAbi, evvmAbi } from "../../abis";
import { formatUnits, encodeFunctionData } from "viem";
import {
  buildEvvmPayMessageCoreDoc,
  buildEvvmNameServiceMessageV3,
  hashDataForPreRegistrationUsername,
  hashDataForRegistrationUsername,
} from "../../lib/evvmSign";

const PREREG_STORAGE_KEY = "digitalhealth-prereg";
interface PreregRecord {
  username: string;
  clowNumber: string;
  preregNonce: string;
  preregAt: number;
}

function loadPrereg(address: string | undefined): PreregRecord | null {
  if (!address) return null;
  try {
    const raw = localStorage.getItem(`${PREREG_STORAGE_KEY}-${address.toLowerCase()}`);
    return raw ? (JSON.parse(raw) as PreregRecord) : null;
  } catch {
    return null;
  }
}

function savePrereg(address: string, r: PreregRecord) {
  localStorage.setItem(`${PREREG_STORAGE_KEY}-${address.toLowerCase()}`, JSON.stringify(r));
}

function clearPrereg(address: string) {
  localStorage.removeItem(`${PREREG_STORAGE_KEY}-${address.toLowerCase()}`);
}

function ensureAddress(value: unknown, fallback: `0x${string}`): `0x${string}` {
  if (typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value)) return value as `0x${string}`;
  return fallback;
}

const originExecutor = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export function NameServiceSection() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [username, setUsername] = useState("");
  const [prereg, setPrereg] = useState<PreregRecord | null>(null);
  const [preRegStatus, setPreRegStatus] = useState("");
  const [regStatus, setRegStatus] = useState<React.ReactNode>("");
  const [isPreRegPending, setIsPreRegPending] = useState(false);
  const [isRegPending, setIsRegPending] = useState(false);

  useEffect(() => {
    setPrereg(loadPrereg(address));
  }, [address]);

  const { data: available, refetch: refetchAvailable } = useReadContract({
    address: ADDRESSES.nameService,
    abi: nameServiceAbi,
    functionName: "isUsernameAvailable",
    args: username ? [username] : undefined,
    chainId: CHAIN_ID,
  });

  const { data: price } = useReadContract({
    address: ADDRESSES.nameService,
    abi: nameServiceAbi,
    functionName: "getPriceOfRegistration",
    args: username ? [username] : undefined,
    chainId: CHAIN_ID,
  });

  const { data: principalToken } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "getPrincipalTokenAddress",
    chainId: CHAIN_ID,
  });

  const { data: balance } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "getBalance",
    args: address ? [address, DHM_TOKEN] : undefined,
    chainId: CHAIN_ID,
  });

  const { signMessageAsync } = useSignMessage();
  const { sendTransaction } = useEvmSendTransaction();

  const handlePreRegister = async () => {
    if (!address || chainId !== CHAIN_ID || !username || available !== true || !publicClient) return;

    setIsPreRegPending(true);
    setPreRegStatus("Pre-registering…");
    try {
      const clowNumber = BigInt(
        Math.floor(Math.random() * 0xffffffff) * 0x10000 + Math.floor(Math.random() * 0x10000)
      );
      const hashUsername = (await publicClient.readContract({
        address: ADDRESSES.nameService,
        abi: nameServiceAbi,
        functionName: "hashUsername",
        args: [username, clowNumber],
      })) as `0x${string}`;

      const nonceNameService = BigInt(
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + Math.floor(Math.random() * 0xffffffff) * 0x100000000
      );
      const hashInput = hashDataForPreRegistrationUsername(hashUsername);
      const message = buildEvvmNameServiceMessageV3(
        EVVM_ID,
        ADDRESSES.nameService,
        hashInput,
        originExecutor,
        nonceNameService
      );
      const sig = await signMessageAsync({ message });

      const principalTokenAddr = ensureAddress(principalToken, DHM_TOKEN);
      const payAsyncNonce = BigInt(1e20) + BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
      const evvmPayMessage = buildEvvmPayMessageCoreDoc(
        EVVM_ID,
        ADDRESSES.evvm,
        ADDRESSES.nameService,
        "",
        principalTokenAddr,
        0n,
        0n,
        ADDRESSES.nameService,
        payAsyncNonce,
        true
      );
      const evvmPaySig = await signMessageAsync({ message: evvmPayMessage });

      setPreRegStatus("Submitting…");
      await sendTransaction({
        to: ADDRESSES.nameService,
        data: encodeFunctionData({
          abi: nameServiceAbi,
          functionName: "preRegistrationUsername",
          args: [
            address,
            hashUsername,
            originExecutor,
            nonceNameService,
            sig as `0x${string}`,
            0n,
            payAsyncNonce,
            evvmPaySig as `0x${string}`,
          ],
        }),
      });
      savePrereg(address, {
        username,
        clowNumber: clowNumber.toString(),
        preregNonce: nonceNameService.toString(),
        preregAt: Date.now(),
      });
      setPrereg(loadPrereg(address));
      setPreRegStatus("Pre-registered! Complete registration after 30 minutes.");
      refetchAvailable?.();
    } catch (e) {
      const err = e as { message?: string; shortMessage?: string };
      setPreRegStatus(
        (err?.shortMessage ?? err?.message ?? String(e)).toLowerCase().includes("reject")
          ? "Signing cancelled."
          : `Error: ${err?.shortMessage ?? err?.message ?? String(e)}`
      );
    } finally {
      setIsPreRegPending(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!address || !prereg || principalToken == null || price == null) return;
    const regPrice = price as bigint;
    const bal = (balance as bigint) ?? 0n;
    if (bal < regPrice) {
      setRegStatus(`Insufficient balance. Need ${formatUnits(regPrice, 18)} ${TOKEN_SYMBOL}.`);
      return;
    }
    setIsRegPending(true);
    setRegStatus("Signing…");
    try {
      const clowNumber = BigInt(prereg.clowNumber);
      const nonceNameService =
        BigInt(1e20) + BigInt(Date.now()) * 10000n + BigInt(Math.floor(Math.random() * 1e9));
      const hashInput = hashDataForRegistrationUsername(prereg.username, clowNumber);
      const regMessage = buildEvvmNameServiceMessageV3(
        EVVM_ID,
        ADDRESSES.nameService,
        hashInput,
        originExecutor,
        nonceNameService
      );
      const regSig = await signMessageAsync({ message: regMessage });

      const principalAddr = ensureAddress(principalToken, DHM_TOKEN);
      let payAsyncNonce = BigInt(1e20) + BigInt(Date.now()) * 10000n + BigInt(Math.floor(Math.random() * 1e9));
      let payMessage = buildEvvmPayMessageCoreDoc(
        EVVM_ID,
        ADDRESSES.evvm,
        ADDRESSES.nameService,
        "",
        principalAddr,
        regPrice,
        0n,
        ADDRESSES.nameService,
        payAsyncNonce,
        true
      );
      let paySig = await signMessageAsync({ message: payMessage });

      if (publicClient && address) {
        for (let i = 0; i < 5; i++) {
          const [usedByUser, usedByExecutor] = await Promise.all([
            publicClient.readContract({
              address: ADDRESSES.evvm,
              abi: evvmAbi,
              functionName: "getIfUsedAsyncNonce",
              args: [address, payAsyncNonce],
            }),
            publicClient.readContract({
              address: ADDRESSES.evvm,
              abi: evvmAbi,
              functionName: "getIfUsedAsyncNonce",
              args: [ADDRESSES.nameService, payAsyncNonce],
            }),
          ]);
          if (!Boolean(usedByUser) && !Boolean(usedByExecutor)) break;
          payAsyncNonce = BigInt(1e20) + BigInt(Date.now()) * 10000n + BigInt(Math.floor(Math.random() * 1e9));
          payMessage = buildEvvmPayMessageCoreDoc(
            EVVM_ID,
            ADDRESSES.evvm,
            ADDRESSES.nameService,
            "",
            principalAddr,
            regPrice,
            0n,
            ADDRESSES.nameService,
            payAsyncNonce,
            true
          );
          paySig = await signMessageAsync({ message: payMessage });
        }
      }

      setRegStatus("Submitting…");
      const txHash = await sendTransaction({
        to: ADDRESSES.nameService,
        data: encodeFunctionData({
          abi: nameServiceAbi,
          functionName: "registrationUsername",
          args: [
            address,
            prereg.username,
            clowNumber,
            originExecutor,
            nonceNameService,
            regSig as `0x${string}`,
            0n,
            payAsyncNonce,
            paySig as `0x${string}`,
          ],
        }),
      });
      clearPrereg(address);
      setPrereg(null);
      setUsername("");
      setRegStatus(
        <>
          Username registered!{" "}
          <a href={`${TX_EXPLORER_BASE}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="wallet-link">
            View transaction on explorer
          </a>
        </>
      );
      refetchAvailable?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRegStatus(msg.toLowerCase().includes("reject") ? "Signing cancelled." : `Error: ${msg}`);
    } finally {
      setIsRegPending(false);
    }
  };

  const preregValid = prereg && prereg.username === username;
  const preregElapsed = preregValid && Date.now() - prereg.preregAt >= 30 * 60 * 1000;
  const preregRemaining = preregValid
    ? Math.max(0, Math.ceil((30 * 60 * 1000 - (Date.now() - prereg.preregAt)) / 1000))
    : 0;

  return (
    <section className="section">
      <h2>Name Service</h2>
      <p>
        Register a username on Digital Health EVVM. Pre-register (commit), wait 30 minutes, then complete registration
        (reveal). Cost is paid in {TOKEN_SYMBOL}.
      </p>
      <div className="form-row">
        <label>Username</label>
        <input type="text" placeholder="e.g. alice" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-actions">
        <button className="btn" onClick={() => refetchAvailable?.()} disabled={!username}>
          Check Availability
        </button>
      </div>
      {username && (
        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <div className="form-row">
            <label>Available</label>
            <div>
              <span className={available ? "badge badge-success" : "badge"}>
                {available === undefined ? "—" : available === true ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <div className="form-row">
            <label>Registration Price</label>
            <div>
              {price !== undefined && price !== null ? formatUnits(price as bigint, 18) : "—"} {TOKEN_SYMBOL}
            </div>
          </div>
        </div>
      )}

      {address && username && available === true && (
        <div className="form-actions" style={{ marginTop: "1.5rem" }}>
          {chainId !== CHAIN_ID ? (
            <p className="status">Switch to {NETWORK_DISPLAY_NAME} to pre-register.</p>
          ) : !preregValid ? (
            <button className="btn btn-primary" onClick={handlePreRegister} disabled={isPreRegPending}>
              {isPreRegPending ? "Pre-registering…" : "Pre-register (free)"}
            </button>
          ) : preregElapsed ? (
            <>
              {balance != null && price != null && (balance as bigint) < (price as bigint) && (
                <p className="status">
                  Add {formatUnits(price as bigint, 18)} {TOKEN_SYMBOL} to your EVVM balance (use faucet above).
                </p>
              )}
              <button
                className="btn btn-primary"
                onClick={handleCompleteRegistration}
                disabled={isRegPending || (balance != null && (balance as bigint) < (price as bigint))}
              >
                {isRegPending
                  ? "Registering…"
                  : `Complete Registration (${price != null ? formatUnits(price as bigint, 18) : "?"} ${TOKEN_SYMBOL})`}
              </button>
            </>
          ) : (
            <div className="form-row">
              <label>Pre-registered</label>
              <div>
                Complete registration in <strong>{Math.floor(preregRemaining / 60)}m {preregRemaining % 60}s</strong> (30
                min after pre-register).
              </div>
            </div>
          )}
        </div>
      )}

      {preRegStatus && <p className="status">{preRegStatus}</p>}
      {regStatus && <p className="status">{regStatus}</p>}
    </section>
  );
}
