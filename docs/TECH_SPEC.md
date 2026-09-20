# Technical Specification

## 1. Objective

Build a reproducible automation that converts inbound email text into a structured table row with:

- name
- phone
- topic
- urgency

The case must show not only the final result but the engineering process: baseline, failures, fixes and re-test.

## 2. Dataset

- 40 synthetic emails: development/evaluation set
- 10 synthetic emails: untouched holdout set
- No real customer data is published
- Ground truth is frozen before the first model run

## 3. Urgency rubric

- HIGH: today, tomorrow, within 24 hours, or explicitly urgent in the current request
- MEDIUM: approximately 2-7 days
- LOW: more than 7 days, no deadline, or explicitly not urgent

## 4. Functional requirements

1. Accept email subject, body, id and received timestamp.
2. Return one row per email.
3. Never invent a missing name or phone.
4. Normalize an unambiguous Kazakhstan phone to +7XXXXXXXXXX.
5. Return only HIGH / MEDIUM / LOW urgency.
6. Preserve multiple requested topics when necessary.
7. Return a short urgency explanation.
8. Expose token usage for cost measurement.
9. Keep credentials outside GitHub.

## 5. Evaluation

Metrics:
- name accuracy
- phone accuracy
- urgency accuracy
- topic keyword coverage
- full-row accuracy

Protocol:
1. Freeze ground truth.
2. Run V1 on emails 01-40.
3. Record every mismatch.
4. Group failures by root cause.
5. Change V2 only where observed failures justify it.
6. Re-run the same 40.
7. Run V2 once on emails 41-50.
8. Report remaining limitations.

## 6. Production scaling to 10,000 emails/day

The demo is intentionally small-scale. At production scale the first changes are:
- decouple ingestion and processing
- introduce a durable queue
- idempotency by provider message id
- bounded retries and dead-letter handling
- database as system of record instead of a spreadsheet
- rate-limit management
- latency, cost and extraction-quality monitoring
