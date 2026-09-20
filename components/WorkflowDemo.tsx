"use client";

import { useMemo, useState } from "react";
import emails from "../data/emails.json";
import truth from "../data/ground-truth.json";
import type { ExtractedRow } from "../lib/schema";

type ApiResponse = {
  rows: ExtractedRow[];
  model: string;
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  } | null;
};

function norm(s: string | null | undefined) {
  return (s ?? "").toLocaleLowerCase("ru-RU").replace(/ё/g, "е").trim();
}

function phoneNorm(s: string | null | undefined) {
  if (!s) return "";
  const d = s.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) return "7" + d.slice(1);
  return d;
}

function scoreRows(rows: ExtractedRow[]) {
  let name = 0, phone = 0, urgency = 0, topic = 0, full = 0;
  for (const row of rows) {
    const gt = truth.find((x) => x.id === row.id);
    if (!gt) continue;
    const nameOk = norm(row.name) === norm(gt.name);
    const phoneOk = phoneNorm(row.phone) === phoneNorm(gt.phone);
    const urgencyOk = row.urgency === gt.urgency;
    const outputTopic = norm(row.topic);
    const topicOk = gt.topic_terms.every((term) => outputTopic.includes(norm(term)));
    name += Number(nameOk);
    phone += Number(phoneOk);
    urgency += Number(urgencyOk);
    topic += Number(topicOk);
    full += Number(nameOk && phoneOk && urgencyOk && topicOk);
  }
  const n = rows.length || 1;
  return {
    n: rows.length,
    name: Math.round((name / n) * 100),
    phone: Math.round((phone / n) * 100),
    topic: Math.round((topic / n) * 100),
    urgency: Math.round((urgency / n) * 100),
    full: Math.round((full / n) * 100),
  };
}

function toCsv(rows: ExtractedRow[]) {
  const esc = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  return [
    ["id", "name", "phone", "topic", "urgency", "urgency_reason"].join(","),
    ...rows.map((r) => [r.id, r.name, r.phone, r.topic, r.urgency, r.urgency_reason].map(esc).join(",")),
  ].join("\n");
}

export default function WorkflowDemo() {
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [running, setRunning] = useState(false);
  const [model, setModel] = useState("");
  const [usage, setUsage] = useState({ input: 0, output: 0, total: 0 });
  const [error, setError] = useState("");

  const metrics = useMemo(() => scoreRows(rows), [rows]);

  async function run(split: "train" | "holdout") {
    setRunning(true);
    setRows([]);
    setError("");
    setUsage({ input: 0, output: 0, total: 0 });

    try {
      const selected = emails.filter((e) => e.split === split);
      const all: ExtractedRow[] = [];
      let input = 0, output = 0, total = 0;

      for (let i = 0; i < selected.length; i += 10) {
        const batch = selected.slice(i, i + 10).map(({ id, received_at, subject, body }) => ({
          id, received_at, subject, body
        }));

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ emails: batch }),
        });

        const data = (await response.json()) as ApiResponse & { error?: string };
        if (!response.ok) throw new Error(data.error || "Extraction failed");

        all.push(...data.rows);
        setRows([...all]);
        setModel(data.model);
        input += data.usage?.input_tokens ?? 0;
        output += data.usage?.output_tokens ?? 0;
        total += data.usage?.total_tokens ?? 0;
        setUsage({ input, output, total });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extraction-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const card: React.CSSProperties = {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>1. Dataset</h2>
        <p>40 development/evaluation emails + 10 holdout emails. All data is synthetic.</p>
        <p style={{ color: "#6b7280" }}>
          Ground truth was frozen before the first model run. The holdout set is intentionally separated
          so V2 can be checked on unseen edge cases.
        </p>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>2. Run baseline V1</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button disabled={running} onClick={() => run("train")} style={{ padding: "10px 16px", cursor: "pointer" }}>
            {running ? "Running…" : "Run V1 on 40 emails"}
          </button>
          <button disabled={running} onClick={() => run("holdout")} style={{ padding: "10px 16px", cursor: "pointer" }}>
            Run holdout 10
          </button>
          {rows.length > 0 && <button onClick={downloadCsv} style={{ padding: "10px 16px", cursor: "pointer" }}>Download CSV</button>}
        </div>
        {error && <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>}
        {model && <p style={{ color: "#6b7280" }}>Model: {model} · tokens: {usage.total} ({usage.input} in / {usage.output} out)</p>}
      </section>

      {rows.length > 0 && (
        <>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>3. Measured accuracy</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
              {[
                ["Name", metrics.name],
                ["Phone", metrics.phone],
                ["Topic", metrics.topic],
                ["Urgency", metrics.urgency],
                ["Full row", metrics.full],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ background: "#f9fafb", padding: 16, borderRadius: 10 }}>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{value}%</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...card, overflowX: "auto" }}>
            <h2 style={{ marginTop: 0 }}>4. Output table</h2>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
              <thead>
                <tr>
                  {["ID", "Name", "Phone", "Topic", "Urgency", "Reason"].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.id}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.name ?? "—"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.phone ?? "—"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.topic}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee", fontWeight: 700 }}>{r.urgency}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.urgency_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
