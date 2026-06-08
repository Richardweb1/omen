"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectWallet from "@/components/ConnectWallet";

const links = [
  { href: "/", label: "Home" },
  { href: "/builder", label: "Builder" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="omen-nav" aria-label="Main navigation">
      <Link href="/" className="brand-lockup">
        <span className="brand-mark">o</span>
        <span className="brand-text">omen</span>
      </Link>

      <div className="nav-links">
        {links.map(({ href, label }) => {
          const active = path === href;
          const className = active ? "nav-link active" : "nav-link";

          return (
            <Link key={href} href={href} className={className}>
              {label}
            </Link>
          );
        })}
      </div>

      <div className="nav-right">
        <div className="network-pill">
          <span className="live-dot online" />
          Ritual · 1979
        </div>
        <ConnectWallet />
      </div>
    </nav>
  );
}
