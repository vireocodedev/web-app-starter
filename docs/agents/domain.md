# Domain docs

This repository uses a single-context domain layout:

- Root `CONTEXT.md`: business glossary.
- `docs/adr/`: architectural decision records.

## Before domain exploration

Follow the mandatory Development Guide discovery workflow in the root
AGENTS.md, then read CONTEXT.md and ADRs relevant to the affected area.

If these domain documents are absent, proceed silently. Create them lazily
through domain-modeling when a term or decision is resolved.

## Use the glossary

Use CONTEXT.md terminology in issues, proposals, hypotheses and test names.
When a needed concept is missing, check current project usage and record
a genuine terminology gap for domain-modeling.

Keep CONTEXT.md focused on business vocabulary. Specifications and
implementation decisions retain their existing authoritative owners.

## Handle decision conflicts

Surface conflicts with an existing ADR explicitly, identifying the decision,
the proposed change and the reason to reopen it. Follow the repository's
approval workflow before implementing a departure.
