export const evvmAbi = [
  {
    type: "function",
    name: "getBalance",
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getEvvmID",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getEvvmMetadata",
    inputs: [],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "EvvmName", type: "string" },
          { name: "EvvmID", type: "uint256" },
          { name: "principalTokenName", type: "string" },
          { name: "principalTokenSymbol", type: "string" },
          { name: "principalTokenAddress", type: "address" },
          { name: "totalSupply", type: "uint256" },
          { name: "eraTokens", type: "uint256" },
          { name: "reward", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getPrincipalTokenAddress",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "isAddressStaker",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "addBalance",
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getNextCurrentSyncNonce",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getIfUsedAsyncNonce",
    inputs: [
      { name: "user", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "asyncNonceStatus",
    inputs: [
      { name: "user", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
    outputs: [{ type: "bytes1" }],
  },
  {
    type: "function",
    name: "pay",
    inputs: [
      { name: "from", type: "address" },
      { name: "to_address", type: "address" },
      { name: "to_identity", type: "string" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "priorityFee", type: "uint256" },
      { name: "senderExecutor", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "isAsyncExec", type: "bool" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const nameServiceAbi = [
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "PreRegistrationNotValid", inputs: [] },
  { type: "error", name: "InvalidUsername", inputs: [] },
  { type: "error", name: "UsernameAlreadyRegistered", inputs: [] },
  { type: "function", name: "getEvvmID", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "isUsernameAvailable", inputs: [{ name: "_username", type: "string" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "getOwnerOfIdentity", inputs: [{ name: "_username", type: "string" }], outputs: [{ type: "address" }] },
  { type: "function", name: "getPriceOfRegistration", inputs: [{ name: "username", type: "string" }], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "hashUsername",
    inputs: [
      { name: "_username", type: "string" },
      { name: "_randomNumber", type: "uint256" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "preRegistrationUsername",
    inputs: [
      { name: "user", type: "address" },
      { name: "hashPreRegisteredUsername", type: "bytes32" },
      { name: "originExecutor", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
      { name: "priorityFeePay", type: "uint256" },
      { name: "noncePay", type: "uint256" },
      { name: "signaturePay", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "registrationUsername",
    inputs: [
      { name: "user", type: "address" },
      { name: "username", type: "string" },
      { name: "lockNumber", type: "uint256" },
      { name: "originExecutor", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
      { name: "priorityFeePay", type: "uint256" },
      { name: "noncePay", type: "uint256" },
      { name: "signaturePay", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const stakingAbi = [
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "PublicStakingDisabled", inputs: [] },
  { type: "function", name: "getEvvmID", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getCoreAddress", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "getUserAmountStaked", inputs: [{ name: "_account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "priceOfStaking", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "getAllowPublicStaking",
    inputs: [],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "flag", type: "bool" },
          { name: "timeToAccept", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "publicStaking",
    inputs: [
      { name: "user", type: "address" },
      { name: "isStaking", type: "bool" },
      { name: "amountOfStaking", type: "uint256" },
      { name: "originExecutor", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
      { name: "priorityFeePay", type: "uint256" },
      { name: "noncePay", type: "uint256" },
      { name: "signaturePay", type: "bytes" },
    ],
    outputs: [],
  },
] as const;
