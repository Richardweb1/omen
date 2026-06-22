import { formatEther, getAddress, isAddress } from "viem";

const INDEXER_URL = "https://explorer.ritualfoundation.org/api/indexer-proxy/api/v1";
const PUBLIC_RITUAL_RPC_URL = "https://rpc.ritualfoundation.org";
const RITUAL_GENESIS_DATE = "2026-03-22";
const PAGE_LIMIT = 1000;
const MAX_PAGES_PER_WINDOW = 20;

type IndexedTransaction = {
  tx_hash: string;
  from_address: string;
  gas_used: number | string;
  gas_price: number | string;
};

type IndexedPage = {
  hasMore?: boolean;
  transactions?: IndexedTransaction[];
};

export type RitualFeeSummary = {
  address: `0x${string}`;
  balanceWei?: string;
  balanceRit?: string;
  balanceSource: "Ritual RPC" | "unavailable";
  outgoingTxCount: number;
  totalFeesWei: string;
  totalFeesRit: string;
  averageFeeRit: string;
  highestFeeRit: string;
  source: "Ritual Explorer indexer";
  reliability: string;
  coverage: { from: string; to: string; complete: boolean };
  calculatedAt: string;
};

type RpcBalanceResponse = {
  result?: string;
  error?: { message?: string };
};

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function windows() {
  const end = new Date();
  let cursor = new Date(`${RITUAL_GENESIS_DATE}T00:00:00.000Z`);
  const result: Array<{ from: string; to: string }> = [];
  while (cursor <= end) {
    const windowEnd = addDays(cursor, 29);
    result.push({ from: dateOnly(cursor), to: dateOnly(windowEnd > end ? end : windowEnd) });
    cursor = addDays(windowEnd, 1);
  }
  return result;
}

function displayRit(value: bigint) {
  const [whole, fraction = ""] = formatEther(value).split(".");
  const trimmed = fraction.slice(0, 9).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

async function readWindow(address: string, from: string, to: string) {
  const transactions: IndexedTransaction[] = [];
  let offset = 0;
  for (let page = 0; page < MAX_PAGES_PER_WINDOW; page += 1) {
    const url = new URL(`${INDEXER_URL}/addresses/${address}/transactions`);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("from_date", from);
    url.searchParams.set("to_date", to);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Ritual Explorer indexer returned HTTP ${response.status}.`);
    const payload = (await response.json()) as IndexedPage;
    const batch = Array.isArray(payload.transactions) ? payload.transactions : [];
    transactions.push(...batch);
    if (!payload.hasMore || batch.length === 0) return { transactions, complete: true };
    offset += batch.length;
  }
  return { transactions, complete: false };
}

async function readBalance(address: string) {
  const response = await fetch(process.env.RITUAL_RPC_URL || PUBLIC_RITUAL_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Ritual RPC returned HTTP ${response.status}.`);
  const payload = (await response.json()) as RpcBalanceResponse;
  if (!payload.result || payload.error) throw new Error(payload.error?.message || "Ritual balance is unavailable.");
  return BigInt(payload.result);
}

export async function getRitualFeeSummary(addressInput: string): Promise<RitualFeeSummary> {
  if (!isAddress(addressInput)) throw new Error("address must be a valid EVM address.");
  const address = getAddress(addressInput);
  const [results, balanceResult] = await Promise.all([
    Promise.all(windows().map((window) => readWindow(address, window.from, window.to))),
    readBalance(address).then((value) => ({ value })).catch(() => null),
  ]);
  const unique = new Map<string, IndexedTransaction>();
  for (const result of results) {
    for (const transaction of result.transactions) unique.set(transaction.tx_hash, transaction);
  }

  let total = 0n;
  let highest = 0n;
  let count = 0;
  for (const transaction of unique.values()) {
    if (transaction.from_address.toLowerCase() !== address.toLowerCase()) continue;
    const fee = BigInt(transaction.gas_used) * BigInt(transaction.gas_price);
    total += fee;
    if (fee > highest) highest = fee;
    count += 1;
  }
  const average = count > 0 ? total / BigInt(count) : 0n;
  const complete = results.every((result) => result.complete);
  return {
    address,
    ...(balanceResult ? { balanceWei: balanceResult.value.toString(), balanceRit: displayRit(balanceResult.value) } : {}),
    balanceSource: balanceResult ? "Ritual RPC" : "unavailable",
    outgoingTxCount: count,
    totalFeesWei: total.toString(),
    totalFeesRit: displayRit(total),
    averageFeeRit: displayRit(average),
    highestFeeRit: displayRit(highest),
    source: "Ritual Explorer indexer",
    reliability: "Calculated from indexed outgoing transactions as gas used multiplied by gas price.",
    coverage: { from: RITUAL_GENESIS_DATE, to: dateOnly(new Date()), complete },
    calculatedAt: new Date().toISOString(),
  };
}
