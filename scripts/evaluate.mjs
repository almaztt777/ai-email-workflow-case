import fs from "node:fs";
import { parseV1, normalizePhone } from "./parser-v1.mjs";
import { parseV2 } from "./parser-v2.mjs";

const emails = JSON.parse(fs.readFileSync(new URL("../data/emails.json", import.meta.url)));
const truth = JSON.parse(fs.readFileSync(new URL("../data/ground-truth.json", import.meta.url)));

const norm = (s) => String(s ?? "").toLowerCase().replaceAll("ё", "е").trim();

function evaluate(parser, split) {
  const selected = emails.filter((x) => x.split === split);
  const rows = selected.map(parser);
  const stats = { name: 0, phone: 0, topic: 0, urgency: 0, full: 0 };
  const errors = [];

  for (const row of rows) {
    const gt = truth.find((x) => x.id === row.id);
    const checks = {
      name: norm(row.name) === norm(gt.name),
      phone: normalizePhone(row.phone) === normalizePhone(gt.phone),
      topic: gt.topic_terms.every((term) => norm(row.topic).includes(norm(term))),
      urgency: row.urgency === gt.urgency
    };
    for (const key of ["name","phone","topic","urgency"]) stats[key] += Number(checks[key]);
    const full = Object.values(checks).every(Boolean);
    stats.full += Number(full);
    if (!full) errors.push({ id: row.id, row, expected: gt, checks });
  }

  const percent = Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [key, Math.round((value / rows.length) * 100)])
  );

  return { split, count: rows.length, percent, errors, rows };
}

const report = {
  generated_at: new Date().toISOString(),
  v1_train: evaluate(parseV1, "train"),
  v2_train: evaluate(parseV2, "train"),
  v2_holdout: evaluate(parseV2, "holdout")
};

console.log(JSON.stringify(report, null, 2));
