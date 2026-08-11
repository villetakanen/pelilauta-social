# `.border-radius` and `--cn-border-radius` disagree

`styles/spatial.css:7-10` applies `--cn-border-radius-large` (16px) from the utility
`.border-radius`, while the unsuffixed token `--cn-border-radius` resolves to the medium
step (8px). Two unsuffixed names, one system, two different corners.

The utility's step is deliberate — it is the Cyan 4 utility kept at Cyan's value, and 19
call sites in `apps/pelilauta` still carry the class. The token's step is equally
deliberate: a consumer that wants a rounded corner without choosing one gets medium.

It is a trap either way. A reader who learns one name and reaches for the other gets a
corner they did not ask for, and the design site can only document the discrepancy rather
than resolve it.

## Remaining change

Pick one exit when the Cyan sweep reaches these call sites:

- Repoint `.border-radius` at `--cn-border-radius`, and re-round the 19 consumers that
  were drawn against the large step.
- Rename the utility `.border-radius-large`, leaving the unsuffixed name to the token
  alone.

Until then `/principles/spatial-system` states the discrepancy rather than the rule.
`docs/MIGRATION.md` owns the call sites.
