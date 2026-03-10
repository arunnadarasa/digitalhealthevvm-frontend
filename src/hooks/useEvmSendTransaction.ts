import { useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";

interface SendTxParams {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

export function useEvmSendTransaction() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const sendTransaction = useCallback(
    async (params: SendTxParams): Promise<`0x${string}`> => {
      if (!walletClient) throw new Error("Wallet not connected");

      const txHash = await walletClient.sendTransaction({
        to: params.to,
        data: params.data,
        ...(params.value != null && { value: params.value }),
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status === "reverted") {
          const err = new Error("Transaction reverted on-chain");
          (err as unknown as { txHash: `0x${string}` }).txHash = txHash;
          throw err;
        }
      }
      return txHash;
    },
    [walletClient, publicClient]
  );

  return { sendTransaction };
}
