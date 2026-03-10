import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

function buildEvvmMessageV3(
  evvmId: bigint,
  serviceAddress: `0x${string}`,
  hashInput: string,
  originExecutor: `0x${string}`,
  nonce: bigint,
  isAsyncExec: boolean = true
): string {
  return [
    evvmId.toString(),
    serviceAddress.toLowerCase(),
    hashInput,
    originExecutor.toLowerCase(),
    nonce.toString(),
    isAsyncExec ? "true" : "false",
  ].join(",");
}

export function hashDataForPayCore(
  toAddress: `0x${string}`,
  toIdentity: string,
  token: `0x${string}`,
  amount: bigint,
  priorityFee: bigint
): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters("string, address, string, address, uint256, uint256"),
    ["pay", toAddress, toIdentity, token, amount, priorityFee]
  );
  return keccak256(encoded) as `0x${string}`;
}

export function buildEvvmPayMessageCoreDoc(
  evvmId: bigint,
  coreAddress: `0x${string}`,
  toAddress: `0x${string}`,
  toIdentity: string,
  token: `0x${string}`,
  amount: bigint,
  priorityFee: bigint,
  executor: `0x${string}`,
  nonce: bigint,
  isAsyncExec: boolean
): string {
  const hashPayload = hashDataForPayCore(toAddress, toIdentity, token, amount, priorityFee);
  return buildEvvmMessageV3(evvmId, coreAddress, hashPayload, executor, nonce, isAsyncExec);
}

export function buildEvvmStakingMessageV3(
  evvmId: bigint,
  serviceAddress: `0x${string}`,
  hashInput: string,
  originExecutor: `0x${string}`,
  nonce: bigint,
  isAsyncExec: boolean = true
): string {
  return buildEvvmMessageV3(evvmId, serviceAddress, hashInput, originExecutor, nonce, isAsyncExec);
}

export function hashDataForPublicStake(isStaking: boolean, amountOfStaking: bigint): string {
  const encoded = encodeAbiParameters(
    parseAbiParameters("string, bool, uint256"),
    ["publicStaking", isStaking, amountOfStaking]
  );
  return keccak256(encoded);
}

export function hashDataForPreRegistrationUsername(hashUsername: `0x${string}`): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters("string, bytes32"),
    ["preRegistrationUsername", hashUsername]
  );
  return keccak256(encoded) as `0x${string}`;
}

export function hashDataForRegistrationUsername(username: string, lockNumber: bigint): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters("string, string, uint256"),
    ["registrationUsername", username, lockNumber]
  );
  return keccak256(encoded) as `0x${string}`;
}

export function buildEvvmNameServiceMessageV3(
  evvmId: bigint,
  serviceAddress: `0x${string}`,
  hashInput: `0x${string}`,
  originExecutor: `0x${string}`,
  nonce: bigint
): string {
  return buildEvvmMessageV3(evvmId, serviceAddress, hashInput, originExecutor, nonce, true);
}
