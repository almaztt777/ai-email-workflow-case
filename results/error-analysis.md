# Error analysis

## Baseline V1

Metrics: {"name":90,"phone":100,"topic":93,"urgency":78,"full":65}

Observed failure classes:
- urgency keyword matching ignored negation such as "не срочно" / "срочности нет";
- relative deadlines such as "до понедельника" were not resolved against the email date;
- greeting/signature formats caused name extraction failures;
- subject-only topic extraction lost important detail found only in the email body.

V1 had 14 rows with at least one mismatch out of 40.

## V2

V2 changed only rules justified by V1 failures:
- negative urgency phrases are evaluated before high-urgency keywords;
- relative deadlines are handled;
- more greeting/signature patterns are supported;
- topic extraction prefers the current message body and falls back to subject;
- phone selection prefers personal/primary/contact context.

V2 train metrics: {"name":98,"phone":100,"topic":98,"urgency":100,"full":95}

## Holdout (emails 41-50)

The holdout was not used to tune V2.

Holdout metrics: {"name":90,"phone":100,"topic":100,"urgency":90,"full":80}

Remaining holdout failures:
- 45: {"name":false,"phone":true,"topic":true,"urgency":true} — output: {"id":"45","name":null,"phone":"+77000004545","topic":"тренажёр венепункции","urgency":"HIGH","urgency_reason":"Improved after V1 error analysis"}; expected: {"name":"Сабина","phone":"+77000004545","topic":"тренажёр венепункции","urgency":"HIGH"}
- 46: {"name":true,"phone":true,"topic":true,"urgency":false} — output: {"id":"46","name":"Арсен","phone":"+77000004646","topic":"симулятор пациента","urgency":"HIGH","urgency_reason":"Improved after V1 error analysis"}; expected: {"name":"Арсен","phone":"+77000004646","topic":"симулятор пациента","urgency":"LOW"}

These remaining failures are intentionally left visible rather than tuning against the holdout.
