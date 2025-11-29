import { useEffect, useState } from "react";
import { fetchAudit, fixMeta, publishPage } from "../api/generate";

const GRADE_COLOR = { A: "#16a34a", B: "#65a30d", C: "#d97706", F: "#dc2626" };
const SEVERITY_COLOR = { fail: "#dc2626", warn: "#d97706" };

function ScoreBadge({ grade, score }) {
  return (
    <span
      className="seo-badge"
      style={{ background: GRADE_COLOR[grade] + "22", color: GRADE_COLOR[grade] }}
    >
      {grade} · {score}
    </span>
  );
}

function StaleBadge() {
  return <span className="status-badge status-badge--stale">Stale</span>;
}

export default function AuditDashboard() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [fixing, setFixing]     = useState({});   // itemId -> bool
  const [publishing, setPublishing] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [filterIssue, setFilterIssue] = useState("all");

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAudit()
      .then(setData)
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFixMeta = async (item) => {
    setFixing((prev) => ({ ...prev, [item.id]: true }));
    try {
      const result = await fixMeta(item.id, {
        content_type: item.content_type,
        title: item.title,
        body_snippet: item.meta_description || item.title,
      });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, meta_description: result.new_meta_description } : i
        ),
      }));
    } catch (e) {
      alert("Fix failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setFixing((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handlePublish = async (item) => {
    setPublishing((prev) => ({ ...prev, [item.id]: true }));
    try {
      await publishPage(item.id, item.content_type);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, status: "publish" } : i
        ),
      }));
    } finally {
      setPublishing((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="audit-loading">
        <span className="spinner" />
        <p>Running audit on all content…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <p>{error}</p>
        <button className="btn-secondary" onClick={load}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { items, summary } = data;

  const filtered = items.filter((i) => {
    if (filterType !== "all" && i.content_type !== filterType) return false;
    if (filterIssue === "stale" && !i.is_stale) return false;
    if (filterIssue === "failing" && i.seo_grade !== "F") return false;
    if (filterIssue === "no-meta" && i.meta_description) return false;
    return true;
  });

  return (
    <div className="audit-dashboard">
      {/* ── Summary cards ── */}
      <div className="audit-summary">
        <div className="audit-stat">
          <span className="audit-stat__num">{summary.total}</span>
          <span className="audit-stat__label">Total items</span>
        </div>
        <div className="audit-stat audit-stat--warn">
          <span className="audit-stat__num">{summary.stale}</span>
          <span className="audit-stat__label">Stale (&gt;90 days)</span>
        </div>
        <div className="audit-stat audit-stat--fail">
          <span className="audit-stat__num">{summary.failing}</span>
          <span className="audit-stat__label">Grade F</span>
        </div>
        <div className="audit-stat audit-stat--pass">
          <span className="audit-stat__num">{summary.passing}</span>
          <span className="audit-stat__label">Grade A/B</span>
        </div>
        <button className="btn-secondary audit-refresh" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="audit-filters">
        <div className="chip-group">
          {["all", "page", "post"].map((t) => (
            <button
              key={t}
              type="button"
              className={`chip chip--sm ${filterType === t ? "chip--active" : ""}`}
              onClick={() => setFilterType(t)}
            >
              {t === "all" ? "All types" : t === "page" ? "📄 Pages" : "📝 Posts"}
            </button>
          ))}
        </div>
        <div className="chip-group">
          {[
            { id: "all",     label: "All issues" },
            { id: "stale",   label: "🕐 Stale" },
            { id: "failing", label: "❌ Grade F" },
            { id: "no-meta", label: "⚠ No meta" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip chip--sm ${filterIssue === f.id ? "chip--active" : ""}`}
              onClick={() => setFilterIssue(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>SEO</th>
              <th>Words</th>
              <th>Days old</th>
              <th>Status</th>
              <th>Issues</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No items match the current filter
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={`${item.content_type}-${item.id}`} className={item.is_stale ? "audit-row--stale" : ""}>
                <td>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="audit-title-link"
                  >
                    {item.title || "(no title)"}
                  </a>
                </td>
                <td>
                  <span className={`type-pill type-pill--${item.content_type}`}>
                    {item.content_type === "post" ? "📝 Post" : "📄 Page"}
                  </span>
                </td>
                <td><ScoreBadge grade={item.seo_grade} score={item.seo_score} /></td>
                <td style={{ textAlign: "right" }}>{item.word_count ?? "—"}</td>
                <td style={{ textAlign: "right" }}>
                  {item.days_since}
                  {item.is_stale && <StaleBadge />}
                </td>
                <td>
                  <span className={`status-badge status-badge--${item.status}`}>{item.status}</span>
                </td>
                <td>
                  {item.seo_issues?.length === 0 ? (
                    <span style={{ color: "#16a34a", fontSize: "0.78rem" }}>✓ Clean</span>
                  ) : (
                    <ul className="issue-list">
                      {item.seo_issues.map((iss, i) => (
                        <li
                          key={i}
                          style={{ color: SEVERITY_COLOR[iss.severity] }}
                        >
                          {iss.severity === "fail" ? "✗" : "!"} {iss.msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
                  <div className="audit-actions">
                    {!item.meta_description && (
                      <button
                        className="btn-micro btn-micro--accent"
                        disabled={!!fixing[item.id]}
                        onClick={() => handleFixMeta(item)}
                        title="AI-generate a meta description"
                      >
                        {fixing[item.id] ? <span className="spinner spinner--xs" /> : "✦ Fix meta"}
                      </button>
                    )}
                    {item.status !== "publish" && (
                      <button
                        className="btn-micro btn-micro--green"
                        disabled={!!publishing[item.id]}
                        onClick={() => handlePublish(item)}
                      >
                        {publishing[item.id] ? <span className="spinner spinner--xs" /> : "Publish"}
                      </button>
                    )}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-micro"
                    >
                      View
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
