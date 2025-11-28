import { useEffect, useRef, useState } from "react";
import { generatePage, publishPage } from "../api/generate";

const STATUS_CONFIG = {
  queued:  { label: "Queued",    color: "#94A3B8", bg: "#F1F5F9" },
  running: { label: "Running…",  color: "#F59E0B", bg: "#FEF3C7" },
  done:    { label: "Done",      color: "#059669", bg: "#D1FAE5" },
  error:   { label: "Failed",    color: "#DC2626", bg: "#FEE2E2" },
};

export default function BulkRunner({ briefs, onReset }) {
  const [rows, setRows]       = useState(() => briefs.map((b, i) => ({ ...b, _idx: i, _status: "queued", _result: null, _error: null })));
  const [running, setRunning] = useState(true);
  const [publishing, setPublishing] = useState(null);
  const abortRef = useRef(false);

  const setRow = (idx, patch) =>
    setRows((prev) => prev.map((r) => (r._idx === idx ? { ...r, ...patch } : r)));

  // Sequential processing
  useEffect(() => {
    let cancelled = false;
    abortRef.current = false;

    (async () => {
      for (let i = 0; i < briefs.length; i++) {
        if (cancelled || abortRef.current) break;

        setRow(i, { _status: "running" });
        try {
          const result = await generatePage(briefs[i]);
          setRow(i, { _status: "done", _result: result });
        } catch (err) {
          const msg = err?.response?.data?.detail || err?.message || "Unknown error";
          setRow(i, { _status: "error", _error: msg });
        }
      }
      setRunning(false);
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAbort = () => { abortRef.current = true; setRunning(false); };

  const handlePublish = async (row) => {
    setPublishing(row._idx);
    try {
      await publishPage(row._result.wordpress_post_id);
      setRow(row._idx, { _result: { ...row._result, wp_status: "publish" } });
    } catch { alert("Publish failed."); }
    finally { setPublishing(null); }
  };

  const done  = rows.filter((r) => r._status === "done").length;
  const errors = rows.filter((r) => r._status === "error").length;
  const total = rows.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className="bulk-runner">
      {/* ── Header ── */}
      <div className="bulk-runner__header">
        <div>
          <h2 className="bulk-runner__title">
            {running ? `Generating… (${done}/${total})` : `Completed — ${done} done, ${errors} failed`}
          </h2>
          <div className="bulk-progress-bar">
            <div className="bulk-progress-bar__fill" style={{ width: `${pct}%`, background: errors ? "#F59E0B" : "var(--success)" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {running && (
            <button className="bulk-action-btn bulk-action-btn--danger" onClick={handleAbort} type="button">
              ✕ Stop
            </button>
          )}
          {!running && (
            <button className="btn-reset" style={{ width: "auto" }} onClick={onReset} type="button">
              ↩ New Batch
            </button>
          )}
        </div>
      </div>

      {/* ── Results table ── */}
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="bulk-table bulk-table--results">
          <thead>
            <tr>
              <th>#</th>
              <th>Page title</th>
              <th>Status</th>
              <th>WP Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const sc = STATUS_CONFIG[row._status];
              const wpDraft = row._result && row._result.wp_status !== "publish";
              return (
                <tr key={row._idx}>
                  <td className="bulk-table__num">{row._idx + 1}</td>
                  <td>
                    <span className="bulk-row-title">{row.title}</span>
                    {row._status === "running" && <span className="bulk-spinner" />}
                    {row._error && (
                      <p className="bulk-row-error" title={row._error}>
                        {row._error.length > 80 ? row._error.slice(0, 80) + "…" : row._error}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className="bulk-status-badge" style={{ color: sc.color, background: sc.bg }}>
                      {sc.label}
                    </span>
                  </td>
                  <td>
                    {row._result ? (
                      <span className="bulk-status-badge" style={{
                        color: row._result.wp_status === "publish" ? "#065F46" : "#92400E",
                        background: row._result.wp_status === "publish" ? "#D1FAE5" : "#FEF3C7",
                      }}>
                        {row._result.wp_status}
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    {row._result && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <a
                          className="lib-btn lib-btn--view"
                          href={wpDraft ? row._result.wp_preview_url : row._result.wordpress_post_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {wpDraft ? "Preview" : "View"}
                        </a>
                        {wpDraft && (
                          <button
                            className="lib-btn lib-btn--publish"
                            type="button"
                            disabled={publishing === row._idx}
                            onClick={() => handlePublish(row)}
                          >
                            {publishing === row._idx ? "…" : "Publish"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Summary ── */}
      {!running && (
        <div className="bulk-summary">
          <div className="bulk-summary__stat">
            <span className="bulk-summary__num" style={{ color: "var(--success)" }}>{done}</span>
            <span className="bulk-summary__label">Created</span>
          </div>
          <div className="bulk-summary__stat">
            <span className="bulk-summary__num" style={{ color: "#DC2626" }}>{errors}</span>
            <span className="bulk-summary__label">Failed</span>
          </div>
          <div className="bulk-summary__stat">
            <span className="bulk-summary__num">{total}</span>
            <span className="bulk-summary__label">Total</span>
          </div>
          <div className="bulk-summary__stat">
            <span className="bulk-summary__num" style={{ color: "#F59E0B" }}>
              {rows.filter((r) => r._result?.wp_status === "draft").length}
            </span>
            <span className="bulk-summary__label">Awaiting publish</span>
          </div>
        </div>
      )}
    </div>
  );
}
