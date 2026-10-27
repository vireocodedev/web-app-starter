import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { revalidateLogic, useStore } from "@tanstack/react-form";
import { useRgoForm } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";

import {
  createDraftRequestSchema,
  DraftCommandError,
  mapDraftServerErrors,
  type AcceptedDraft,
  type DraftCommand,
  type DraftIntent,
  type DraftMessage,
  type DraftTranslate,
  type DraftValues,
} from "./draftRequestModel";
import { useDraftLeaveGuard } from "./useDraftLeaveGuard";

type Props = Readonly<{
  initial: AcceptedDraft;
  latestVersion: number;
  maximumEquipmentQuantity: number;
  execute: (command: DraftCommand) => Promise<AcceptedDraft>;
  onLogout: () => Promise<void>;
  t: DraftTranslate;
}>;

/** Complete consumer recipe: one mounted form, two command intents and one accepted editing basis. */
export function DraftAndSubmitForm({ initial, latestVersion, maximumEquipmentQuantity, execute, onLogout, t }: Props) {
  const [basis, setBasis] = useState(initial);
  const [message, setMessage] = useState<DraftMessage>("idle");
  const [pending, setPending] = useState(false);
  const [conflicted, setConflicted] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  // The synchronous latch also protects event handlers before the next React render.
  const uncertainty = useRef(false);
  const intent = useRef<DraftIntent>("submit");
  const commandOwner = useRef<AbortController | null>(null);
  const focusTimer = useRef<number | undefined>(undefined);
  const element = useRef<HTMLFormElement | null>(null);
  const alive = useRef(true);

  const form = useRgoForm({
    defaultValues: initial.values,
    onSubmitMeta: { intent: "submit" as DraftIntent },
    // A previous strict validation error must not disable the legal Save draft path.
    // TanStack still executes the selected validators before onSubmit.
    canSubmitWhenInvalid: true,
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: {
      onDynamic: ({ value }) => {
        const result = createDraftRequestSchema(t, { intent: intent.current, maximumEquipmentQuantity }).safeParse(
          value,
        );
        if (result.success) return undefined;
        const fields: Partial<Record<keyof DraftValues, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (field === "title" || field === "quantity" || field === "softwarePurpose" || field === "category") {
            fields[field] ??= issue.message;
          }
        }
        return { fields };
      },
    },
    listeners: { onChange: ({ formApi }) => formApi.setErrorMap({ onSubmit: { fields: {} } }) },
    onSubmitInvalid: () => setMessage("invalid"),
    onSubmit: async ({ value, formApi, meta }) => {
      const owner = commandOwner.current;
      if (!owner || owner.signal.aborted) return;
      const values = createDraftRequestSchema(t, { intent: meta.intent, maximumEquipmentQuantity }).parse(value);
      // Capture values and the SAME accepted version before awaiting. Refresh is only an observation.
      const command: DraftCommand = { intent: meta.intent, expectedVersion: basis.version, values };
      let accepted: AcceptedDraft;
      try {
        accepted = await execute(command);
      } catch (error) {
        if (owner.signal.aborted || commandOwner.current !== owner) return;
        if (error instanceof DraftCommandError && error.kind === "validation") {
          formApi.setErrorMap({ onSubmit: { fields: mapDraftServerErrors(error.fieldErrors, values, t) } });
          setMessage("serverInvalid");
        } else if (error instanceof DraftCommandError && error.kind === "conflict") {
          setConflicted(true);
          setMessage("conflict");
        } else if (error instanceof DraftCommandError && error.kind === "rejected") {
          setMessage("rejected");
        } else {
          // A lost acknowledgement, timeout, or unknown exception does NOT prove rollback.
          uncertainty.current = true;
          setOutcomeUnknown(true);
          setMessage("uncertain");
        }
        // Neither rejection nor uncertainty is the form library's successful submit.
        throw error;
      }
      if (owner.signal.aborted || commandOwner.current !== owner) return;
      setBasis(accepted);
      formApi.reset(accepted.values);
      setMessage(accepted.status === "DRAFT" ? "saved" : "submitted");
      // A later toast or cache refresh belongs outside the write-rejection catch.
    },
  });
  const dirty = useStore(form.store, state => state.isDirty);

  const leaveGuard = useDraftLeaveGuard({
    getCurrent: () => ({ dirty: form.state.isDirty, busy: commandOwner.current !== null || uncertainty.current }),
    discard: () => form.reset(),
    onLogout,
    onBusyLeave: () => setMessage(uncertainty.current ? "uncertain" : "busyLeave"),
    t,
  });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      commandOwner.current?.abort();
      commandOwner.current = null;
      window.clearTimeout(focusTimer.current);
    };
  }, []);

  const run = async (selectedIntent: DraftIntent) => {
    if (
      commandOwner.current ||
      uncertainty.current ||
      leaveGuard.isLoggingOut() ||
      conflicted ||
      basis.status === "SUBMITTED"
    )
      return;
    const owner = new AbortController();
    commandOwner.current = owner;
    intent.current = selectedIntent;
    setPending(true);
    // Empty field maps clear earlier mapped field errors as well as the form summary.
    form.setErrorMap({ onDynamic: { fields: {} }, onSubmit: { fields: {} } });
    try {
      await form.handleSubmit({ intent: selectedIntent });
    } catch {
      // The callback mapped rejection or latched uncertainty; consume the event promise without resetting either.
    } finally {
      if (commandOwner.current === owner) {
        commandOwner.current = null;
        setPending(false);
        window.clearTimeout(focusTimer.current);
        focusTimer.current = window.setTimeout(() => {
          element.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
        }, 0);
      }
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">{t("draftHelp")}</Alert>
      <Typography role="status">
        {t(outcomeUnknown ? "outcomeUnknown" : dirty ? "dirty" : "clean")} · {t("acceptedVersion")}: {basis.version} ·{" "}
        {t("latestVersion")}: {latestVersion}
      </Typography>
      {latestVersion !== basis.version ? <Alert severity="warning">{t("stale")}</Alert> : null}
      <form.AppForm>
        <form
          aria-label={t("formLabel")}
          noValidate
          onSubmit={event => {
            event.preventDefault();
            const submitter = (event.nativeEvent as SubmitEvent).submitter;
            const selectedIntent =
              submitter instanceof HTMLButtonElement && submitter.value === "draft" ? "draft" : "submit";
            void run(selectedIntent);
          }}
          ref={element}
        >
          <Stack spacing={2}>
            <Box
              component="fieldset"
              disabled={pending || outcomeUnknown || leaveGuard.loggingOut || basis.status === "SUBMITTED"}
              sx={{ border: 0, m: 0, minWidth: 0, p: 0 }}
            >
              <Stack spacing={2}>
                <form.AppField name="title">{field => <field.TextField fullWidth label={t("title")} />}</form.AppField>
                <form.AppField
                  name="category"
                  listeners={{
                    onChange: () => {
                      form.setFieldValue("quantity", null);
                      form.setFieldValue("softwarePurpose", "");
                    },
                  }}
                >
                  {field => (
                    <field.SelectField
                      fullWidth
                      label={t("category")}
                      getOptionValue={value => value}
                      options={["equipment", "software"] as const}
                      renderOption={value => t(value)}
                    />
                  )}
                </form.AppField>
                <Typography color="text.secondary">{t("categoryHelp")}</Typography>
                <form.Subscribe selector={state => state.values.category}>
                  {category =>
                    category === "equipment" ? (
                      <form.AppField name="quantity">
                        {field => <field.NumberField fullWidth label={t("quantity")} />}
                      </form.AppField>
                    ) : (
                      <form.AppField name="softwarePurpose">
                        {field => <field.TextField fullWidth label={t("softwarePurpose")} multiline minRows={2} />}
                      </form.AppField>
                    )
                  }
                </form.Subscribe>
              </Stack>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button
                disabled={
                  pending || outcomeUnknown || leaveGuard.loggingOut || conflicted || basis.status === "SUBMITTED"
                }
                name="intent"
                type="submit"
                value="submit"
                variant="contained"
              >
                {pending ? t("saving") : t("submit")}
              </Button>
              <Button
                disabled={
                  pending || outcomeUnknown || leaveGuard.loggingOut || conflicted || basis.status === "SUBMITTED"
                }
                name="intent"
                type="submit"
                value="draft"
                variant="outlined"
              >
                {t("save")}
              </Button>
            </Box>
          </Stack>
        </form>
      </form.AppForm>
      <Alert severity={conflicted || outcomeUnknown ? "warning" : "info"} role="status">
        {t(message)}
      </Alert>
      <Button
        disabled={leaveGuard.loggingOut}
        onClick={() =>
          void leaveGuard.requestLogout().catch(() => {
            if (alive.current) setMessage("logoutFailed");
          })
        }
        sx={{ alignSelf: "flex-start" }}
      >
        {t("logout")}
      </Button>
    </Stack>
  );
}
