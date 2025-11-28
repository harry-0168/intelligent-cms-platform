import { useEffect, useState } from "react";
import { fetchPages, publishPage } from "../api/generate";

const STATUS_COLORS = {
  publish: { bg: "#D1FAE5", text: "#065F46" },
  draft:   { bg: "#FEF3C7", text: "#92400E" },
  pending: { bg: "#DBEAFE", text: "#1E40AF" },
  private: { bg: "#EDE9FE", text: "#5B21B6" },
};

export default function PageLibrary() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [publishing, setPublishing] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const load = () => {
    setLoading(true);
    setError("");
    fetchPages()
      .then(setItems)
      .catch((e) =>
        setError(
          (e.response?.data?.detail || e.message) +
            " — is the backend running?"
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handlePublish = async (item) => {
    setPublishing(item.id);
    try {
      await publishPage(item.id, item.content_type);
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "publish" } : p))
      );
    } catch (e) {
      alert("Failed to publish: " + (e.response?.data?.detail || e.message));
    } finally {
      setPublishing(null);
    }
  };

  const filtered =
    typeFilter === "all" ? items : items.filter((i) => i.content_type === typeFilter);

  if (loading)
    return (
      <div className="library-state">
        <span className="spinner" style={{ width: 24, height: 24 }} />
        <p>Loading content from WordPress…</p>
      </div>
    );

  if (error) return <div className="error-box">{error}</div>;

  return (
    <div className="library">
      <div className="library__header">
        <div>
          <h2 className="library__title">Content Library</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", margin: 0 }}>
            {items.length} items total — {items.filter((i) => i.content_type === "page").length} pages,{" "}
            {items.filter((i) => i.content_type === "post").length} posts
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div className="chip-group">
            {[
              { id: "all",  label: "All" },
              { id: "page", label: "📄 Pages" },
              { id: "post", label: "📝 Posts" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip chip--sm ${typeFilter === t.id ? "chip--active" : ""}`}
                onClick={() => setTypeFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="btn-refresh" type="button" onClick={load}>↻</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__icon">📚</div>
          <p className="empty-state__title">No {typeFilter === "all" ? "content" : typeFilter + "s"} yet</p>
          <p className="empty-state__sub">Use Generate or Campaign Kit to create your first piece.</p>
        </div>
      ) : (
        <div className="library__grid">
          {filtered.map((item) => {
            const sc = STATUS_COLORS[item.status] || STATUS_COLORS.draft;
            return (
              <div key={`${item.content_type}-${item.id}`} className="lib-card">
                <div className="lib-card__header">
                  <span
                    className="lib-card__type"
                  >
                    {item.content_type === "post" ? "📝 Post" : "📄 Page"}
                  </span>
                  <span
                    className="lib-card__status"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="lib-card__title">{item.title || "(Untitled)"}</p>

                <p className="lib-card__date">
                  Updated{" "}
                  {new Date(item.modified).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                <div className="lib-card__actions">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="lib-btn lib-btn--view"
                  >
                    {item.status === "publish" ? "View" : "Preview"}
                  </a>

                  {item.status !== "publish" && (
                    <button
                      type="button"
                      className="lib-btn lib-btn--publish"
                      disabled={publishing === item.id}
                      onClick={() => handlePublish(item)}
                    >
                      {publishing === item.id ? <span className="spinner spinner--xs" /> : "Publish"}
                    </button>
                  )}

                  <a
                    href={`${import.meta.env.VITE_WP_ADMIN_URL || "http://cms-platform.local/wp-admin"}/post.php?post=${item.id}&action=edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="lib-btn lib-btn--edit"
                  >
                    Edit
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
