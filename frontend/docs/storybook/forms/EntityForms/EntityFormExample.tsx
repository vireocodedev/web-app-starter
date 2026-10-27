import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { RgoFormGroup } from "@rgo-web/frontend";
import { useRef, useState } from "react";

import type { AppFormState } from "@/app/forms/types/AppEntityForm";
import { ContactForm } from "../../examples/Contacts/components/ContactForm";
import type { Contact, ContactFormValue } from "../../examples/Contacts/models/Contact";

export type EntityFormExampleProps = Readonly<{
  mode: "create" | "update";
  failFirstSave: boolean;
  saveDelayMs: number;
}>;

const initialContact: Contact = {
  id: "story-contact",
  name: "Alex Morgan",
  email: "alex@example.com",
  organization: "Example Studio",
  role: "Designer",
  status: "ACTIVE",
};

/** Each explicit mode starts its own editor; changing the global theme does not. */
export function EntityFormExample(props: EntityFormExampleProps) {
  return <EntityFormSession key={props.mode} {...props} />;
}

/** A Storybook-only command owner; ContactForm retains all real form mechanics. */
function EntityFormSession({ mode, failFirstSave, saveDelayMs }: EntityFormExampleProps) {
  const [session, setSession] = useState(0);
  const [formState, setFormState] = useState<AppFormState>({ dirty: false, submitting: false });
  const [pending, setPending] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [savedValue, setSavedValue] = useState<ContactFormValue | null>(null);
  const attempts = useRef(0);
  const acknowledgedValue = useRef<ContactFormValue | null>(null);
  const busy = pending || formState.submitting;

  const onSubmit = async (value: ContactFormValue) => {
    const shouldFail = failFirstSave && attempts.current === 0;
    attempts.current += 1;
    setPending(true);
    setSaveFailed(false);
    setSavedValue(null);
    acknowledgedValue.current = null;

    try {
      await new Promise<void>(resolve => window.setTimeout(resolve, saveDelayMs));
      if (shouldFail) {
        setSaveFailed(true);
        throw new Error("Storybook simulation: the first save failed. Retry with the same draft.");
      }
      acknowledgedValue.current = value;
    } finally {
      setPending(false);
    }
  };

  const onSaved = () => setSavedValue(acknowledgedValue.current);
  const restartSession = () => {
    attempts.current = 0;
    acknowledgedValue.current = null;
    setSavedValue(null);
    setSaveFailed(false);
    setFormState({ dirty: false, submitting: false });
    setSession(current => current + 1);
  };
  const callbacks = { onSaved, onStateChange: setFormState, onSubmit, saveFailed };

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h4">
            {mode === "create" ? "Create a contact" : "Update a contact"}
          </Typography>
          <Typography color="text.secondary">
            Try required fields, invalid email, status choices and a complete save. Validation appears after submission
            and then updates as you edit.
          </Typography>
        </Stack>
        <Alert severity="info">
          Storybook simulation: saves wait {saveDelayMs / 1000} seconds without storing any data.
          {failFirstSave ? " The first save fails; your draft stays available for retry." : ""}
        </Alert>
        <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
          {mode === "create" ? (
            <ContactForm key={session} group={RgoFormGroup.CREATE} {...callbacks} />
          ) : (
            <ContactForm key={session} group={RgoFormGroup.UPDATE} initialValue={initialContact} {...callbacks} />
          )}
        </Paper>
        <Stack aria-live="polite" direction={{ xs: "column", sm: "row" }} role="status" spacing={1}>
          <Typography>Draft: {formState.dirty ? "dirty" : "clean"}</Typography>
          <Typography>Submission: {busy ? "saving" : "idle"}</Typography>
        </Stack>
        {savedValue ? (
          <Paper component="section" aria-labelledby="saved-payload-title" sx={{ p: 2 }} variant="outlined">
            <Stack spacing={1}>
              <Typography component="h2" id="saved-payload-title" variant="h6">
                Saved payload
              </Typography>
              <Typography>
                The simulated save resolved before onSaved displayed these parsed values. The draft stays open until you
                explicitly start another session.
              </Typography>
              <Box component="pre" sx={{ m: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(savedValue, null, 2)}
              </Box>
            </Stack>
          </Paper>
        ) : null}
        <Button disabled={busy} onClick={restartSession} sx={{ alignSelf: "flex-start" }} variant="outlined">
          {mode === "create" ? "Start a new create session" : "Restart editing session"}
        </Button>
      </Stack>
    </Box>
  );
}
