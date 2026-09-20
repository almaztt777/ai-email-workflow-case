# What was difficult / what I would do differently

1. The hardest part was not extracting a phone number; it was defining what counts as a correct answer before seeing the model/parser output.
2. I therefore froze ground truth before V1 and separated 10 holdout emails.
3. V1 showed that simple keyword urgency logic fails on negation and relative dates.
4. It also showed that names in greetings/signatures and topics hidden in the body need different handling.
5. I fixed only failure classes observed on the 40-email development set.
6. V2 improved full-row accuracy from 65% to 95% on that set.
7. On untouched holdout data full-row accuracy was 80%, which shows the remaining generalization gap honestly.
8. With more time I would add confidence scoring and route low-confidence rows to an AI fallback/manual review queue.
9. I would also time a real manual 10-email sample instead of using a planning assumption for time savings.
