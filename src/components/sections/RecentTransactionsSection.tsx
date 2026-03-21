import { useMemo, useState } from "react";
import { getActivities, ActivityEntry } from "../../lib/activityLog";
import { TX_EXPLORER_BASE } from "../../config/contracts";

const PAGE_SIZE = 5;

function formatDate(ts: number): string {
  try {
    const d = new Date(ts);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatKind(kind: ActivityEntry["kind"]): string {
  if (kind === "dhm_faucet") return "EVVM faucet";
  if (kind === "dhm_mpp" || kind === "dhm_x402") return "DHM MPP";
  if (kind === "usdc_mpp" || kind === "usdc_x402") return "USDC MPP";
  return kind;
}

function openTransaction(txHash: string) {
  window.open(`${TX_EXPLORER_BASE}/tx/${txHash}`, "_blank", "noopener,noreferrer");
}

export function RecentTransactionsSection() {
  const [page, setPage] = useState(0);
  const activities = useMemo(() => getActivities(), []);

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const current = activities.slice(start, start + PAGE_SIZE);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <section className="section">
      <h2>Recent activity</h2>
      <p className="activity-intro">
        Recent EVVM faucet requests and MPP payment attempts (DHM / USDC demos). Stored locally in your browser — not
        from the blockchain.
      </p>
      {current.length === 0 ? (
        <div className="activity-empty">
          <p>No activity yet.</p>
          <p className="small">
            Use the EVVM faucet, complete an MPP DHM paywall payment, or an Echo USDC flow to see entries here.
          </p>
        </div>
      ) : (
        <>
          <ul className="activity-list">
            {current.map((a) => (
              <li key={a.id} className="activity-item">
                <div className="activity-item-header">
                  <span className={`activity-kind activity-kind-${a.kind}`}>{formatKind(a.kind)}</span>
                  <span className="activity-time">{formatDate(a.timestamp)}</span>
                </div>
                <div className="activity-title">{a.title}</div>
                {a.description && <div className="activity-desc">{a.description}</div>}
                {a.txHash && (
                  <div className="activity-actions">
                    <button
                      type="button"
                      className="btn btn-open-tx"
                      onClick={() => openTransaction(a.txHash!)}
                      title="Open transaction on explorer"
                    >
                      View transaction
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="activity-pagination">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={safePage === 0}
            >
              Previous
            </button>
            <span className="activity-page-info">
              Page {safePage + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleNext}
              disabled={safePage >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
