export const JUDGMENT_ADDRESS = "0xc32a1e26e77664753b4A54a4312dF0a8159147D0" as const;
export const REGISTRY_ADDRESS = "0xCbB34EB8651dc8f1d65a20165C1166C13f626620" as const;
export const AGENT_AWARE_ADDRESS = "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295" as const;

export const JUDGMENT_ABI = [
  {
    name: "submitSignal",
    type: "function",
    inputs: [
      { name: "subject",    type: "address" },
      { name: "domain",     type: "string"  },
      { name: "merkleRoot", type: "bytes32" },
      { name: "startBlock", type: "uint256" },
      { name: "endBlock",   type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "evaluateDeterministic",
    type: "function",
    inputs: [
      { name: "subject",   type: "address"   },
      { name: "domain",    type: "string"    },
      { name: "features",  type: "uint256[]" },
      { name: "reasoning", type: "string"    },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const REGISTRY_ABI = [
  {
    name: "readVerdict",
    type: "function",
    inputs: [
      { name: "subject", type: "address" },
      { name: "domain", type: "string" },
    ],
    outputs: [
      { name: "verdict", type: "uint8" },
      { name: "timestamp", type: "uint256" },
      { name: "isSealed", type: "bool" },
      { name: "isRevoked", type: "bool" },
      { name: "isFresh", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    name: "previewHandshake",
    type: "function",
    inputs: [
      { name: "subject", type: "address" },
      { name: "domain", type: "string" },
      { name: "action", type: "string" },
    ],
    outputs: [
      { name: "allowed", type: "bool" },
      { name: "reason", type: "string" },
    ],
    stateMutability: "view",
  },
] as const;
