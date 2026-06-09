"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-address">
          <span className="live-dot online" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button className="wallet-disconnect" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button className="wallet-button" onClick={() => connect({ connector: injected() })}>
      Connect
    </button>
  );
}
