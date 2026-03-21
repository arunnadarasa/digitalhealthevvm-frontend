import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useEvmSendTransaction } from "../../hooks/useEvmSendTransaction";
import { useSignMessage } from "wagmi";
import { formatUnits, encodeFunctionData } from "viem";
import { ADDRESSES, CHAIN_ID, DHM_TOKEN, EVVM_ID, TOKEN_SYMBOL } from "../../config/contracts";
import { stakingAbi, evvmAbi } from "../../abis";
import {
  buildEvvmStakingMessageV3,
  buildEvvmPayMessageCoreDoc,
  hashDataForPublicStake,
} from "../../lib/evvmSign";

const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export function StakingSection() {
  const { address, chainId } = useAccount();
  const [amount, setAmount] = useState("");
  const [stakeStatus, setStakeStatus] = useState("");
  const [isStakingTx, setIsStakingTx] = useState(false);

  const { data: stakedAmount, refetch: refetchStaked } = useReadContract({
    address: ADDRESSES.staking,
    abi: stakingAbi,
    functionName: "getUserAmountStaked",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
  });

  const { data: stakePrice } = useReadContract({
    address: ADDRESSES.staking,
    abi: stakingAbi,
    functionName: "priceOfStaking",
    chainId: CHAIN_ID,
  });

  const { data: allowPublic } = useReadContract({
    address: ADDRESSES.staking,
    abi: stakingAbi,
    functionName: "getAllowPublicStaking",
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

  const publicStakingEnabled =
    allowPublic && typeof allowPublic === "object" && "flag" in allowPublic && (allowPublic as { flag: boolean }).flag;
  const price = (stakePrice as bigint) ?? 0n;
  const amountNum = amount.trim()
    ? (() => {
        try {
          const n = parseFloat(amount.trim());
          return Number.isFinite(n) && n >= 0 ? BigInt(Math.floor(n)) : 0n;
        } catch {
          return 0n;
        }
      })()
    : 0n;
  const costForStake = price * amountNum;
  const hasBalance = ((balance as bigint) ?? 0n) >= costForStake;
  const staked = (stakedAmount as bigint) ?? 0n;
  const canUnstake = amountNum > 0n && amountNum <= staked;

  const handleStake = async () => {
    if (!address || chainId !== CHAIN_ID || principalToken == null || price === 0n || amountNum === 0n) return;
    if (!hasBalance) {
      setStakeStatus(`Insufficient balance. Need ${formatUnits(costForStake, 18)} ${TOKEN_SYMBOL}.`);
      return;
    }
    setIsStakingTx(true);
    setStakeStatus("Signing…");
    try {
      const nonce = BigInt(Date.now());
      const stakingHashInput = hashDataForPublicStake(true, amountNum);
      const stakingMessage = buildEvvmStakingMessageV3(
        EVVM_ID,
        ADDRESSES.staking,
        stakingHashInput,
        zeroAddress,
        nonce
      );
      const sig = await signMessageAsync({ message: stakingMessage });

      const payAsyncNonce = BigInt(1e20) + BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
      const principalTokenAddr = (principalToken as `0x${string}`) ?? DHM_TOKEN;
      const payMessage = buildEvvmPayMessageCoreDoc(
        EVVM_ID,
        ADDRESSES.evvm,
        ADDRESSES.staking,
        "",
        principalTokenAddr,
        costForStake,
        0n,
        ADDRESSES.staking,
        payAsyncNonce,
        true
      );
      const paySig = await signMessageAsync({ message: payMessage });

      setStakeStatus("Submitting…");
      await sendTransaction({
        to: ADDRESSES.staking,
        data: encodeFunctionData({
          abi: stakingAbi,
          functionName: "publicStaking",
          args: [
            address,
            true,
            amountNum,
            zeroAddress,
            nonce,
            sig as `0x${string}`,
            0n,
            payAsyncNonce,
            paySig as `0x${string}`,
          ],
        }),
      });
      setStakeStatus("Staked!");
      setAmount("");
      await refetchStaked();
    } catch (e) {
      const err = e as { message?: string; shortMessage?: string };
      const msg = err?.shortMessage ?? err?.message ?? String(e);
      setStakeStatus(
        msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") ? "Signing cancelled." : `Error: ${msg}`
      );
    } finally {
      setIsStakingTx(false);
    }
  };

  const handleUnstake = async () => {
    if (!address || chainId !== CHAIN_ID || amountNum === 0n) return;
    if (!canUnstake) {
      setStakeStatus(`Cannot unstake more than ${formatUnits(staked, 18)} ${TOKEN_SYMBOL}.`);
      return;
    }
    setIsStakingTx(true);
    setStakeStatus("Signing…");
    try {
      const nonce = BigInt(Date.now());
      const stakingHashInput = hashDataForPublicStake(false, amountNum);
      const stakingMessage = buildEvvmStakingMessageV3(
        EVVM_ID,
        ADDRESSES.staking,
        stakingHashInput,
        address,
        nonce
      );
      const sig = await signMessageAsync({ message: stakingMessage });

      setStakeStatus("Submitting…");
      await sendTransaction({
        to: ADDRESSES.staking,
        data: encodeFunctionData({
          abi: stakingAbi,
          functionName: "publicStaking",
          args: [
            address,
            false,
            amountNum,
            address,
            nonce,
            sig as `0x${string}`,
            0n,
            0n,
            "0x" as `0x${string}`,
          ],
        }),
      });
      setStakeStatus("Unstaked!");
      setAmount("");
      await refetchStaked();
    } catch (e) {
      const err = e as { message?: string; shortMessage?: string };
      const msg = err?.shortMessage ?? err?.message ?? String(e);
      setStakeStatus(
        msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") ? "Signing cancelled." : `Error: ${msg}`
      );
    } finally {
      setIsStakingTx(false);
    }
  };

  return (
    <section className="section">
      <h2>Staking</h2>
      <p>
        Stake {TOKEN_SYMBOL} (Digital Health MATE) to participate in the EVVM ecosystem. You need {TOKEN_SYMBOL} in your
        EVVM balance (use the faucet above). Staking cost: {stakePrice != null ? formatUnits(price, 18) : "—"} {TOKEN_SYMBOL}{" "}
        per unit.
      </p>
      {address && (
        <>
          <div className="grid-2">
            <div className="form-row">
              <label>Your Staked Amount</label>
              <div>
                {stakedAmount !== undefined && stakedAmount !== null
                  ? formatUnits(stakedAmount as bigint, 18)
                  : "—"}{" "}
                {TOKEN_SYMBOL}
              </div>
            </div>
            <div className="form-row">
              <label>Staking Price (min)</label>
              <div>
                {stakePrice !== undefined && stakePrice !== null ? formatUnits(stakePrice as bigint, 18) : "—"} {TOKEN_SYMBOL}
              </div>
            </div>
          </div>
          <div className="form-row">
            <label>Amount (staking units)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1"
              disabled={isStakingTx}
            />
          </div>
          {amountNum > 0n && (
            <p className="small">
              {hasBalance ? (
                <>Cost to stake: {formatUnits(costForStake, 18)} {TOKEN_SYMBOL}</>
              ) : (
                <>Insufficient balance. Need {formatUnits(costForStake, 18)} {TOKEN_SYMBOL}.</>
              )}
            </p>
          )}
          {!publicStakingEnabled && (
            <p className="status" style={{ color: "#fbbf24" }}>
              Public staking may be disabled. Transactions may fail.
            </p>
          )}
          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleStake}
              disabled={!amountNum || !hasBalance || isStakingTx}
            >
              {isStakingTx ? stakeStatus : "Stake"}
            </button>
            <button className="btn" onClick={handleUnstake} disabled={!canUnstake || isStakingTx}>
              Unstake
            </button>
          </div>
          {stakeStatus && !isStakingTx && <p className="status">{stakeStatus}</p>}
        </>
      )}
      {!address && <p className="address">Connect wallet to view and stake.</p>}
    </section>
  );
}
