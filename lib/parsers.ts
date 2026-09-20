export type EmailCase = {
  id: string;
  split: "train" | "holdout";
  received_at: string;
  subject: string;
  body: string;
};

export type ParsedRow = {
  id: string;
  name: string | null;
  phone: string | null;
  topic: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  urgency_reason: string;
};

export function normalizePhone(value: string | null | undefined) {
  if (!value) return null;
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
  return digits.length === 11 && digits.startsWith("7") ? "+" + digits : null;
}

const lower = (value: unknown) => String(value ?? "").toLowerCase().replaceAll("ё", "е");

export function parseV1(email: EmailCase): ParsedRow {
  const body = email.body;
  const patterns = [
    /меня зовут\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /(?:^|[.!?]\s*)я\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /(?:^|[.!?]\s*)это\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Здравствуйте[,.\s]+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Добрый день[!.]?\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
  ];
  let name: string | null = null;
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) { name = match[1]; break; }
  }

  const phoneMatch = body.match(/(?:\+?7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s()\-]*\d{2}[\s()\-]*\d{2}/);
  const phone = phoneMatch ? normalizePhone(phoneMatch[0]) : null;

  const s = lower(body);
  let urgency: ParsedRow["urgency"] = "LOW";
  if (/срочно|сегодня|завтра|через два часа|до конца рабочего дня|до обеда|к 10 утра|до 18:00|до 17:00|до 15:00/.test(s)) urgency = "HIGH";
  else if (/в течение (двух|2) (рабочих )?дн|в течение недели|до конца этой недели|до пятниц|до сред|до четверг|за 3–4 дня|3-4 дня/.test(s)) urgency = "MEDIUM";

  const topic = email.subject.replace(/^Запрос КП\s*[—-]\s*/i, "").replace(/\s*[—-]\s*уточнение$/i, "").trim();

  return { id: email.id, name, phone, topic, urgency, urgency_reason: "Baseline rules" };
}

export function parseV2(email: EmailCase): ParsedRow {
  const body = email.body;
  const patterns = [
    /меня зовут\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Здравствуйте[.!]?\s*,?\s*это\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Здравствуйте[.!]?\s*,?\s*([А-ЯЁA-Z][а-яёa-z-]+)[,.!]/i,
    /Добрый день[!.]?\s+([А-ЯЁA-Z][а-яёa-z-]+)[,.!]/i,
    /(?:^|[.!?]\s*)я\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /С уважением,\s*([А-ЯЁA-Z][а-яёa-z-]+)/i,
  ];
  const bad = new Set(["Нужен","Нужна","Нужны","Требуется","Интересует","Просьба","Это","это"]);
  let name: string | null = null;
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && !bad.has(match[1])) { name = match[1]; break; }
  }

  const matches = [...body.matchAll(/(?:\+?7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s()\-]*\d{2}[\s()\-]*\d{2}/g)];
  let selected: string | null = null;
  let bestScore = -99;
  for (const match of matches) {
    const index = match.index ?? 0;
    const context = lower(body.slice(Math.max(0, index - 45), index));
    let score = 0;
    if (/мой|основн|контакт|whatsapp|мобильн/.test(context)) score += 3;
    if (/общий|офис/.test(context)) score -= 3;
    if (score > bestScore) { bestScore = score; selected = match[0]; }
  }
  const phone = normalizePhone(selected);

  let current = lower(body).split("--- пересланное сообщение ---")[0];
  let urgency: ParsedRow["urgency"] = "LOW";
  if (/срочности нет|не срочно|без срочности|срок не горит|срок не важен|можно без спешки/.test(current)) urgency = "LOW";
  else if (/сегодня|завтра|через два часа|до конца рабочего дня|до обеда|к 10 утра|до 18:00|до 17:00|до 15:00|очень срочно|срочно/.test(current)) urgency = "HIGH";
  else if (/в течение (двух|2) (рабочих )?дн|в течение двух дней|в течение недели|до конца этой недели|до конца недели|до пятниц|до сред|до четверг|крайний срок[^.]*четверг|за 3–4 дня|3-4 дня/.test(current)) urgency = "MEDIUM";
  else if (/следующ(ей|ую) недел|через три недели|в следующем месяце|до конца месяца|в течение двух недель/.test(current)) urgency = "LOW";
  else if (/до понедельник/.test(current)) {
    const received = new Date(email.received_at);
    const diff = (1 - received.getDay() + 7) % 7 || 7;
    urgency = diff <= 1 ? "HIGH" : "MEDIUM";
  }

  const topicPatterns = [
    /Нужны два предложения:\s*([^.]*)/i,
    /закупаем\s+([^.!?]+)/i,
    /(?:Нужен|Нужна|Нужны|Требуется|Требуются|Интересует|Запрашиваем|Ищем|Рассматриваем|Запрос на)\s+([^.!?]+)/i,
    /предложение на\s+([^.!?]+)/i,
  ];
  let topic: string | null = null;
  for (const pattern of topicPatterns) {
    const match = body.match(pattern);
    if (match) { topic = match[1].trim(); break; }
  }
  if (!topic) topic = email.subject;
  if (/\bСЛР\b/i.test(email.subject) && !/\bСЛР\b/i.test(topic)) topic = email.subject.replace(/^Запрос КП\s*[—-]\s*/i, "");

  return { id: email.id, name, phone, topic, urgency, urgency_reason: "Improved after V1 error analysis" };
}
