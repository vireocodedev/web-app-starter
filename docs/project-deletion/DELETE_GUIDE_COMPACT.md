# Delete a consumer project — compact

Run from the reviewed canonical starter checkout on the workstation. The operator's
clean `CI_SOURCE` checkout must contain the same reviewed deletion code.
[Full guide and safeguards](DELETE_GUIDE.md).

## 1.1. Import existing private initialization results

First finish initialization **19.2**; a partial 19.1 report cannot be imported.
Replace the initialization path with the actual consumer path. Keep the deletion
reference in a distinct private directory per project.

```bash
python3 -B docs/project-deletion/scripts/1_1_import_initialization.py --initialization-env /absolute/consumer/.template-initialization/values.env --env "$HOME/.local/share/project-deletion/values.env"
```

## 2.1. Inspect and seal the exact deletion plan

```bash
python3 -B docs/project-deletion/scripts/2_1_inspect_and_plan.py --env "$HOME/.local/share/project-deletion/values.env"
```

Review the printed private plan. If it reports unknown assets, review their exact
provenance and provide the protected extra manifest described in the full guide.
Set the variable to the printed plan hash, or copy the complete commands printed
by the script.

```bash
export DELETION_PLAN_SHA256=PASTE_PRINTED_64_CHARACTER_SHA256
```

## 3.1. Disable admission, wait for deployments and quiesce idle host producers

```bash
python3 -B docs/project-deletion/scripts/3_1_quiesce.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

## 4.1. Purge this project's exact host data and resources

```bash
python3 -B docs/project-deletion/scripts/4_1_remove_host_resources.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

## 5.1. Deregister this consumer and fully validate/reactivate the shared CI pool

Validation may take several minutes. Let it finish.

```bash
python3 -B docs/project-deletion/scripts/5_1_unregister_ci.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

## 6.1. Remove exact DNS, private GHCR packages and shared App repository access

```bash
python3 -B docs/project-deletion/scripts/6_1_remove_provider_resources.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

## 7.1. Delete the original numeric GitHub repository identity last

```bash
python3 -B docs/project-deletion/scripts/7_1_delete_repository.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

## 8.1. Verify absence and save the final private workstation receipt

```bash
python3 -B docs/project-deletion/scripts/8_1_verify_deletion.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

## 8.2. Remove the remaining protected host deletion context

```bash
python3 -B docs/project-deletion/scripts/8_2_remove_host_context.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

Keep local receipts, notes, checkout and retrieved recovery archives. Repeat the
same step/hash after interruption; never reset journals or infer absence from 404.
