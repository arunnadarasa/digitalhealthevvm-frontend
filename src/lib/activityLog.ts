export type ActivityKind =
  | "dhm_faucet"
  | "dhm_mpp"
  | "usdc_mpp"
  /** @deprecated stored entries from older builds */
  | "dhm_x402"
  | "usdc_x402";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  timestamp: number;
  title: string;
  description: string;
  txHash?: string;
  details?: Record<string, unknown>;
};

const STORAGE_KEY = "dhm-activity-log-v1";
const MAX_ENTRIES = 200;

function loadAll(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ActivityEntry[];
  } catch {
    return [];
  }
}

function saveAll(entries: ActivityEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore storage errors in demo
  }
}

export function addActivity(entry: Omit<ActivityEntry, "id" | "timestamp">) {
  const all = loadAll();
  const now = Date.now();
  const id = `${now}-${Math.random().toString(16).slice(2)}`;
  const full: ActivityEntry = { id, timestamp: now, ...entry };
  const next = [full, ...all];
  saveAll(next);
}

export function getActivities(): ActivityEntry[] {
  return loadAll().sort((a, b) => b.timestamp - a.timestamp);
}
