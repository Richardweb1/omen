import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Omen",
  description: "Privacy policy for the Omen Pre-Action Scan browser extension.",
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <article className="privacy-shell">
        <header className="privacy-header">
          <p className="mono-kicker">OMEN PRE-ACTION SCAN</p>
          <h1>Privacy Policy</h1>
          <p className="privacy-updated">Last updated: June 22, 2026</p>
          <p>
            Omen Pre-Action Scan is a read-only browser extension for checking public Ritual Chain addresses before acting.
          </p>
        </header>

        <section className="privacy-section">
          <h2>Information the extension uses</h2>
          <p>
            When you choose to run a scan, the public address you enter is sent to Omen&apos;s read-only
            <code> /api/pre-action-scan</code> endpoint. Omen uses public chain data to return available address type,
            activity, fee, contract, and project-level signal context.
          </p>
        </section>

        <section className="privacy-section">
          <h2>What Omen does not access</h2>
          <ul>
            <li>No wallet connection or wallet permissions.</li>
            <li>No private keys, seed phrases, passwords, or signing requests.</li>
            <li>No transaction creation, interception, approval, or submission.</li>
            <li>No browsing-history or scan-history storage in the extension.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>Storage and service providers</h2>
          <p>
            Omen does not intentionally build user profiles or sell scan data. The extension does not retain scan
            history. Hosting and network providers may process standard technical request metadata, such as IP address,
            timestamp, and error logs, for security and service operation.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Public blockchain data</h2>
          <p>
            Blockchain addresses and onchain activity are public. Scan results are informational pre-action context and
            are not a guarantee, official Ritual endorsement, or formal security audit.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Contact and changes</h2>
          <p>
            Questions or issues can be submitted through the Omen project repository. Material policy changes will be
            published on this page with an updated date.
          </p>
          <a href="https://github.com/Richardweb1/omen" target="_blank" rel="noreferrer noopener">
            Open Omen on GitHub
          </a>
        </section>

        <Link className="privacy-back" href="/">
          Back to Omen
        </Link>
      </article>
    </main>
  );
}
