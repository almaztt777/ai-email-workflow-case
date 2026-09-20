export type Urgency = "HIGH" | "MEDIUM" | "LOW";

export type EmailInput = {
  id: string;
  received_at: string;
  subject: string;
  body: string;
};

export type ExtractedRow = {
  id: string;
  name: string | null;
  phone: string | null;
  topic: string;
  urgency: Urgency;
  urgency_reason: string;
};
