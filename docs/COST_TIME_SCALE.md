# Cost, time and scale

## Cost per run

The measured V1/V2 evaluation uses deterministic code, so the incremental model/API cost of the parser itself is:

**$0 per email / $0 per 100 emails.**

Vercel/GitHub are used within the existing project limits for this small technical case.

The repository also contains an optional AI extraction endpoint through Vercel AI Gateway. I did not use unmeasured AI Gateway calls to fabricate cost numbers. In production I would log token usage and calculate cost from the actual model invoice.

## Time saved on 100 emails

For a transparent estimate I use a conservative manual-processing assumption:

- open/read one short email;
- identify name, phone, topic and urgency;
- enter four fields in a table;
- **~60 seconds per email** as a planning assumption.

Therefore:

- manual: 100 × 60 sec = **100 minutes**;
- automated parser: computation is effectively seconds for this batch; the dominant time becomes ingestion/export rather than field extraction;
- estimated saving: **about 95–100 minutes per 100 emails**.

This is explicitly an estimate, not a claimed stopwatch measurement. With more time I would time a 10-email manual sample and replace the assumption with measured median handling time.

## What breaks at 10,000 emails/day

The demo intentionally processes a small batch. At 10,000/day the first risks are not the parsing rules but the surrounding architecture:

1. ingestion rate limits and bursts;
2. duplicate/retried messages;
3. synchronous processing bottlenecks;
4. spreadsheet write contention;
5. lack of retry/dead-letter handling;
6. insufficient observability;
7. cost growth if every message is sent to an LLM.

## First production changes

The first change would be to **decouple ingestion from processing**:

email provider / webhook
→ durable queue
→ idempotent workers
→ validation
→ database
→ reporting/export

Then I would add:

- provider message ID as idempotency key;
- bounded retries with exponential backoff;
- dead-letter queue;
- database as system of record instead of Google Sheets;
- metrics for throughput, latency, errors and per-message cost;
- deterministic parsing for easy fields and AI only for ambiguous semantic cases.

That keeps both reliability and AI cost under control.
