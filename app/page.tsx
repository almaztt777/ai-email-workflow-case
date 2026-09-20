import WorkflowDemo from "../components/WorkflowDemo";

export default function Home() {
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#4b5563" }}>
          AI Workflow Automation Engineer — Technical Case
        </div>
        <h1 style={{ fontSize: 40, margin: "8px 0 10px" }}>Email → Structured Table</h1>
        <p style={{ maxWidth: 820, fontSize: 18, lineHeight: 1.6, color: "#4b5563" }}>
          A reproducible workflow that extracts name, phone, topic and urgency from semi-structured
          inbound emails, measures errors against frozen ground truth, and supports a visible V1 → V2 iteration.
        </p>
      </div>
      <WorkflowDemo />
    </main>
  );
}
