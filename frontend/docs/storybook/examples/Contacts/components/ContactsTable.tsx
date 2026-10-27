import AddIcon from "@mui/icons-material/Add";
import SwipeIcon from "@mui/icons-material/Swipe";
import { Alert, Box, Button, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { RgoDesktopTable } from "@rgo-web/frontend";
import { useCallback, useMemo, useState } from "react";

import { useDevelopmentGuideTranslation } from "../../shared/localization/useDevelopmentGuideTranslation";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";

import { ContactsBulkActions } from "./ContactsBulkActions";
import { ContactsToolbar } from "./ContactsToolbar";
import { useContactActions } from "../hooks/useContactActions";
import { useContactTableColumns } from "../hooks/useContactTableColumns";
import { useContactsFeature } from "../hooks/useContactsFeature";
import type { Contact } from "../models/Contact";
import type { ContactStatus } from "../models/ContactStatus";
import { buildDefaultContactFilters, filterContacts, type ContactFilters } from "../models/ContactFilters";

type ContactsTableProps = Readonly<{
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  onOpenEditor: (contact?: Contact) => void;
  onOpenFilters: () => void;
  onOpenDetails: (contact: Contact) => void;
}>;

/** Complete Contacts CRUD surface built on the application's shared primitives. */
export function ContactsTable({
  filters,
  onFiltersChange,
  onOpenEditor,
  onOpenFilters,
  onOpenDetails,
}: ContactsTableProps) {
  const { t } = useDevelopmentGuideTranslation();
  const theme = useTheme();
  const compactTable = useMediaQuery(theme.breakpoints.down("sm"));
  const { desktopTableSize } = useAppDisplayPreferences();
  const { ContactQuery } = useContactsFeature();
  const contacts = useQuery(ContactQuery.findAll());
  const {
    bulkPending,
    confirmBulkRemoval: confirmBulkRemovalAction,
    confirmRemoval: confirmRemovalAction,
    pendingRemovalIds,
    updateSelectedStatus: updateSelectedStatusAction,
  } = useContactActions();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectionSource, setSelectionSource] = useState(contacts.data);

  if (contacts.data !== selectionSource) {
    const existingIds = new Set((contacts.data ?? []).map(({ id }) => id));
    setSelectionSource(contacts.data);
    setSelectedIds(current => new Set([...current].filter(id => existingIds.has(id))));
  }

  const hasContacts = (contacts.data?.length ?? 0) > 0;
  const filteredContacts = useMemo(() => filterContacts(contacts.data ?? [], filters), [contacts.data, filters]);
  const selectedContacts = useMemo(
    () => (contacts.data ?? []).filter(contact => selectedIds.has(contact.id)),
    [contacts.data, selectedIds],
  );

  const removeSubmittedIds = useCallback((ids: readonly string[]) => {
    setSelectedIds(current => {
      const next = new Set(current);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const confirmRemoval = useCallback(
    async (contact: Contact) => {
      if (await confirmRemovalAction(contact)) removeSubmittedIds([contact.id]);
    },
    [confirmRemovalAction, removeSubmittedIds],
  );

  const updateSelectedStatus = useCallback(
    async (status: ContactStatus) => {
      const submitted = selectedContacts;
      if (await updateSelectedStatusAction(submitted, status)) {
        removeSubmittedIds(submitted.map(({ id }) => id));
      }
    },
    [removeSubmittedIds, selectedContacts, updateSelectedStatusAction],
  );

  const confirmBulkRemoval = useCallback(async () => {
    const submitted = selectedContacts;
    if (await confirmBulkRemovalAction(submitted)) {
      removeSubmittedIds(submitted.map(({ id }) => id));
    }
  }, [confirmBulkRemovalAction, removeSubmittedIds, selectedContacts]);

  const selectedFilteredCount = filteredContacts.filter(({ id }) => selectedIds.has(id)).length;
  const allFilteredSelected = filteredContacts.length > 0 && selectedFilteredCount === filteredContacts.length;
  const bulkMode = selectedContacts.length > 0;
  const allSelectedStatus = selectedContacts.every(({ status }) => status === selectedContacts[0]?.status)
    ? selectedContacts[0]?.status
    : undefined;

  const toggleAllFiltered = useCallback(() => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredContacts.forEach(({ id }) => next.delete(id));
      } else {
        filteredContacts.forEach(({ id }) => next.add(id));
      }
      return next;
    });
  }, [allFilteredSelected, filteredContacts]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns = useContactTableColumns({
    allFilteredSelected,
    compactActions: compactTable,
    filteredCount: filteredContacts.length,
    onOpenDetails,
    onOpenEditor,
    onRemove: confirmRemoval,
    onToggleAllFiltered: toggleAllFiltered,
    onToggleRow: toggleRow,
    pendingRemovalIds,
    selectedFilteredCount,
    selectedIds,
  });

  if (contacts.isError) {
    return (
      <Alert
        action={
          <Button color="inherit" onClick={() => void contacts.refetch()}>
            {t("contacts.table.retry")}
          </Button>
        }
        severity="error"
      >
        {t("contacts.table.loadFailed")}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flex: "1 1 auto",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        position: "relative",
        width: "100%",
      }}
    >
      <ContactsToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        onOpenEditor={() => onOpenEditor()}
        onOpenFilters={onOpenFilters}
      />
      {compactTable && hasContacts ? (
        <Typography
          sx={{ alignItems: "center", color: "text.secondary", display: "flex", gap: 0.5, px: 1.5, py: 0.5 }}
          variant="caption"
        >
          <SwipeIcon aria-hidden="true" fontSize="small" />
          {t("contacts.table.scrollHint")}
        </Typography>
      ) : null}
      <RgoDesktopTable
        columns={columns}
        defaultState={{ rowsPerPage: 5 }}
        emptyAction={
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "center" }}>
            <Button onClick={() => onOpenEditor()} startIcon={<AddIcon />} variant="contained">
              {t(hasContacts ? "contacts.create" : "contacts.table.createFirst")}
            </Button>
            {hasContacts ? (
              <Button onClick={() => onFiltersChange(buildDefaultContactFilters())} variant="text">
                {t("contacts.filters.clear")}
              </Button>
            ) : null}
          </Stack>
        }
        emptyContent={hasContacts ? t("contacts.table.noMatches") : t("contacts.table.empty")}
        getRowKey={contact => contact.id}
        getRowSx={({ row }) => (selectedIds.has(row.id) ? { backgroundColor: "action.selected" } : undefined)}
        loadingContent={t("contacts.table.loading")}
        maxHeight="100%"
        pagination={{
          getItemAriaLabel: type => t(`contacts.pagination.${type}`),
          labelDisplayedRows: ({ count, from, to }) => t("contacts.pagination.displayed", { count, from, to }),
          labelRowsPerPage: t("contacts.pagination.rowsPerPage"),
          rowsPerPageOptions: [5, 10, 25],
        }}
        rows={filteredContacts}
        size={desktopTableSize}
        sx={{
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          minHeight: 0,
          "@media (max-width:599.95px)": {
            "& .MuiTablePagination-toolbar": {
              justifyContent: "space-between",
              minHeight: 48,
              px: 1,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-input, & .MuiTablePagination-spacer": {
              display: "none",
            },
            "& .MuiTablePagination-displayedRows": { m: 0 },
            "& .MuiTablePagination-actions": { m: 0 },
          },
          "& .MuiTableCell-head": {
            backgroundColor: "rgo.surfaceSubtle",
          },
        }}
        tableLabel={t("contacts.table.label")}
        {...(contacts.isPending ? { loading: true, loadingLabel: t("contacts.table.loading") } : { loading: false })}
      />
      {bulkMode ? (
        <ContactsBulkActions
          allSelectedStatus={allSelectedStatus}
          count={selectedContacts.length}
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => void confirmBulkRemoval()}
          onSetStatus={status => void updateSelectedStatus(status)}
          pending={bulkPending}
        />
      ) : null}
    </Box>
  );
}
