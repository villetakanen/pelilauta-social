# Next-Task Evaluation Rubric

Judge the proposal against the supplied request and repository evidence. Report
each criterion as met, unmet, or unverified, citing the relevant proposal text.

| Criterion | Evidence required |
| --- | --- |
| Deliverable value | The proposal identifies one useful outcome and who benefits. No later task is required to make the outcome usable. |
| Technical specificity | The proposal names the changed artifacts or behaviors and explains the essential implementation boundary. An experienced operator can accept or correct the scope from the proposal. |
| Basis | The proposal connects the chosen work to inspected source, a reported failure, a governing spec, or the epic. Its timing follows from that evidence. |
| Starting readiness | Required governing specs are live before implementation begins. A missing or proposed required spec leads to a concrete specification increment. Work requiring no spec does not acquire an invented approval gate. |
| Learning during work | Possible discoveries and amendments do not disqualify work that starts from live specs. Amendment handling follows `AGENTS.md`. |
| Completion evidence | The proposal identifies a check or observable result that establishes the outcome. |
| Execution risks | Material uncertainties and compatibility concerns attach to concrete changes. The proposal distinguishes decisions needed before starting from details implementation can resolve. |
| Readability | A descriptive title and approximately 10–15 lines convey a technical proposal. Paragraphs or a short list support the content without mandatory labels or character caps. |

Exercise readiness with a missing required spec, a proposed required spec, a live
spec with likely amendments, and a harness or documentation change requiring no
spec. Judge these as separate requests; each receives one proposed increment.

`evals/eval.sh next-task <candidate-file>` points to this rubric without assigning
a passing grade. Line wrapping, keyword presence, and paragraph counts cannot
establish proposal quality. Report unverified source claims and readiness states
when the evaluation lacks their supporting artifacts.
