import OpenAI from "openai";
import type { EmailInput, ExtractedRow } from "../../../lib/schema";
import { SYSTEM_PROMPT_V1 } from "../../../lib/prompt-v1";

export const maxDuration = 300;

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { anyOf: [{ type: "string" }, { type: "null" }] },
          phone: { anyOf: [{ type: "string" }, { type: "null" }] },
          topic: { type: "string" },
          urgency: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
          urgency_reason: { type: "string" }
        },
        required: ["id", "name", "phone", "topic", "urgency", "urgency_reason"]
      }
    }
  },
  required: ["rows"]
} as const;

export async function POST(request: Request) {
  const body = await request.json();
  const emails = body?.emails as EmailInput[] | undefined;

  if (!Array.isArray(emails) || emails.length < 1 || emails.length > 10) {
    return Response.json({ error: "Provide 1-10 emails" }, { status: 400 });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!apiKey) {
    return Response.json(
      { error: "AI Gateway authentication is not available in this environment" },
      { status: 500 }
    );
  }

  const model = process.env.AI_MODEL || "openai/gpt-5.6-sol";
  const client = new OpenAI({
    apiKey,
    baseURL: "https://ai-gateway.vercel.sh/v1"
  });

  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: SYSTEM_PROMPT_V1 },
      { role: "user", content: JSON.stringify(emails, null, 2) }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "email_extraction",
        strict: true,
        schema
      }
    }
  });

  const parsed = JSON.parse(response.output_text) as { rows: ExtractedRow[] };

  return Response.json({
    rows: parsed.rows,
    model,
    usage: response.usage ?? null
  });
}
