import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRgoFeedback, useRgoOverlays, type RgoOverlayOptions } from "@rgo-web/frontend";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AppFormState } from "@/app/forms/types/AppEntityForm";
import { useDevelopmentGuideTranslation } from "../../shared/localization/useDevelopmentGuideTranslation";
import { useAppMultiViewOverlay } from "@/app/overlays/hooks/useAppMultiViewOverlay";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";

import { ContactsSidePanel, type ContactsSidePanelProps } from "../components/ContactsSidePanel";
import type { Contact } from "../models/Contact";
import { buildDefaultContactFilters, type ContactFilters } from "../models/ContactFilters";
import type { ContactWorkspaceView } from "../models/ContactWorkspaceView";

type WorkspacePatch = Pick<ContactsSidePanelProps, "editorState" | "filters">;

function buildCleanEditorState(): AppFormState {
  return { dirty: false, submitting: false };
}

function isEditorView(view: ContactWorkspaceView): view is Extract<ContactWorkspaceView, { mode: "create" | "edit" }> {
  return view.mode === "create" || view.mode === "edit";
}

function isSameView(current: ContactWorkspaceView, requested: ContactWorkspaceView) {
  if (current.mode !== requested.mode) return false;
  if (current.mode === "edit" && requested.mode === "edit") return current.contact.id === requested.contact.id;
  if (current.mode === "details" && requested.mode === "details") return current.contactId === requested.contactId;
  return true;
}

/** Connects Contacts policy to the overlay controller inside ContactsFeature’s page-local provider. */
export function useContactsWorkspace() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const overlays = useRgoOverlays();
  const theme = useTheme();
  const narrowPanel = useMediaQuery(theme.breakpoints.down("md"));
  const { editorPresentation } = useAppDisplayPreferences();
  const [filters, setFilters] = useState<ContactFilters>(buildDefaultContactFilters);
  const editorStateRef = useRef<AppFormState>(buildCleanEditorState());

  const workspacePanelOptions = useMemo<RgoOverlayOptions>(() => {
    if (editorPresentation === "dialog") {
      return { maxWidth: "sm", presentation: "dialog" };
    }

    const dimensions = {
      maxWidth: 720,
      minWidth: 320,
      resizable: true,
      side: "right" as const,
      width: 480,
    };
    return editorPresentation === "docked-panel" && !narrowPanel
      ? { ...dimensions, presentation: "docked" }
      : { ...dimensions, presentation: "modal-panel" };
  }, [editorPresentation, narrowPanel]);

  const clearFilters = useCallback(() => setFilters(buildDefaultContactFilters()), []);
  const controller = useAppMultiViewOverlay<ContactWorkspaceView, WorkspacePatch>({
    sameView: isSameView,
    canLeave: async ({ view }, signal) => {
      if (!isEditorView(view)) return true;
      if (editorStateRef.current.submitting) return false;
      if (!editorStateRef.current.dirty) return true;
      const result = await feedback.confirm({
        cancelLabel: t("contacts.overlay.keepEditing"),
        confirmLabel: t("contacts.overlay.discard"),
        destructive: true,
        message: t("contacts.overlay.discardMessage"),
        signal,
        title: t("contacts.overlay.discardTitle"),
      });
      return result.status === "confirmed" && !editorStateRef.current.submitting;
    },
    mount: (session, controls) => {
      const editorState = buildCleanEditorState();
      editorStateRef.current = editorState;
      const handle = overlays.open(
        ContactsSidePanel,
        {
          editorState,
          filters,
          session,
          onBeforeClose: controls.beforeClose,
          onClearFilters: clearFilters,
          onEditorSaved: sessionId => {
            if (!controls.isCurrent(sessionId)) return false;
            editorStateRef.current = buildCleanEditorState();
            return true;
          },
          onEditorStateChange: (sessionId, state) => {
            if (!controls.isCurrent(sessionId)) return;
            const previous = editorStateRef.current;
            if (previous.dirty === state.dirty && previous.submitting === state.submitting) return;
            editorStateRef.current = state;
            controls.updateProps({ editorState: state });
          },
          onFiltersChange: setFilters,
          onOpenEditor: contact => void controls.show({ mode: "edit", contact }),
        },
        workspacePanelOptions,
      );
      return {
        result: handle.result,
        updateView: nextSession => {
          const nextEditorState = buildCleanEditorState();
          editorStateRef.current = nextEditorState;
          handle.updateProps({ editorState: nextEditorState, session: nextSession });
        },
        updateProps: (patch: Partial<WorkspacePatch>) => handle.updateProps(patch),
      };
    },
  });

  const { show, updateProps } = controller;
  useEffect(() => {
    updateProps({ filters });
  }, [filters, updateProps]);

  const onOpenEditor = useCallback(
    (contact?: Contact) => void show(contact ? { mode: "edit", contact } : { mode: "create" }),
    [show],
  );
  const onOpenFilters = useCallback(() => void show({ mode: "filters" }), [show]);
  const onOpenDetails = useCallback(
    (contact: Contact) => void show({ mode: "details", contactId: contact.id }),
    [show],
  );

  return { filters, onFiltersChange: setFilters, onOpenDetails, onOpenEditor, onOpenFilters };
}
