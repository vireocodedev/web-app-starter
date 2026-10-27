import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  RgoFormGroup,
  RgoOverlayFrame,
  useRgoFeedback,
  type RgoOverlayBeforeClose,
  type RgoOverlayContentProps,
} from "@rgo-web/frontend";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { AppFormState } from "@/app/forms/types/AppEntityForm";
import type { AppOverlayViewSession } from "@/app/overlays/hooks/useAppMultiViewOverlay";

import { ContactConflictError } from "../api/contact.api";
import { useDevelopmentGuideTranslation } from "../../shared/localization/useDevelopmentGuideTranslation";

import { useContactsFeature } from "../hooks/useContactsFeature";
import type { Contact, ContactFormValue } from "../models/Contact";
import type { ContactFilters, ContactStatusFilter } from "../models/ContactFilters";
import { contactStatusSchema } from "../models/ContactStatus";
import type { ContactWorkspaceView } from "../models/ContactWorkspaceView";
import { ContactForm } from "./ContactForm";

export type ContactsSidePanelProps = Readonly<{
  editorState: AppFormState;
  filters: ContactFilters;
  session: AppOverlayViewSession<ContactWorkspaceView>;
  onBeforeClose: RgoOverlayBeforeClose;
  onClearFilters: () => void;
  onEditorSaved: (sessionId: number) => boolean;
  onEditorStateChange: (sessionId: number, state: AppFormState) => void;
  onFiltersChange: (filters: ContactFilters) => void;
  onOpenEditor: (contact: Contact) => void;
}> &
  RgoOverlayContentProps<void>;

