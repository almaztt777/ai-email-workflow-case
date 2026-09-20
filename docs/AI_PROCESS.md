# AI-assisted development process

The assignment explicitly requires visible AI usage and human correction. Below are representative prompts actually used during the work.

## Prompt 1 — clarify the assignment

**Prompt:** Explain exactly what the evaluator expects: what the automation must do, what artifact must be submitted, and whether synthetic emails are acceptable.

**What AI helped with:** reduced the task to email → structured row, plus evidence of errors and iteration.

**What I corrected:** the first framing over-focused on infrastructure. I narrowed the scope to the four required fields and one reproducible artifact.

## Prompt 2 — generate test data

**Prompt:** Create 50 realistic synthetic customer emails with varied names, phone formats, topics and urgency, including difficult edge cases.

**What AI helped with:** generated varied safe test data instead of exposing real customer correspondence.

**What I corrected:** added explicit edge cases: missing name, missing phone, two phones, negated urgency, forwarded old text and two topics in one email.

## Prompt 3 — architecture and technical specification

**Prompt:** Draft the technical specification, audit it, choose the current optimal platform, and minimize manual setup.

**What AI helped with:** compared n8n, Apps Script, Vercel and direct code approaches.

**What I corrected:** initially considered n8n Cloud, but that required a new account and extra setup. I moved the implementation to the already available GitHub + Vercel stack.

## Prompt 4 — debug deployment

**Prompt:** The Vercel build fails with an npm dependency conflict. Diagnose the error and make the smallest safe fix.

**What AI helped with:** identified the unused Zod dependency conflict with the OpenAI package.

**What I corrected:** removed only the unused dependency instead of forcing npm with legacy peer-deps.

## Prompt 5 — error-driven iteration

**Prompt:** Compare V1 output with frozen ground truth, group real failures by root cause, then change only rules justified by those failures.

**What AI helped with:** categorized failures around urgency negation, relative deadlines, greeting/signature name formats and topic extraction.

**What I corrected:** kept the 10-email holdout untouched and did not tune V2 against its remaining errors.

## Principle

AI was used as an engineering assistant, not as an unquestioned source of truth. Every important output was checked against a frozen dataset and the implementation was changed only when an observed failure justified it.
