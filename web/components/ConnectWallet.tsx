"use client";
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect }              = useConnect();
  const { disconnect }           = useDisconnect();
  const [mounted, setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <button style={{
      background: "linear-gradient(135deg, #f59e0b, #d97706)",
      color: "#0a0a0a", padding: "6px 14px",
      borderRadius: "6px", fontWeight: "600",
      fontSize: "12px", border: "none", cursor: "pointer",
    }}>
      Connect Wallet
    </button>
  );

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          background: "#111", border: "1px solid #222",
          borderRadius: "6px", padding: "4px 10px",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#16a34a", boxShadow: "0 0 6px #16a34a",
          }}/>
          <span style={{ fontSize: "12px", color: "#f5f5f5", fontFamily: "monospace" }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          style={{
            background: "transparent", border: "1px solid #333",
            borderRadius: "6px", padding: "4px 10px",
            fontSize: "11px", color: "#666", cursor: "pointer",
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      style={{
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        color: "#0a0a0a", padding: "6px 14px",
        borderRadius: "6px", fontWeight: "600",
        fontSize: "12px", border: "none", cursor: "pointer",
      }}
    >
      Connect Wallet
    </button>
  );
}
