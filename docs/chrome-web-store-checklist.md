# Chrome Web Store Submission Checklist

## Package

- Confirm `extension/manifest.json` uses the intended version.
- Run `powershell -ExecutionPolicy Bypass -File scripts/packageExtension.ps1`.
- Upload `store-assets/omen-pre-action-scan-v0.1.2.zip`.
- Confirm the ZIP root contains `manifest.json` directly.

## Listing

- Paste the copy from `docs/chrome-web-store-listing.md`.
- Upload the 128px icon from `extension/icons/icon-128.png`.
- Add honest screenshots of the real popup at its initial state and after a successful wallet/contract scan.
- Use `https://omen-ritual.vercel.app` as the homepage.
- Use `https://omen-ritual.vercel.app/privacy` as the privacy policy URL.

## Privacy and permissions

- Confirm no wallet permission is requested.
- Confirm no content script, background worker, or storage permission exists.
- Explain the single production host permission as API access for user-triggered scans.
- Complete the data-use disclosure using the policy and listing notes.

## Production readiness

- Deploy the privacy page before submitting.
- Test the production scan API from the final extension build.
- Ensure `OMEN_EXTENSION_ORIGINS` includes the final extension origin.
- Verify wallet and smart-contract scans.
- Submit for review only after the listing preview matches the extension behavior.
