# Omen Chrome Web Store Listing

## Product details

**Name**

Omen Pre-Action Scan

**Short description**

Scan Ritual wallets and contracts for balance, activity, fees, and Omen context before acting.

**Detailed description**

Omen Pre-Action Scan gives users and agents a quick, read-only view of a public Ritual Chain address before they act.

Enter a public address to see whether it is a wallet or smart contract, available Ritual balance and activity context, transaction-fee history when indexed, and project-level Omen signal context.

The extension is intentionally narrow and read-only. It does not connect to your wallet, request private keys, sign messages, submit transactions, intercept wallet actions, or store scan history.

Scan results are informational pre-action context. They are not a guarantee, official Ritual endorsement, or formal security audit.

**Single purpose**

Run a read-only pre-action scan for a user-entered public Ritual Chain address.

**Category**

Developer Tools

**Homepage**

https://omen-ritual.vercel.app

**Privacy policy**

https://omen-ritual.vercel.app/privacy

## Permission justification

- `permissions`: none.
- Host access is limited to `https://omen-ritual.vercel.app/*` so the popup can call Omen's read-only scan API.
- No wallet, tabs, activeTab, scripting, storage, content-script, background-worker, or clipboard permission is requested.

## Privacy disclosure notes

- User-provided data: a public blockchain address entered by the user.
- Purpose: return the requested public-chain scan result.
- The extension does not retain scan history.
- Data is not sold or used for advertising.
- Standard hosting/network request metadata may be processed for security and operations.

## Branding safety

Do not describe Omen as official Ritual software, an official Ritual endorsement, a guarantee of safety, or a formal audit.
