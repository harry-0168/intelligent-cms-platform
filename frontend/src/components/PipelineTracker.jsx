const STEPS = [
  { label: "Reading brand theme config",      icon: "📖" },
  { label: "Generating copy with GPT-4o",     icon: "✍️" },
  { label: "Creating hero image with DALL-E", icon: "🎨" },
  { label: "Uploading image to AWS S3",        icon: "☁️" },
  { label: "Publishing to WordPress",          icon: "🚀" },
];

export default function PipelineTracker({ activeStep, done }) {
  return (
    <div className="card pipeline-card">
      <p className="pipeline-card__heading">Pipeline</p>
      <div className="pipeline-steps">
        {STEPS.map((step, idx) => {
          const isDone   = done || idx < activeStep;
          const isActive = !done && idx === activeStep;
          const cls      = isDone ? "done" : isActive ? "active" : "";
          return (
            <div key={step.label} className={`pipeline-step ${cls}`}>
              <div className="step-dot">
                {isDone ? "✓" : isActive ? step.icon : idx + 1}
              </div>
              <div className="step-body">
                <span className="step-label">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