function ContactDetails({
  contactId,
  onOpenEditor,
}: Readonly<{
  contactId: string;
  onOpenEditor: ContactsSidePanelProps["onOpenEditor"];
}>) {
  const { t } = useDevelopmentGuideTranslation();
  const { ContactQuery } = useContactsFeature();
  const contacts = useQuery(ContactQuery.findAll());
  const contact = contacts.data?.find(({ id }) => id === contactId);

  if (contacts.isPending) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <CircularProgress size={20} />
        <Typography color="text.secondary">{t("contacts.details.loading")}</Typography>
      </Stack>
    );
  }

  if (contacts.isError) {
    return (
      <Alert
        action={
          <Button color="inherit" onClick={() => void contacts.refetch()}>
            {t("contacts.details.retry")}
          </Button>
        }
        severity="error"
      >
        {t("contacts.details.loadFailed")}
      </Alert>
    );
  }

  if (!contact) {
    return <Alert severity="info">{t("contacts.details.unavailable")}</Alert>;
  }

  const fields = [
    [EmailOutlinedIcon, t("contacts.fields.email"), contact.email],
    [BusinessOutlinedIcon, t("contacts.fields.organization"), contact.organization],
    [WorkOutlineOutlinedIcon, t("contacts.fields.role"), contact.role],
  ] as const;

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar
          sx={{
            backgroundColor: "rgo.selection",
            color: "rgo.selectionText",
            fontWeight: 700,
            height: 48,
            width: 48,
          }}
        >
          {contact.name.trim().charAt(0).toUpperCase()}
        </Avatar>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography component="h3" noWrap variant="h6">
            {contact.name}
          </Typography>
          <Chip
            color={contact.status === "ACTIVE" ? "success" : "default"}
            label={t(`contacts.status.${contact.status}`)}
            size="small"
            sx={{ alignSelf: "flex-start" }}
            variant="outlined"
          />
        </Stack>
      </Stack>
      <Paper
        sx={{
          backgroundColor: "rgo.surfaceSubtle",
          borderColor: "rgo.borderSubtle",
          overflow: "hidden",
        }}
        variant="outlined"
      >
        <Stack divider={<Divider flexItem />}>
          {fields.map(([FieldIcon, label, value]) => (
            <Stack direction="row" key={label} spacing={1.5} sx={{ alignItems: "center", px: 2, py: 1.5 }}>
              <Box
                sx={{
                  color: "text.secondary",
                  display: "grid",
                  flex: "0 0 auto",
                  placeItems: "center",
                }}
              >
                <FieldIcon fontSize="small" />
              </Box>
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography color="text.secondary" variant="caption">
                  {label}
                </Typography>
                <Typography sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Paper>
      <Button
        onClick={() => onOpenEditor(contact)}
        startIcon={<EditOutlinedIcon />}
        sx={{ alignSelf: "flex-end" }}
        variant="contained"
      >
        {t("contacts.details.edit")}
      </Button>
    </Stack>
  );
}

function ContactFiltersForm({ filters, onFiltersChange }: Pick<ContactsSidePanelProps, "filters" | "onFiltersChange">) {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Stack spacing={1}>
      <Typography>{t("contacts.fields.status")}</Typography>
      <ToggleButtonGroup
        aria-label={t("contacts.fields.status")}
        exclusive
        fullWidth
        onChange={(_event, status: ContactStatusFilter | null) => {
          if (status) onFiltersChange({ ...filters, status });
        }}
        size="small"
        value={filters.status}
      >
        <ToggleButton value="all">{t("contacts.filters.status.all")}</ToggleButton>
        {contactStatusSchema.options.map(status => (
          <ToggleButton key={status} value={status}>
            {t(`contacts.filters.status.${status}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

type ContactEditorView = Extract<ContactWorkspaceView, { mode: "create" | "edit" }>;
type ContactEditorProps = Pick<ContactsSidePanelProps, "onEditorSaved" | "onEditorStateChange" | "overlay"> &
  Readonly<{ sessionId: number; view: ContactEditorView }>;

function ContactEditor({ onEditorSaved, onEditorStateChange, overlay, sessionId, view }: ContactEditorProps) {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const { ContactMutation } = useContactsFeature();
  const createContact = useMutation(ContactMutation.create());
  const updateContact = useMutation(ContactMutation.update());
  const isCreating = view.mode === "create";

  const onSubmit = async (value: ContactFormValue) => {
    if (view.mode === "create") {
      await createContact.mutateAsync({
        email: value.email,
        name: value.name,
        organization: value.organization,
        role: value.role,
        status: value.status,
      });
    } else {
      await updateContact.mutateAsync({
        contact: { ...value, id: view.contact.id },
        expected: view.contact,
      });
    }
    feedback.notify({
      id: isCreating ? "contact-created" : "contact-updated",
      message: t(isCreating ? "contacts.save.created" : "contacts.save.updated"),
      severity: "success",
    });
  };
  const onSaved = () => {
    if (onEditorSaved(sessionId)) void overlay.complete(undefined);
  };
  const onStateChange = (state: AppFormState) => onEditorStateChange(sessionId, state);
  const saveConflict = updateContact.error instanceof ContactConflictError;
  const saveFailed = createContact.isError || (updateContact.isError && !saveConflict);

  return (
    <>
      {saveConflict ? <Alert severity="error">{t("contacts.save.conflict")}</Alert> : null}
      {view.mode === "create" ? (
        <ContactForm
          group={RgoFormGroup.CREATE}
          onSaved={onSaved}
          onStateChange={onStateChange}
          onSubmit={onSubmit}
          saveFailed={saveFailed}
        />
      ) : (
        <ContactForm
          group={RgoFormGroup.UPDATE}
          initialValue={view.contact}
          onSaved={onSaved}
          onStateChange={onStateChange}
          onSubmit={onSubmit}
          saveFailed={saveFailed}
        />
      )}
    </>
  );
}

/** Shared mounted workspace for filters, details, and contact editing. */
export function ContactsSidePanel({
  editorState,
  filters,
  onBeforeClose,
  onClearFilters,
  onEditorSaved,
  onEditorStateChange,
  onFiltersChange,
  onOpenEditor,
  overlay,
  session,
}: ContactsSidePanelProps) {
  const { t } = useDevelopmentGuideTranslation();
  const { sessionId, view } = session;
  const showingFilters = view.mode === "filters";
  const editing = view.mode === "create" || view.mode === "edit";
  const title =
    view.mode === "create"
      ? t("contacts.form.createTitle")
      : view.mode === "edit"
        ? t("contacts.form.editTitle")
        : t(showingFilters ? "contacts.filters.title" : "contacts.details.title");

  return (
    <RgoOverlayFrame
      beforeClose={onBeforeClose}
      busy={editing && editorState.submitting}
      footer={
        showingFilters ? (
          <Button onClick={onClearFilters} variant="text">
            {t("contacts.filters.clear")}
          </Button>
        ) : undefined
      }
      sx={{
        backgroundColor: "rgo.surfaceRaised",
        border: "1px solid",
        borderColor: "rgo.borderSubtle",
        borderRadius: 1,
        boxShadow: theme => (theme.palette.mode === "light" ? theme.palette.rgo.shadowPopover : "none"),
        overflow: "hidden",
      }}
      title={title}
    >
      {view.mode === "create" || view.mode === "edit" ? (
        <ContactEditor
          key={sessionId}
          sessionId={sessionId}
          onEditorSaved={onEditorSaved}
          onEditorStateChange={onEditorStateChange}
          overlay={overlay}
          view={view}
        />
      ) : view.mode === "filters" ? (
        <ContactFiltersForm filters={filters} onFiltersChange={onFiltersChange} />
      ) : (
        <ContactDetails contactId={view.contactId} onOpenEditor={onOpenEditor} />
      )}
    </RgoOverlayFrame>
  );
}
