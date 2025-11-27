import { useState } from "react";
import { publishPage } from "../api/generate";

const STATUS_LABELS = {
  publish: { label: "Published",      color: "var(--success)" },
  draft:   { label: "Draft",          color: "#F59E0B" },
  pending: { label: "Pending Review", color: "#3B82F6" },
  private: { label: "Private",        color: "#8B5CF6" },
};

export default function ResultCard({ result, onReset }) {
  const [status, setStatus]       = useState(result.wp_status);
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl]     = useState(result.wordpress_post_url);
  const [previewTab, setPreviewTab] = useState("rendered"); // "rendered" | "html"

  if (!result) return null;

  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;
  const isDraft    = status !== "publish";

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const updated = await publishPage(result.wordpress_post_id);
      setStatus("publish");
      setLiveUrl(updated.wp_page_url);
    } catch {
      alert("Failed to publish. Check the backend logs.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <article className="card result-card">
      {/* ── Hero image ── */}
      {result.s3_image_url && (
        <img
          className="result-card__hero-img"
          src={result.s3_image_url}
          alt={result.seo_title}
        />
      )}

      <div className="result-card__body">
        {/* ── Status badge ── */}
        <div className="result-card__badges">
          <span className="result-card__badge result-card__badge--ok">✓ Sent to WordPress</span>
          <span className="result-card__badge" style={{ background: statusInfo.color + "20", color: statusInfo.color, border: `1px solid ${statusInfo.color}40` }}>
            {statusInfo.label}
          </span>
        </div>

        <h2 className="result-card__title">{result.seo_title}</h2>

        {result.meta_description && (
          <div className="result-card__meta">
            <strong>Meta: </strong>{result.meta_description}
          </div>
        )}

        {/* ── Content preview ── */}
        <div className="preview-panel">
          <div className="preview-panel__tabs">
            <button
              className={`preview-tab ${previewTab === "rendered" ? "preview-tab--active" : ""}`}
              onClick={() => setPreviewTab("rendered")}
              type="button"
            >
              Preview
            </button>
            <button
              className={`preview-tab ${previewTab === "html" ? "preview-tab--active" : ""}`}
              onClick={() => setPreviewTab("html")}
              type="button"
            >
              HTML
            </button>
          </div>

          {previewTab === "rendered" ? (
            <iframe
              className="preview-panel__iframe"
              srcDoc={`
                <html>
                  <head>
                    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600&display=swap" rel="stylesheet">
                    <style>
                      body { font-family: Lato, sans-serif; color: #2C1810; line-height: 1.75; padding: 1.5rem; background: #FDF8F0; }
                      h1,h2,h3 { font-family: 'Playfair Display', serif; color: #2C1810; margin: 1.2rem 0 0.5rem; }
                      p { margin-bottom: 1rem; }
                      a.btn { display:inline-block; padding: 0.7rem 1.6rem; background: #C8854A; color:#fff; border-radius:6px; text-decoration:none; font-weight:700; margin: 0.5rem 0 1.2rem; }
                      a.btn:hover { background: #A86A38; }
                    </style>
                  </head>
                  <body>${result.body_html}</body>
                </html>
              `}
              title="Content preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <pre className="preview-panel__code">{result.body_html}</pre>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="result-card__actions">
          {isDraft ? (
            <>
              <a className="btn-live" href={result.wp_preview_url} target="_blank" rel="noreferrer">
                👁 Preview in WordPress
              </a>
              <button
                className="btn-publish"
                type="button"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? <><span className="spinner" /> Publishing…</> : "🚀 Publish Now"}
              </button>
            </>
          ) : (
            <a className="btn-live" href={liveUrl} target="_blank" rel="noreferrer">
              🔗 View Live Page
            </a>
          )}
          <button className="btn-reset" type="button" onClick={onReset}>
            ↩ Generate Another
          </button>
        </div>
      </div>
    </article>
  );
}
