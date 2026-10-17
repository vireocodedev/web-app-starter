# Discovery scope to implementation specification

For the preceding Client Discovery checklist and the later issue, implementation
and release stages, follow [From a cloned template to a production V1](v1-workflow.md).

After initializing a consumer, invoke the bundled
[Discovery specification skill](../.agents/skills/discovery-specification/SKILL.md)
with a production Client Discovery project UUID and an explicit output folder:

```text
$discovery-specification Generate the specification for production project PROJECT_UUID in ./docs/specifications/my-project
```

The skill captures the newest locked baseline, studies all source records,
resolves technical choices within the initialized architecture and produces a
traceable specification and issue package. Client, supplier and commercial
unknowns remain explicit proposals/input requests with targeted blockers.

Configure the protected developer-local credential profile once according to
[the source contract](../.agents/skills/discovery-specification/references/export-contract.md).
Node 24 is sufficient; no application startup or npm installation is required.
These credentials access Discovery production, independently of the generated
application's own authentication. No secrets belong in the template or output.

[The output contract](../.agents/skills/discovery-specification/references/specification-contract.md)
owns the generated files, JSON formats, validation, resume behavior and future
GitHub import procedure. Generate into a private/nested directory; root
`docs/*.md` and `docs/acceptance/` feed the public dashboard. The skill creates
local artifacts and a credential-free offline issue plan. Implementation and
GitHub publication remain separate actions.

New template consumers inherit the complete package under
`.agents/skills/discovery-specification/`. Existing consumers adopt that entire
directory, including scripts, references, metadata and tests. Initialization
continues to work without a discovery project or this optional package.

Run its focused checks from the repository root:

```sh
npm --prefix .agents/skills/discovery-specification run verify
```

The synthetic tests cover varying catalogs, source identity, output/resume
boundaries, traceability, decision outcomes and offline GitHub import behavior.
They require neither production credentials nor live issue publication. CI runs
this check alongside the portable initialization/documentation checks.
