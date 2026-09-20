import WorkflowDemo from "../components/WorkflowDemo";

export default function Home() {
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#4b5563" }}>
          Технический кейс AI Workflow Automation Engineer
        </div>
        <h1 style={{ fontSize: 40, margin: "8px 0 10px" }}>Письмо → строка таблицы</h1>
        <p style={{ maxWidth: 820, fontSize: 18, lineHeight: 1.6, color: "#4b5563" }}>
          Программа берет текст письма и определяет имя, телефон, тему и срочность.
          Ниже можно отдельно запустить первую версию, исправленную версию и контрольные 10 писем.
        </p>
      </div>
      <WorkflowDemo />
    </main>
  );
}
