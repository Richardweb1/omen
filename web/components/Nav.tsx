"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import ConnectWallet from "./ConnectWallet";

const links = [
  { href: "/",        label: "Home"     },
  { href: "/builder", label: "Builder"  },
  { href: "/verdict", label: "Trust Signal"  },
  { href: "/demo",    label: "Demo Lab" },
  { href: "/domains", label: "Domains"  },
  { href: "/proofs",  label: "Proofs"   },
];

export default function Nav() {
  const path = usePathname();
  const { address, isConnected } = useAccount();

  return (
    <nav style={{
      background: "#0f0f0f",
      borderBottom: "1px solid #1a1a1a",
      padding: "0 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "60px",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "linear-gradient(135deg, #f59e0b, #7c3aed)",
            borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: "bold", color: "white",
          }}>O</div>
          <span style={{ color: "#f5f5f5", fontWeight: "600", fontSize: "16px" }}>Omen</span>
          <span style={{
            fontSize: "10px", color: "#666",
            background: "#1a1a1a", padding: "2px 6px",
            borderRadius: "4px", marginLeft: "4px",
          }}>Ritual</span>
        </div>
      </Link>

      {/* Links */}
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {links.map(({ href, label }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: active ? "600" : "400",
              color: active ? "#f59e0b" : "#999",
              background: active ? "rgba(245,158,11,0.1)" : "transparent",
              border: active ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
              transition: "all 0.15s",
            }}>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side — chain badge + wallet */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "#111", border: "1px solid #222",
          padding: "4px 10px", borderRadius: "6px",
        }}>
          <div style={{
            width: "6px", height: "6px",
            borderRadius: "50%", background: "#16a34a",
            boxShadow: "0 0 6px #16a34a",
          }}/>
          <span style={{ fontSize: "11px", color: "#666" }}>Ritual · 1979</span>
        </div>
        <ConnectWallet />
      </div>
    </nav>
  );
}
