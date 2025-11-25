import { useEffect, useState } from "react";
import { fetchPages } from "../api/generate";

const EXAMPLES = [
  {
    title: "Our Bakery Menu — Breads, Pastries & Cakes",
    topic: "Full bakery menu with sourdough, croissants, and seasonal cakes",
    target_audience: "Local food lovers exploring the menu before visiting",
    additional_notes: "Include sections for Breads, Viennoiserie, and Cakes. Mention the 4 AM bake time.",
    content_type: "page",
  },
  {
    title: "Holiday Gift Boxes — Order Before December 20th",
    topic: "Seasonal gift hampers featuring our bestselling baked goods",
    target_audience: "Customers looking for premium food gifts for Christmas",
    additional_notes: "Create urgency around the order deadline. Mention free local delivery.",
    content_type: "page",
  },
  {
    title: "5 Ways Sourdough Supports Your Gut Health",
    topic: "The science and tradition behind sourdough fermentation and its health benefits",
    target_audience: "Health-conscious adults aged 25–45 interested in whole foods",
    additional_notes: "Blog post style. Mention that all our loaves are cold-fermented 24h.",
    content_type: "post",
    categories: "Baking Tips, Health",
    tags: "sourdough, gut health, fermentation",
  },
];

const TONES = [
  { id: "warm",      label: "Warm",      icon: "☕" },
  { id: "formal",    label: "Formal",    icon: "🎩" },
  { id: "casual",    label: "Casual",    icon: "😊" },
  { id: "playful",   label: "Playful",   icon: "✨" },
  { id: "luxurious", label: "Luxurious", icon: "💎" },
];

const STATUSES = [
  { id: "draft",   label: "Draft",   desc: "Save for later" },
  { id: "pending", label: "Pending", desc: "For review" },
  { id: "private", label: "Private", desc: "Admins only" },
  { id: "publish", label: "Publish", desc: "Go live" },
];

const MODES = [
  { id: "create",      label: "Create New",    icon: "✦" },
  { id: "update",      label: "Replace",       icon: "↺" },
  { id: "add_section", label: "Add Section",   icon: "+" },
];

const CONTENT_TYPES = [
  { id: "page", label: "Page",      icon: "📄" },
  { id: "post", label: "Blog Post", icon: "📝" },
];

const DEFAULT_FORM = {
  title: "",
  topic: "",
  target_audience: "",
  additional_notes: "",
  status: "draft",
  tone: "warm",
  mode: "create",
  content_type: "page",
  page_id: null,
  categories: "",
  tags: "",
};

export default function BriefForm({ onSubmit, loading }) {
  const [form, setForm]                 = useState(DEFAULT_FORM);
  const [pages, setPages]               = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const fillExample = (ex) => setForm((prev) => ({ ...prev, ...ex }));

  const needsPagePicker = form.mode === "update" || form.mode === "add_section";

  useEffect(() => {
    if (!needsPagePicker) return;
    setPagesLoading(true);
    fetchPages()
      .then(setPages)
      .catch(() => setPages([]))
      .finally(() => setPagesLoading(false));
  }, [form.mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!needsPagePicker) delete payload.page_id;
    if (form.content_type === "page") {
      delete payload.categories;
      delete payload.tags;
    }
    onSubmit(payload);
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <p className="form-card__heading">Content Brief</p>

      {/* ── Content type ── */}
      <div className="field">
        <label className="field-label">Content type</label>
        <div className="chip-group">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              type="button"
              className={`chip ${form.content_type === ct.id ? "chip--active" : ""}`}
              onClick={() => update("content_type", ct.id)}
            >
              {ct.icon} {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mode selector ── */}
      <div className="field">
        <label className="field-label">Mode</label>
        <div className="chip-group">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip ${form.mode === m.id ? "chip--active" : ""}`}
              onClick={() => update("mode", m.id)}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page / post picker ── */}
      {needsPagePicker && (
        <div className="field">
          <label className="field-label" htmlFor="page_id">
            {form.mode === "update"
              ? `Replace which ${form.content_type}?`
              : `Append section to which ${form.content_type}?`}
          </label>
          {pagesLoading ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            <select
              id="page_id"
              className="field-input"
              required
              value={form.page_id ?? ""}
              onChange={(e) => update("page_id", Number(e.target.value))}
            >
              <option value="" disabled>— select —</option>
              {pages
                .filter((p) => p.content_type === form.content_type)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} [{p.status}]
                  </option>
                ))}
            </select>
          )}
        </div>
      )}

      {/* ── Title ── */}
      <div className="field">
        <label className="field-label" htmlFor="title">
          {form.mode === "add_section" ? "Section heading" : "Title"}
        </label>
        <input
          id="title"
          className="field-input"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={
            form.content_type === "post"
              ? "e.g. 5 Ways Sourdough Supports Gut Health"
              : form.mode === "add_section"
              ? "e.g. Seasonal Specials"
              : "e.g. Our Bakery Menu"
          }
        />
      </div>

      {/* ── Topic ── */}
      <div className="field">
        <label className="field-label" htmlFor="topic">Topic / subject</label>
        <input
          id="topic"
          className="field-input"
          required
          value={form.topic}
          onChange={(e) => update("topic", e.target.value)}
          placeholder="What this content is about"
        />
      </div>

      {/* ── Audience ── */}
      <div className="field">
        <label className="field-label" htmlFor="audience">Target audience</label>
        <input
          id="audience"
          className="field-input"
          required
          value={form.target_audience}
          onChange={(e) => update("target_audience", e.target.value)}
          placeholder="Who will read this"
        />
      </div>

      {/* ── Categories & tags (posts only) ── */}
      {form.content_type === "post" && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="categories">
              Categories <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(comma-separated)</span>
            </label>
            <input
              id="categories"
              className="field-input"
              value={form.categories}
              onChange={(e) => update("categories", e.target.value)}
              placeholder="e.g. Baking Tips, Health"
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="tags">
              Tags <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(comma-separated)</span>
            </label>
            <input
              id="tags"
              className="field-input"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="e.g. sourdough, croissant, seasonal"
            />
          </div>
        </>
      )}

      {/* ── Notes ── */}
      <div className="field">
        <label className="field-label" htmlFor="notes">Additional notes</label>
        <textarea
          id="notes"
          className="field-textarea"
          value={form.additional_notes}
          onChange={(e) => update("additional_notes", e.target.value)}
          placeholder="Specific sections, keywords, or instructions for the AI"
        />
      </div>

      {/* ── Tone ── */}
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
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Status ── */}
      <div className="field">
        <label className="field-label">Status after generation</label>
        <div className="status-options status-options--compact">
          {STATUSES.map((s) => (
            <label key={s.id} className={`status-option ${form.status === s.id ? "status-option--active" : ""}`}>
              <input
                type="radio"
                name="status"
                value={s.id}
                checked={form.status === s.id}
                onChange={() => update("status", s.id)}
              />
              <span className="status-option__label">{s.label}</span>
              <span className="status-option__desc">{s.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Submit ── */}
      <button className="btn-submit" type="submit" disabled={loading}>
        {loading ? (
          <><span className="spinner" /> Running pipeline…</>
        ) : (
          <>⚡ Generate {form.content_type === "post" ? "Post" : form.mode === "add_section" ? "Section" : "Page"}</>
        )}
      </button>

      {/* ── Examples ── */}
      {!loading && form.mode === "create" && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
            Try an example
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.title}
                type="button"
                onClick={() => fillExample(ex)}
                className="example-btn"
              >
                {ex.content_type === "post" ? "📝 " : "📄 "}
                {ex.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
