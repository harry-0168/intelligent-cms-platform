import { useEffect, useState } from "react";

import { generatePage } from "./api/generate";
import AuditDashboard from "./components/AuditDashboard";
import BriefForm from "./components/BriefForm";
import BulkForm from "./components/BulkForm";
import BulkRunner from "./components/BulkRunner";
import CampaignKit from "./components/CampaignKit";
import PageLibrary from "./components/PageLibrary";
import PipelineTracker from "./components/PipelineTracker";
import ResultCard from "./components/ResultCard";

const TABS = [
  { id: "generate", label: "Generate",    icon: "⚡" },
  { id: "bulk",     label: "Bulk",        icon: "⚙" },
  { id: "campaign", label: "Campaign Kit",icon: "🚀" },
  { id: "library",  label: "Library",     icon: "📚" },
  { id: "audit",    label: "Audit",       icon: "🔍" },
];

export default function App() {
  const [tab, setTab]               = useState("generate");
  const [bulkBriefs, setBulkBriefs] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 3500);
    return () => clearInterval(timer);
  }, [loading]);

  const onSubmit = async (payload) => {
    setLoading(true);
    setError("");
    setResult(null);
    setActiveStep(0);
    try {
      const data = await generatePage(payload);
      setActiveStep(5);
      setResult(data);
    } catch (err) {
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      } else if (err?.code === "ERR_NETWORK") {
        setError(
          `Cannot reach backend at ${import.meta.env.VITE_API_URL || "http://localhost:8001"} — is uvicorn running?`
        );
      } else {
        setError(err?.message || "Failed to generate");
      }
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => { setResult(null); setError(""); setActiveStep(-1); };

  const switchTab = (id) => {
    setTab(id);
    if (id !== "bulk") setBulkBriefs(null);
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__icon">⚡</div>
          Intelligent CMS
        </div>

        <nav className="app-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`app-tab ${tab === t.id ? "app-tab--active" : ""}`}
              onClick={() => switchTab(t.id)}
              type="button"
            >
              <span className="app-tab__icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <span className="app-header__tag">GPT-4o · DALL-E 3 · WordPress</span>
      </header>

      {/* ── Library ── */}
      {tab === "library" && (
        <div className="page">
          <div className="page__hero">
            <h1 className="page__title">Content Library</h1>
            <p className="page__sub">All pages and posts in your WordPress site.</p>
          </div>
          <PageLibrary />
        </div>
      )}

      {/* ── Audit ── */}
      {tab === "audit" && (
        <div className="page">
          <div className="page__hero">
            <h1 className="page__title">Content Audit</h1>
            <p className="page__sub">
              SEO scoring, stale content detection, and one-click AI fixes — across all your pages and posts.
            </p>
          </div>
          <AuditDashboard />
        </div>
      )}

      {/* ── Campaign Kit ── */}
      {tab === "campaign" && (
        <div className="page">
          <div className="page__hero">
            <h1 className="page__title">Campaign Kit</h1>
            <p className="page__sub">
              Describe a campaign. AI plans a coherent set of pages and posts — you review the briefs, then run them all at once.
            </p>
          </div>
          <CampaignKit />
        </div>
      )}

      {/* ── Bulk ── */}
      {tab === "bulk" && (
        <div className="page">
          <div className="page__hero">
            <h1 className="page__title">Bulk Generation</h1>
            <p className="page__sub">
              Define multiple briefs manually — AI generates all of them sequentially with live progress.
            </p>
          </div>
          {bulkBriefs ? (
            <BulkRunner briefs={bulkBriefs} onReset={() => setBulkBriefs(null)} />
          ) : (
            <BulkForm onRun={(briefs) => setBulkBriefs(briefs)} />
          )}
        </div>
      )}

      {/* ── Generate ── */}
      {tab === "generate" && (
        <div className="page">
          <div className="page__hero">
            <h1 className="page__title">Generate branded content</h1>
            <p className="page__sub">
              Pages, posts, sections — AI writes the copy, generates the hero image, and sends it to WordPress.
            </p>
          </div>

          <div className="two-col">
            <aside>
              <BriefForm onSubmit={onSubmit} loading={loading} />
              {error && <div className="error-box">{error}</div>}
            </aside>

            <section className="right-panel">
              {(loading || activeStep >= 0) && (
                <PipelineTracker activeStep={activeStep} done={!loading && !!result} />
              )}
              {result ? (
                <ResultCard result={result} onReset={onReset} />
              ) : (
                !loading && activeStep < 0 && (
                  <div className="card empty-state">
                    <div className="empty-state__icon">📄</div>
                    <p className="empty-state__title">Result appears here</p>
                    <p className="empty-state__sub">
                      Fill in the brief on the left and hit Generate.
                    </p>
                  </div>
                )
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
