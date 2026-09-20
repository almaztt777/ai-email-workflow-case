"use client";

import { useMemo, useState } from "react";
import emails from "../data/emails.json";
import truth from "../data/ground-truth.json";
import { parseV1, parseV2, normalizePhone, type EmailCase, type ParsedRow } from "../lib/parsers";

const norm = (s: string | null | undefined) =>
  (s ?? "").toLocaleLowerCase("ru-RU").replace(/ё/g, "е").trim();

function scoreRows(rows: ParsedRow[]) {
  let name = 0, phone = 0, urgency = 0, topic = 0, full = 0;
  for (const row of rows) {
    const gt = truth.find((x) => x.id === row.id);
    if (!gt) continue;
    const nameOk = norm(row.name) === norm(gt.name);
    const phoneOk = normalizePhone(row.phone) === normalizePhone(gt.phone);
    const outputTopic = norm(row.topic);
    const topicOk = gt.topic_terms.every((term) => outputTopic.includes(norm(term)));
    const urgencyOk = row.urgency === gt.urgency;
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

function toCsv(rows: ParsedRow[]) {
  const esc = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  return [
    ["id", "name", "phone", "topic", "urgency", "urgency_reason"].join(","),
    ...rows.map((r) => [r.id, r.name, r.phone, r.topic, r.urgency, r.urgency_reason].map(esc).join(",")),
  ].join("\n");
}

export default function WorkflowDemo() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [label, setLabel] = useState("");

  const metrics = useMemo(() => scoreRows(rows), [rows]);

  function run(mode: "v1" | "v2" | "holdout") {
    const parser = mode === "v1" ? parseV1 : parseV2;
    const split = mode === "holdout" ? "holdout" : "train";
    const selected = (emails as EmailCase[]).filter((e) => e.split === split);
    setRows(selected.map(parser));
    setLabel(mode === "v1" ? "V1 on 40 development emails" : mode === "v2" ? "V2 on 40 development emails" : "V2 on untouched 10-email holdout");
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
        <p>40 development/evaluation emails + 10 untouched holdout emails. All data is synthetic.</p>
        <p style={{ color: "#6b7280" }}>
          Ground truth was frozen before V1. The holdout was not used to tune V2.
        </p>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>2. Run the workflow</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => run("v1")} style={{ padding: "10px 16px", cursor: "pointer" }}>Run V1 — 40 emails</button>
          <button onClick={() => run("v2")} style={{ padding: "10px 16px", cursor: "pointer" }}>Run V2 — 40 emails</button>
          <button onClick={() => run("holdout")} style={{ padding: "10px 16px", cursor: "pointer" }}>Run holdout — 10 emails</button>
          {rows.length > 0 && <button onClick={downloadCsv} style={{ padding: "10px 16px", cursor: "pointer" }}>Download CSV</button>}
        </div>
        {label && <p style={{ color: "#4b5563", marginBottom: 0 }}>{label}</p>}
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
              ].map(([metric, value]) => (
                <div key={String(metric)} style={{ background: "#f9fafb", padding: 16, borderRadius: 10 }}>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{metric}</div>
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
