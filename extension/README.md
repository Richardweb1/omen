# Omen Chrome Extension MVP

This Manifest V3 popup runs a manual, read-only Omen Pre-Action Scan for a public EVM address. It does not connect to a wallet, request private keys, sign messages, submit transactions, intercept wallet actions, use a content script, or retain scan history.

## Load Unpacked

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository's `extension` folder.
5. Pin **Omen Pre-Action Scan** from the Extensions menu.

## API Configuration

Production is the default in `config.mjs`:

```js
useLocalDev: false,
productionOrigin: "https://omen-ritual.vercel.app"
```

For local development, set `useLocalDev` to `true` and run the web app at `http://localhost:3000`.

The API rejects unapproved cross-origin requests. After loading the extension, copy its ID from `chrome://extensions` and add this server-side value to the web app environment:

```text
OMEN_EXTENSION_ORIGINS=chrome-extension://YOUR_EXTENSION_ID
```

Restart the local server after changing the environment. A hosted extension requires the same origin in the hosted environment and a new web deployment before production scans will work. Do not use a wildcard origin.

The published privacy policy is available at:

```text
https://omen-ritual.vercel.app/privacy
```

## Verify

Run the dependency-free fixture and permission checks:

```powershell
node extension/popup.test.mjs
node --check extension/popup.mjs
```

The test covers invalid-address validation, wallet presentation, contract presentation, Manifest V3 permission boundaries, and confirms the popup calls only `/api/pre-action-scan`.

## Current Boundary

- Manual public-address input only
- Ritual Chain (`1979`) only
- Read-only Omen API request
- No scan-history storage
- No wallet or page permissions
- No content script or service worker
- No signing, minting, AI call, or onchain transaction
