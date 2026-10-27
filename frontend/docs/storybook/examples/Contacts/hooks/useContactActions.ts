import { useRgoFeedback } from "@rgo-web/frontend";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { useDevelopmentGuideTranslation } from "../../shared/localization/useDevelopmentGuideTranslation";

import type { Contact } from "../models/Contact";
import type { ContactStatus } from "../models/ContactStatus";
import { useContactsFeature } from "./useContactsFeature";

/** Owns confirmation, writes, and feedback; the table owns selection changes. */
export function useContactActions() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const { ContactMutation } = useContactsFeature();
  const removeContact = useMutation(ContactMutation.remove());
  const removeContacts = useMutation(ContactMutation.removeMany());
  const updateContacts = useMutation(ContactMutation.updateStatusMany());
  const pendingRemovalIdsRef = useRef(new Set<string>());
  const [pendingRemovalIds, setPendingRemovalIds] = useState<ReadonlySet<string>>(() => new Set());

  const confirmRemoval = useCallback(
    async (contact: Contact): Promise<boolean> => {
      const result = await feedback.confirm({
        cancelLabel: t("contacts.delete.cancel"),
        confirmLabel: t("contacts.delete.confirm"),
        destructive: true,
        message: t("contacts.delete.message", { name: contact.name }),
        title: t("contacts.delete.title"),
      });
      if (result.status !== "confirmed") return false;

      if (pendingRemovalIdsRef.current.has(contact.id)) return false;
      pendingRemovalIdsRef.current.add(contact.id);
      setPendingRemovalIds(new Set(pendingRemovalIdsRef.current));

      try {
        await removeContact.mutateAsync(contact.id);
        feedback.notify({
          id: `contact-${contact.id}-deleted`,
          message: t("contacts.delete.success", { name: contact.name }),
          severity: "success",
        });
        return true;
      } catch {
        feedback.notify({
          id: `contact-${contact.id}-delete-failed`,
          message: t("contacts.delete.failed", { name: contact.name }),
          severity: "error",
        });
        return false;
      } finally {
        pendingRemovalIdsRef.current.delete(contact.id);
        setPendingRemovalIds(new Set(pendingRemovalIdsRef.current));
      }
    },
    [feedback, removeContact, t],
  );

  const updateSelectedStatus = useCallback(
    async (contacts: readonly Contact[], status: ContactStatus): Promise<boolean> => {
      const ids = contacts.map(contact => contact.id);
      try {
        await updateContacts.mutateAsync({ ids, status });
        feedback.notify({
          id: `contacts-bulk-${status.toLowerCase()}`,
          message: t("contacts.bulk.statusSuccess", {
            count: ids.length,
            status: t(`contacts.status.${status}`),
          }),
          severity: "success",
        });
        return true;
      } catch {
        feedback.notify({
          id: `contacts-bulk-${status.toLowerCase()}-failed`,
          message: t("contacts.bulk.statusFailed"),
          severity: "error",
        });
        return false;
      }
    },
    [feedback, t, updateContacts],
  );

  const confirmBulkRemoval = useCallback(
    async (contacts: readonly Contact[]): Promise<boolean> => {
      const result = await feedback.confirm({
        cancelLabel: t("contacts.bulk.delete.cancel"),
        confirmLabel: t("contacts.bulk.delete.confirm", { count: contacts.length }),
        destructive: true,
        message: t("contacts.bulk.delete.message", { count: contacts.length }),
        title: t("contacts.bulk.delete.title"),
      });
      if (result.status !== "confirmed") return false;

      try {
        await removeContacts.mutateAsync(contacts.map(contact => contact.id));
        feedback.notify({
          id: "contacts-bulk-deleted",
          message: t("contacts.bulk.delete.success", { count: contacts.length }),
          severity: "success",
        });
        return true;
      } catch {
        feedback.notify({
          id: "contacts-bulk-delete-failed",
          message: t("contacts.bulk.delete.failed"),
          severity: "error",
        });
        return false;
      }
    },
    [feedback, removeContacts, t],
  );

  return {
    confirmBulkRemoval,
    confirmRemoval,
    pendingRemovalIds,
    bulkPending: removeContacts.isPending || updateContacts.isPending,
    updateSelectedStatus,
  };
}
