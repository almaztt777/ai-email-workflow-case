# AI Email Workflow Case

Technical case for an **AI Workflow Automation Engineer**.

## Goal

Turn semi-structured customer emails into structured rows:

- name
- phone
- topic
- urgency

The project demonstrates a real engineering iteration:

dataset → baseline (V1) → error analysis → fixes → V2 → holdout validation

## Stack

- Next.js + TypeScript
- Vercel
- Vercel AI SDK / AI Gateway
- Zod structured output
- GitHub for version history and evidence

No customer data is included. The dataset is synthetic but intentionally realistic.

## Dataset

- 40 emails: development/evaluation set
- 10 emails: holdout set
- Edge cases include missing names, missing phones, multiple phones, negated urgency, quoted messages, and multiple topics.

## Urgency rubric

- HIGH — today / tomorrow / <=24h / explicitly urgent in current context
- MEDIUM — approximately 2–7 days
- LOW — more than 7 days, no deadline, or explicitly not urgent

## Architecture

Synthetic email dataset → Next.js API → AI structured extraction → validation → table/CSV → evaluation

## Status

- [x] Repository scaffold
- [ ] 50-message dataset
- [ ] Ground truth
- [x] Baseline extraction endpoint
- [ ] Run V1 on 40 emails
- [ ] Record real errors
- [ ] Implement V2 based only on observed failures
- [ ] Validate on 10-message holdout
- [ ] Add measured cost/time analysis
- [ ] Final technical write-up

## Privacy

All names, phone numbers and requests in the dataset are fictional. No real customer correspondence is published.
