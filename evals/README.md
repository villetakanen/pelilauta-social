# Skill Evaluations (evals)

Lightweight evaluation harness for testing and grading agent skills using `agy`, `claude-code`, `codex`, or manual evaluation.

## Structure

```
evals/
├── README.md
├── eval.sh                 # Runner script for deterministic checks and grading
├── skills/
│   ├── technical-writer/   # Evaluation for technical prose rewriting
│   │   ├── fixture.md      # Input prose containing known style defects
│   │   ├── prompt.md       # Task prompt given to the candidate subagent
│   │   └── rubric.md       # Scoring criteria and automated checks
│   ├── next-task/          # Evaluation for task slicing and proposal
│   │   ├── prompt.md       # Input state given to next-task
│   │   └── rubric.md       # Format, length, and content constraints
│   └── spec-review/        # Evaluation for adversarial spec review
│       ├── fixture.md      # Sample spec containing architectural flaws
│       ├── prompt.md       # Reviewer prompt
│       └── rubric.md       # Defect detection checklist
└── results/                # Output evaluation scorecards and candidate diffs
```

## How to Run an Eval

### Option A: Agent-Driven Evaluation (in agy, claude, codex)

Ask your agent:

> *"Run the `technical-writer` eval in `evals/skills/technical-writer/` using a subagent and report the score against `rubric.md`."*

The evaluator agent will:
1. Spawn a candidate subagent with `prompt.md` and `fixture.md`.
2. Grade the subagent output against `rubric.md` (including running `./evals/eval.sh <skill>` for deterministic checks).
3. Save the scorecard to `evals/results/<skill>-report.md`.

### Option B: Command-Line Helper

```sh
./evals/eval.sh technical-writer [candidate-output-file]
./evals/eval.sh next-task [candidate-output-file]
```
