# Bugs

When a defect or missing functionality is found, v21 uses
following priority labeling
* Critical: loss of major functionality, leak of PII data
* Major: loss of single feature, missing or extra ux
* Trivial: pre-exists in v18, or is only cosmetic

## Opportunity for improvement

`Trivial` combines low-impact defects with defects we choose to defer or consider
not worth fixing. These judgments describe different properties: severity states
the impact, while disposition states what we intend to do about it. A defect
that pre-exists in v18 can still have a major impact.

A future revision could separate severity (`Critical`, `Major`, `Minor`) from
disposition (`deferred`, `wontfix`). Release scope could then use severity and
explicit disposition decisions together. This is an improvement proposal; the
priority labels above remain the current practice.
