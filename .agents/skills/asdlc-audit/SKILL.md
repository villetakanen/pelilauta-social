---
name: asdlc-audit
description: use ASDLC.io knowledge base to audit the Agent constitution, 
  skills or harness. 
compatibility: Requires shell access, internet access.
version: 0.0.1
---

The site ASDLC.io describes a set of patterns, practices and concepts for Agentic
Software Development Cycle. Each of the patterns and practices is usable individually, and we must always assume that each project and harness has full freedom to choose which tools are used if any.

Assess the current Agent constitution, tooling, skills and harness against the ASDLC recommendations.

The whole knowledge base is one download: `curl -sL https://asdlc.io/asdlc-skill.zip`.
Read `SKILL.md` and the three index files before any article.

## REPORT

Open with the baseline: branch, commit, and any open pull requests or sibling
branches. A finding is only true relative to what was read.

1. Which patterns are present, which are absent by deliberate choice, and
   which appear simply unconsidered
2. What patterns or practices diverge from recommended
3. What parts of the ASDLC.io recommendations might be applicable as atomic opportunities of improvement to the harness or project
