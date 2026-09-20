export function normalizePhone(value) {
  if (!value) return null;
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
  return digits.length === 11 && digits.startsWith("7") ? "+" + digits : null;
}

export function parseV1(email) {
  const body = email.body;
  const namePatterns = [
    /меня зовут\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /(?:^|[.!?]\s*)я\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /(?:^|[.!?]\s*)это\s+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Здравствуйте[,.\s]+([А-ЯЁA-Z][а-яёa-z-]+)/i,
    /Добрый день[!.]?\s+([А-ЯЁA-Z][а-яёa-z-]+)/i
  ];
  let name = null;
  for (const pattern of namePatterns) {
    const match = body.match(pattern);
    if (match) { name = match[1]; break; }
  }

  const phoneMatch = body.match(/(?:\+?7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s()\-]*\d{2}[\s()\-]*\d{2}/);
  const phone = phoneMatch ? normalizePhone(phoneMatch[0]) : null;

  const s = body.toLowerCase().replaceAll("ё", "е");
  let urgency = "LOW";
  if (/срочно|сегодня|завтра|через два часа|до конца рабочего дня|до обеда|к 10 утра|до 18:00|до 17:00|до 15:00/.test(s)) {
    urgency = "HIGH";
  } else if (/в течение (двух|2) (рабочих )?дн|в течение недели|до конца этой недели|до пятниц|до сред|до четверг|за 3–4 дня|3-4 дня/.test(s)) {
    urgency = "MEDIUM";
  }

  const topic = email.subject
    .replace(/^Запрос КП\s*[—-]\s*/i, "")
    .replace(/\s*[—-]\s*уточнение$/i, "")
    .trim();

  return { id: email.id, name, phone, topic, urgency, urgency_reason: "Baseline rules" };
}
