"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, Maximize2, X } from "lucide-react";

type TrustReceiptGiftCardProps = {
  tokenId?: string;
  txHash: string;
  explorerLink: string;
  status: string;
  subject: string;
  domain: string;
  freshAtMint: boolean;
  outgoingTxCount?: number;
};

const WIDTH = 1680;
const HEIGHT = 945;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function shortAddress(value: string, start = 8, end = 6) {
  if (!value || value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function trustRecordLabel(status: string) {
  if (status === "REVOKED") return "Revoked";
  return "Found";
}

function recordAgeLabel(status: string, freshAtMint: boolean) {
  if (status === "LAPSED") return "Old";
  return freshAtMint ? "Current" : "Old";
}

function receiptSvg(data: TrustReceiptGiftCardProps) {
  const outgoingTxCountLabel =
    typeof data.outgoingTxCount === "number" && Number.isFinite(data.outgoingTxCount) ? `${data.outgoingTxCount.toLocaleString()} outgoing txs` : "";
  const details = [
    ["Omen Trust Receipt", data.tokenId ? `#${data.tokenId}` : "Token ID pending"],
    ["Subject address", shortAddress(data.subject)],
    ["Receipt status", "Minted"],
    ["Trust record", trustRecordLabel(data.status)],
    ["Record age", recordAgeLabel(data.status, data.freshAtMint)],
    ["Network", "Ritual Chain"],
    ["Chain ID", "1979"],
    ["Source", "OmenRegistry"],
    ...(outgoingTxCountLabel ? [["Activity summary", outgoingTxCountLabel]] : []),
  ];
  const detailRowHeight = details.length > 8 ? 43 : 49;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="aura" cx="78%" cy="44%" r="46%">
      <stop offset="0%" stop-color="#66ff9b" stop-opacity="0.46"/>
      <stop offset="45%" stop-color="#147a45" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#020805" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b2518"/>
      <stop offset="62%" stop-color="#06110c"/>
      <stop offset="100%" stop-color="#020504"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#36d77a" stop-opacity="0"/>
      <stop offset="50%" stop-color="#95ffba" stop-opacity="1"/>
      <stop offset="100%" stop-color="#36d77a" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="2.8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M72 0H0v72" fill="none" stroke="#2bd675" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#020504"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#panel)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#aura)"/>

  <g fill="none" stroke="#4ff08d" opacity="0.74">
    <path d="M42 42h1540l38 38v770l-38 38H42V42Z" stroke-width="2"/>
    <path d="M72 72h1488l26 26v724l-26 26H72V72Z" stroke-width="1.4" opacity="0.46"/>
    <path d="M42 42l24 24M1582 42l-24 24M42 888l24-24M1582 888l-24-24" stroke-width="3"/>
  </g>

  <g opacity="0.13" transform="translate(900 120) rotate(45)">
    <rect x="0" y="0" width="140" height="140" fill="#74ff9a"/>
    <rect x="210" y="10" width="230" height="230" fill="#74ff9a"/>
    <rect x="60" y="270" width="270" height="270" fill="#74ff9a"/>
    <rect x="420" y="255" width="160" height="160" fill="#74ff9a"/>
  </g>

  <g transform="translate(676 64)">
    <text x="108" y="42" fill="#f6fff8" font-family="Arial, sans-serif" font-size="42" font-weight="800" letter-spacing="14">OMEN</text>
    <text x="78" y="78" fill="#96ffba" font-family="Georgia, serif" font-size="19" letter-spacing="7">TRUST RECEIPT GIFT</text>
    <path d="M0 44h74M326 44h74" stroke="url(#line)" stroke-width="2"/>
    <circle cx="74" cy="44" r="5" fill="#9fffbd" filter="url(#glow)"/>
    <circle cx="326" cy="44" r="5" fill="#9fffbd" filter="url(#glow)"/>
  </g>

  <text x="98" y="210" fill="#f7fff8" font-family="Georgia, serif" font-size="66" font-weight="600">Thank you for supporting</text>
  <text x="98" y="284" fill="#f7fff8" font-family="Georgia, serif" font-size="66" font-weight="600">Ritual testnet</text>
  <text x="104" y="344" fill="#b9ffd1" font-family="Georgia, serif" font-size="32">You minted an Omen Trust Receipt on Ritual.</text>
  <path d="M104 366h430" stroke="url(#line)" stroke-width="3"/>

  <g transform="translate(96 402)">
    <rect width="900" height="402" rx="18" fill="#04120d" fill-opacity="0.82" stroke="#4fee8d" stroke-opacity="0.52"/>
    ${details
      .map((row, index) => {
        const valueSize = index === 0 || index === 2 ? 27 : 24;
        return `<g transform="translate(0 ${index * detailRowHeight})">
          ${index > 0 ? '<path d="M0 0h900" stroke="#79ffa9" stroke-opacity="0.2"/>' : ""}
          <text x="46" y="34" fill="#d8ffe0" font-family="Georgia, serif" font-size="24">${escapeXml(row[0])}</text>
          <text x="382" y="34" fill="${index === 2 ? "#6cff97" : "#ffffff"}" font-family="Arial, sans-serif" font-size="${valueSize}" font-weight="${index === 2 ? "800" : "600"}">${escapeXml(row[1])}</text>
        </g>`;
      })
      .join("")}
  </g>

  <g transform="translate(1118 292)">
    <rect x="36" y="64" width="392" height="300" rx="34" fill="#061b10" fill-opacity="0.88" stroke="#72ff99" stroke-width="4" filter="url(#softGlow)"/>
    <rect x="62" y="90" width="340" height="248" rx="24" fill="none" stroke="#c3ffd5" stroke-width="1.4" stroke-opacity="0.34"/>
    <path d="M96 132h84M276 132h84M96 300h84M276 300h84" stroke="url(#line)" stroke-width="3" opacity="0.72"/>
    <circle cx="230" cy="132" r="5" fill="#9fffbd" filter="url(#softGlow)"/>
    <circle cx="230" cy="300" r="5" fill="#9fffbd" filter="url(#softGlow)"/>
    <text x="230" y="202" fill="#f7fff8" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="800" letter-spacing="4">REGISTERED ONCHAIN</text>
    <text x="230" y="268" fill="#96ffba" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="700">Ritual testnet</text>
  </g>

  <ellipse cx="1320" cy="738" rx="304" ry="42" fill="none" stroke="#50fa88" stroke-width="5" opacity="0.42" filter="url(#glow)"/>

  <g transform="translate(172 840)">
    <rect width="1336" height="68" rx="18" fill="#06140f" fill-opacity="0.9" stroke="#55f58c" stroke-opacity="0.54"/>
    <text x="668" y="34" fill="#d9ffe0" text-anchor="middle" font-family="Georgia, serif" font-size="23">
      This gift marks your participation in testing registry-backed trust infrastructure for autonomous agents.
    </text>
    <text x="668" y="56" fill="#9bdcaf" text-anchor="middle" font-family="Georgia, serif" font-size="18">
      The active trust state remains OmenRegistry. Re-check before acting.
    </text>
  </g>
</svg>`;
}

async function downloadPng(svg: string, filename: string) {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render receipt image"));
    });
    image.src = url;
    await loaded;

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare image download");
    context.drawImage(image, 0, 0, WIDTH, HEIGHT);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not export PNG"))), "image/png");
    });
    const pngUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function TrustReceiptGiftCard(props: TrustReceiptGiftCardProps) {
  const [downloadState, setDownloadState] = useState("Download Gift Image");
  const [imageError, setImageError] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const svg = useMemo(() => receiptSvg(props), [props]);
  const previewUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);
  const filename = `omen-trust-receipt-gift-${props.tokenId || "minted"}.png`;

  const downloadImage = async () => {
    try {
      setDownloadState("Preparing image");
      await downloadPng(svg, filename);
      setDownloadState("Download Gift Image");
    } catch {
      setDownloadState("Download failed");
      window.setTimeout(() => setDownloadState("Download Gift Image"), 1800);
    }
  };

  return (
    <section className="receipt-gift-panel">
      <div className="receipt-gift-copy">
        <p className="mono-kicker">Final gift</p>
        <h3>Trust Receipt Minted</h3>
        <p>Thank you for supporting Ritual testnet.</p>
        <p>This gift marks your participation in testing Ritual-native trust infrastructure.</p>
        <div className="receipt-gift-actions">
          <button className="refresh-button" type="button" onClick={() => void downloadImage()}>
            <Download size={15} />
            {downloadState}
          </button>
          <button className="refresh-button" type="button" onClick={() => setShowPopup(true)}>
            <Maximize2 size={15} />
            Open Gift Image
          </button>
          <a className="refresh-button receipt-gift-link" href={props.explorerLink} target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            View Transaction
          </a>
        </div>
      </div>
      <div className="receipt-gift-preview">
        {previewUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Omen Trust Receipt gift image preview" onError={() => setImageError(true)} />
        ) : (
          <div className="receipt-gift-fallback" role="status">
            Receipt minted, but image preview could not be generated. Try Download Gift Image again.
          </div>
        )}
      </div>
      {showPopup && previewUrl && !imageError && (
        <div className="receipt-gift-modal" role="dialog" aria-modal="true" aria-label="Omen Trust Receipt gift image">
          <div className="receipt-gift-modal-panel">
            <div className="receipt-gift-modal-header">
              <div>
                <p className="mono-kicker">Final step</p>
                <h3>Trust Receipt Minted</h3>
                <p>Thank you for supporting Ritual testnet.</p>
              </div>
              <button className="refresh-button receipt-gift-close" type="button" onClick={() => setShowPopup(false)} aria-label="Close gift image popup">
                <X size={17} />
              </button>
            </div>
            <div className="receipt-gift-modal-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Omen Trust Receipt gift image" />
            </div>
            <div className="receipt-gift-modal-actions">
              <button className="trust-submit" type="button" onClick={() => void downloadImage()}>
                <Download size={16} />
                {downloadState}
              </button>
              <a className="refresh-button receipt-gift-link" href={props.explorerLink} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                View Transaction
              </a>
              <button className="refresh-button" type="button" onClick={() => setShowPopup(false)}>
                Close
              </button>
            </div>
            <p className="receipt-helper">The active trust state remains OmenRegistry. Re-check before acting.</p>
          </div>
        </div>
      )}
    </section>
  );
}
