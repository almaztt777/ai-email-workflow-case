import { normalizePhone } from "./parser-v1.mjs";

function lower(value) {
  return String(value ?? "").toLowerCase().replaceAll("ё", "е");
}

export function parseV2(email) {
  const body = email.body;

  const namePatterns = [
    /меня зовут\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Здравствуйте[.!]?\s*,?\s*это\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Здравствуйте[.!]?\s*,?\s*([А-ЯЁA-Z][а-яёa-z-]+)[,.!]/i,
    /Добрый день[!.]?\s+([А-ЯЁA-Z][а-яёa-z-]+)[,.!]/i,
    /(?:^|[.!?]\s*)я\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /С уважением,\s*([А-ЯЁA-Z][а-яёa-z-]+)/i
  ];
  const badNames = new Set(["Нужен","Нужна","Нужны","Требуется","Интересует","Просьба","Это","это"]);
  let name = null;
  for (const pattern of namePatterns) {
    const match = body.match(pattern);
    if (match && !badNames.has(match[1])) { name = match[1]; break; }
  }

  const matches = [...body.matchAll(/(?:\+?7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s()\-]*\d{2}[\s()\-]*\d{2}/g)];
  let selectedPhone = null;
  let bestScore = -99;
  for (const match of matches) {
    const index = match.index ?? 0;
    const context = lower(body.slice(Math.max(0, index - 45), index));
    let score = 0;
    if (/мой|основн|контакт|whatsapp|мобильн/.test(context)) score += 3;
    if (/общий|офис/.test(context)) score -= 3;
    if (score > bestScore) { bestScore = score; selectedPhone = match[0]; }
  }
  const phone = normalizePhone(selectedPhone);

  let current = lower(body).split("--- пересланное сообщение ---")[0];
  let urgency = "LOW";
  if (/срочности нет|не срочно|без срочности|срок не горит|срок не важен|можно без спешки/.test(current)) {
    urgency = "LOW";
  } else if (/сегодня|завтра|через два часа|до конца рабочего дня|до обеда|к 10 утра|до 18:00|до 17:00|до 15:00|очень срочно|срочно/.test(current)) {
    urgency = "HIGH";
  } else if (/в течение (двух|2) (рабочих )?дн|в течение двух дней|в течение недели|до конца этой недели|до конца недели|до пятниц|до сред|до четверг|крайний срок[^.]*четверг|за 3–4 дня|3-4 дня/.test(current)) {
    urgency = "MEDIUM";
  } else if (/следующ(ей|ую) недел|через три недели|в следующем месяце|до конца месяца|в течение двух недель/.test(current)) {
    urgency = "LOW";
  } else if (/до понедельник/.test(current)) {
    const received = new Date(email.received_at);
    const diff = (1 - received.getDay() + 7) % 7 || 7;
    urgency = diff <= 1 ? "HIGH" : "MEDIUM";
  }

  const topicPatterns = [
    /Нужны два предложения:\s*([^.]*)/i,
    /закупаем\s+([^.!?]+)/i,
    /(?:Нужен|Нужна|Нужны|Требуется|Требуются|Интересует|Запрашиваем|Ищем|Рассматриваем|Запрос на)\s+([^.!?]+)/i,
    /предложение на\s+([^.!?]+)/i
  ];
  let topic = null;
  for (const pattern of topicPatterns) {
    const match = body.match(pattern);
    if (match) { topic = match[1].trim(); break; }
  }
  if (!topic) topic = email.subject;
  if (/\bСЛР\b/i.test(email.subject) && !/\bСЛР\b/i.test(topic)) {
    topic = email.subject.replace(/^Запрос КП\s*[—-]\s*/i, "");
  }

  return { id: email.id, name, phone, topic, urgency, urgency_reason: "Improved after V1 error analysis" };
}
