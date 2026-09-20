# AI Email Workflow Case

Technical case for an **AI Workflow Automation Engineer**.

## Result in one minute

The workflow converts semi-structured customer emails into four required fields:

**name · phone · topic · urgency**

Measured on synthetic but realistic email data:

| Metric | V1 (40) | V2 (40) | Holdout V2 (10) |
|---|---:|---:|---:|
| Name accuracy | 90% | 98% | 90% |
| Phone accuracy | 100% | 100% | 100% |
| Topic accuracy | 93% | 98% | 100% |
| Urgency accuracy | 78% | 100% | 90% |
| **Full-row accuracy** | **65%** | **95%** | **80%** |

The holdout set was not used to tune V2.

## What this demonstrates

`dataset → frozen ground truth → V1 → real failures → targeted fixes → V2 → untouched holdout`

The main observed V1 failures were:
- urgency keywords ignoring negation such as “не срочно”;
- relative deadlines;
- names in greetings/signatures;
- important topic details present in the body but not in the subject.

All remaining holdout failures are left visible rather than tuned away.

## Stack

- **Next.js + TypeScript**
- **Vercel**
- **GitHub**
- deterministic V1/V2 parsers for reproducible measured evaluation
- optional **Vercel AI Gateway / OpenAI-compatible endpoint** for AI extraction experiments

For this case I deliberately kept deterministic fields deterministic and used AI as a development/analysis assistant instead of paying for an LLM call where rules were sufficient.

## Dataset and privacy

- 40 development/evaluation emails
- 10 untouched holdout emails
- all names, phone numbers and requests are fictional
- no real customer correspondence is published

Files:
- `data/emails.json`
- `data/ground-truth.json`

## Reproduce evaluation

```bash
npm install
npm run evaluate
```

Parsers:
- `scripts/parser-v1.mjs`
- `scripts/parser-v2.mjs`

Measured outputs:
- `results/v1-results.csv`
- `results/v2-results.csv`
- `results/holdout-results.csv`
- `results/metrics.json`
- `results/error-analysis.md`

## Urgency rubric

- **HIGH** — today / tomorrow / <=24h / explicitly urgent in the current request
- **MEDIUM** — approximately 2–7 days
- **LOW** — more than 7 days, no deadline, or explicitly not urgent

## Cost and time

Measured deterministic parser cost: **$0 per email**.

For time savings I use a transparent planning assumption of ~60 seconds manual handling per short email. That gives roughly **95–100 minutes saved per 100 emails** after allowing a few minutes for automated ingestion/export.

I did not invent an AI-token cost because the measured V1/V2 runs did not require model calls. The optional AI endpoint returns usage data so real cost can be logged when enabled.

Full analysis: `docs/COST_TIME_SCALE.md`.

## What changes at 10,000 emails/day

First production change:

`email ingestion → durable queue → idempotent workers → validation → database → reporting`

Add:
- provider message ID as idempotency key;
- retries + dead-letter queue;
- database instead of spreadsheet as the system of record;
- rate-limit handling;
- throughput/latency/error/cost monitoring;
- deterministic extraction for easy fields and AI only for ambiguous cases.

## AI-assisted development

Five representative AI prompts plus what had to be corrected manually are documented in:

`docs/AI_PROCESS.md`

Key correction examples:
- narrowed the original over-engineered architecture;
- added missing edge cases to the dataset;
- switched from n8n to existing GitHub + Vercel to remove setup overhead;
- fixed a real Vercel dependency conflict without forcing unsafe npm flags;
- kept holdout data untouched during tuning.

## Technical specification

See `docs/TECH_SPEC.md`.

## What was difficult / what I would do differently

See `docs/RETROSPECTIVE.md`.

Short version:
1. correctness had to be defined before looking at output;
2. V1 exposed context/negation failures;
3. fixes were tied to observed failures only;
4. V2 rose from 65% to 95% full-row accuracy;
5. holdout stayed lower at 80%, showing the remaining generalization gap honestly;
6. with more time I would add confidence scoring, AI fallback/manual review, and a measured manual-time study.

## Deployment

The repository is connected to Vercel and deploys from `main`.
