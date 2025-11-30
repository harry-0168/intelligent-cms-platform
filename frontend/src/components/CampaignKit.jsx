import { useState } from "react";
import { generateCampaignBriefs, generatePage, publishPage } from "../api/generate";

const TONES = [
  { id: "warm",      icon: "☕" },
  { id: "formal",    icon: "🎩" },
  { id: "casual",    icon: "😊" },
  { id: "playful",   icon: "✨" },
  { id: "luxurious", icon: "💎" },
];

const STATUSES = ["draft", "pending", "private", "publish"];

const COUNT_OPTIONS = [3, 5, 7, 10];

const STATUS_COLORS = {
  queued:  "#94a3b8",
  running: "#3b82f6",
  done:    "#16a34a",
  error:   "#dc2626",
};

export default function CampaignKit() {
  const [form, setForm] = useState({
    campaign_name: "",
    theme: "",
    count: 5,
    tone: "warm",
    status: "draft",
  });

  const [phase, setPhase]       = useState("idle");   // idle | planning | review | running | done
  const [briefs, setBriefs]     = useState([]);
  const [rows, setRows]         = useState([]);        // { brief, status, result, error }
  const [planError, setPlanError] = useState(null);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ── Step 1: Generate briefs ──────────────────────────────────────────────

  const handlePlan = async (e) => {
    e.preventDefault();
    setPlanError(null);
    setPhase("planning");
    try {
      const data = await generateCampaignBriefs(form);
      setBriefs(data.briefs.map((b) => ({ ...b, status: form.status, tone: form.tone })));
      setPhase("review");
    } catch (err) {
      setPlanError(err.response?.data?.detail || err.message);
      setPhase("idle");
    }
  };

  const updateBrief = (idx, key, val) =>
    setBriefs((prev) => prev.map((b, i) => (i === idx ? { ...b, [key]: val } : b)));

  const removeBrief = (idx) =>
    setBriefs((prev) => prev.filter((_, i) => i !== idx));

  // ── Step 2: Run the bulk pipeline ───────────────────────────────────────

  const handleRun = async () => {
    const initial = briefs.map((b) => ({ brief: b, status: "queued", result: null, error: null }));
    setRows(initial);
    setPhase("running");

    for (let i = 0; i < initial.length; i++) {
      setRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r))
      );
      try {
        const result = await generatePage({ ...initial[i].brief, mode: "create" });
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "done", result } : r))
        );
      } catch (err) {
        setRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: "error", error: err.response?.data?.detail || err.message }
              : r
          )
        );
      }
    }
    setPhase("done");
  };

  const handlePublish = async (idx, row) => {
    if (!row.result) return;
    try {
      await publishPage(row.result.wordpress_post_id, row.result.content_type || "page");
      setRows((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, result: { ...r.result, wp_status: "publish" } } : r
        )
      );
    } catch (err) {
      alert("Publish failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const reset = () => {
    setPhase("idle");
    setBriefs([]);
    setRows([]);
    setPlanError(null);
    setForm({ campaign_name: "", theme: "", count: 5, tone: "warm", status: "draft" });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="campaign-kit">
      {/* ══ Step 1: Campaign form ══════════════════════════════════════════ */}
      {(phase === "idle" || phase === "planning") && (
        <form className="card campaign-form" onSubmit={handlePlan}>
          <p className="form-card__heading">Campaign Kit</p>
          <p className="form-card__sub">
            Describe your campaign. AI plans a coherent set of pages and posts — you review, then fire.
          </p>

          <div className="field">
            <label className="field-label" htmlFor="cname">Campaign name</label>
            <input
              id="cname"
              className="field-input"
              required
              value={form.campaign_name}
              onChange={(e) => update("campaign_name", e.target.value)}
              placeholder="e.g. Spring Pastry Launch 2026"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="ctheme">Campaign theme / occasion</label>
            <textarea
              id="ctheme"
              className="field-textarea"
              required
              value={form.theme}
              onChange={(e) => update("theme", e.target.value)}
              placeholder="e.g. Mother's Day — promote our custom cake boxes and afternoon tea. Warm, celebratory tone."
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Number of pieces</label>
              <div className="chip-group">
                {COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`chip ${form.count === n ? "chip--active" : ""}`}
                    onClick={() => update("count", n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label">Tone</label>
              <div className="chip-group">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`chip ${form.tone === t.id ? "chip--active" : ""}`}
                    onClick={() => update("tone", t.id)}
                  >
                    {t.icon} {t.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Status for all pieces</label>
            <div className="chip-group">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${form.status === s ? "chip--active" : ""}`}
                  onClick={() => update("status", s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {planError && <div className="error-box">{planError}</div>}

          <button className="btn-submit" type="submit" disabled={phase === "planning"}>
            {phase === "planning" ? (
              <><span className="spinner" /> Planning campaign…</>
            ) : (
              "✦ Generate Campaign Plan"
            )}
          </button>
        </form>
      )}

      {/* ══ Step 2: Review briefs ══════════════════════════════════════════ */}
      {phase === "review" && (
        <div className="campaign-review">
          <div className="campaign-review__header">
            <div>
              <h3>Review your campaign plan</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {briefs.length} pieces planned — edit titles, topics, or remove items before running.
              </p>
            </div>
            <div className="campaign-review__actions">
              <button className="btn-secondary" onClick={() => setPhase("idle")}>← Back</button>
              <button className="btn-submit" onClick={handleRun}>
                ⚡ Run All ({briefs.length})
              </button>
            </div>
          </div>

          <div className="campaign-briefs">
            {briefs.map((b, idx) => (
              <div key={idx} className="campaign-brief-card">
                <div className="campaign-brief-card__header">
                  <span className={`type-pill type-pill--${b.content_type || "page"}`}>
                    {b.content_type === "post" ? "📝 Post" : "📄 Page"}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>#{idx + 1}</span>
                  <button
                    className="btn-micro btn-micro--danger"
                    onClick={() => removeBrief(idx)}
                    style={{ marginLeft: "auto" }}
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="field-input"
                  value={b.title}
                  onChange={(e) => updateBrief(idx, "title", e.target.value)}
                  placeholder="Title"
                />
                <textarea
                  className="field-textarea"
                  value={b.topic}
                  onChange={(e) => updateBrief(idx, "topic", e.target.value)}
                  placeholder="Topic"
                  rows={2}
                />
                <textarea
                  className="field-textarea"
                  value={b.additional_notes || ""}
                  onChange={(e) => updateBrief(idx, "additional_notes", e.target.value)}
                  placeholder="Additional notes / linking instructions"
                  rows={2}
                />
                {b.content_type === "post" && (
                  <input
                    className="field-input"
                    value={b.tags || ""}
                    onChange={(e) => updateBrief(idx, "tags", e.target.value)}
                    placeholder="Tags (comma-separated)"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Step 3: Running / Done ════════════════════════════════════════ */}
      {(phase === "running" || phase === "done") && (
        <div className="campaign-runner">
          <div className="campaign-runner__header">
            <h3>
              {phase === "running" ? "Running campaign pipeline…" : "Campaign complete!"}
            </h3>
            {phase === "done" && (
              <button className="btn-secondary" onClick={reset}>
                ✦ New Campaign
              </button>
            )}
          </div>

          <div className="bulk-runner">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className={`bulk-row bulk-row--${row.status}`}
              >
                <span
                  className="bulk-row__status-dot"
                  style={{ background: STATUS_COLORS[row.status] }}
                />
                <span className={`type-pill type-pill--${row.brief.content_type || "page"}`}
                  style={{ fontSize: "0.7rem" }}>
                  {row.brief.content_type === "post" ? "Post" : "Page"}
                </span>
                <span className="bulk-row__title">{row.brief.title}</span>
                <span className="bulk-row__badge">
                  {row.status === "queued"  && "Queued"}
                  {row.status === "running" && <><span className="spinner spinner--xs" /> Generating…</>}
                  {row.status === "done"    && "Done"}
                  {row.status === "error"   && "Error"}
                </span>
                {row.status === "done" && row.result && (
                  <div className="bulk-row__actions">
                    <a href={row.result.wordpress_post_url} target="_blank" rel="noreferrer" className="btn-micro">
                      View
                    </a>
                    {row.result.wp_preview_url && (
                      <a href={row.result.wp_preview_url} target="_blank" rel="noreferrer" className="btn-micro">
                        Preview
                      </a>
                    )}
                    {row.result.wp_status !== "publish" && (
                      <button className="btn-micro btn-micro--green" onClick={() => handlePublish(idx, row)}>
                        Publish
                      </button>
                    )}
                  </div>
                )}
                {row.status === "error" && (
                  <span className="bulk-row__error" title={row.error}>⚠ {row.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
