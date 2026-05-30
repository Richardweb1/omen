export const JUDGMENT_ADDRESS = "0xc32a1e26e77664753b4A54a4312dF0a8159147D0" as const;
export const REGISTRY_ADDRESS = "0xCbB34EB8651dc8f1d65a20165C1166C13f626620" as const;

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
