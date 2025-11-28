import { useRef, useState } from "react";

const TONES    = ["warm", "formal", "casual", "playful", "luxurious"];
const STATUSES = ["draft", "pending", "private", "publish"];

const EMPTY_ROW = () => ({ id: crypto.randomUUID(), title: "", topic: "", additional_notes: "" });

const EXAMPLE_ROWS = [
  { id: crypto.randomUUID(), title: "Sourdough & Artisan Breads",        topic: "Our signature sourdoughs, whole-grain loaves, and daily baked breads",  additional_notes: "Mention 4 AM bake time and stone-oven baking" },
  { id: crypto.randomUUID(), title: "Viennoiserie & Pastries",           topic: "Croissants, pain au chocolat, kouign-amann, and seasonal pastries",       additional_notes: "Highlight French technique and butter quality" },
  { id: crypto.randomUUID(), title: "Celebration & Custom Cakes",        topic: "Bespoke wedding, birthday, and celebration cakes made to order",          additional_notes: "CTA to contact form; 2-week lead time" },
  { id: crypto.randomUUID(), title: "Holiday Gift Boxes",                topic: "Curated gift hampers with our bestselling baked goods",                   additional_notes: "Urgency: order before Dec 20 for Christmas delivery" },
  { id: crypto.randomUUID(), title: "Corporate & Event Catering",        topic: "Pastry platters and bread baskets for offices, meetings, and events",     additional_notes: "Min. order 12 people; next-day delivery available" },
];

export default function BulkForm({ onRun }) {
  const [rows, setRows]                 = useState([EMPTY_ROW()]);
  const [defaultAudience, setAudience]  = useState("Local food lovers and bakery enthusiasts");
  const [defaultTone, setTone]          = useState("warm");
  const [defaultStatus, setStatus]      = useState("draft");
  const fileRef = useRef();

  const updateRow = (id, field, val) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  const addRow    = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const loadExamples = () => setRows(EXAMPLE_ROWS.map((r) => ({ ...r, id: crypto.randomUUID() })));

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.trim().split("\n").slice(1); // skip header
      const parsed = lines
        .map((line) => {
          const [title = "", topic = "", notes = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
          return title ? { id: crypto.randomUUID(), title, topic, additional_notes: notes } : null;
        })
        .filter(Boolean);
      if (parsed.length) setRows(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRun = () => {
    const valid = rows.filter((r) => r.title.trim() && r.topic.trim());
    if (!valid.length) return alert("Add at least one row with a title and topic.");
    const briefs = valid.map((r) => ({
      title:            r.title.trim(),
      topic:            r.topic.trim(),
      target_audience:  defaultAudience,
      additional_notes: r.additional_notes.trim() || null,
      tone:             defaultTone,
      status:           defaultStatus,
      mode:             "create",
    }));
    onRun(briefs);
  };

  return (
    <div className="bulk-form">
      {/* ── Global settings ── */}
      <div className="bulk-settings card">
        <h3 className="bulk-settings__title">Global settings</h3>
        <div className="bulk-settings__row">
          <div className="field" style={{ flex: 2 }}>
            <label className="field-label">Default audience</label>
            <input
              className="field-input"
              value={defaultAudience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Who all these pages are for"
            />
          </div>
          <div className="field">
            <label className="field-label">Tone</label>
            <select className="field-input" value={defaultTone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Status</label>
            <select className="field-input" value={defaultStatus} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ overflowX: "auto" }}>
        <div className="bulk-table-header">
          <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
            {rows.length} page{rows.length !== 1 ? "s" : ""} queued
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="bulk-action-btn" type="button" onClick={loadExamples}>Load examples</button>
            <button className="bulk-action-btn" type="button" onClick={() => fileRef.current.click()}>
              Import CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
          </div>
        </div>

        <table className="bulk-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Page title *</th>
              <th>Topic *</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td className="bulk-table__num">{idx + 1}</td>
                <td>
                  <input
                    className="bulk-cell-input"
                    value={row.title}
                    onChange={(e) => updateRow(row.id, "title", e.target.value)}
                    placeholder="e.g. Our Bakery Menu"
                  />
                </td>
                <td>
                  <input
                    className="bulk-cell-input"
                    value={row.topic}
                    onChange={(e) => updateRow(row.id, "topic", e.target.value)}
                    placeholder="What this page covers"
                  />
                </td>
                <td>
                  <input
                    className="bulk-cell-input bulk-cell-input--notes"
                    value={row.additional_notes}
                    onChange={(e) => updateRow(row.id, "additional_notes", e.target.value)}
                    placeholder="Optional instructions"
                  />
                </td>
                <td>
                  <button
                    className="bulk-remove-btn"
                    type="button"
                    onClick={() => removeRow(row.id)}
                    title="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="bulk-add-row-btn" type="button" onClick={addRow}>
          + Add row
        </button>
      </div>

      {/* ── CSV format hint ── */}
      <p className="bulk-csv-hint">
        CSV format: <code>title,topic,notes</code> (header row required, notes optional)
      </p>

      {/* ── Run button ── */}
      <button className="btn-submit" type="button" onClick={handleRun}>
        ⚡ Generate All ({rows.filter((r) => r.title && r.topic).length} pages)
      </button>
    </div>
  );
}
