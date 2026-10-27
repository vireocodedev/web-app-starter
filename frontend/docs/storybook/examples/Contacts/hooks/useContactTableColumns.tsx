import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Checkbox, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import type { TableColumnDef } from "@rgo-web/frontend";
import { useMemo } from "react";

import { useDevelopmentGuideTranslation } from "../../shared/localization/useDevelopmentGuideTranslation";

import { ContactActionMenu } from "../components/ContactActionMenu";
import type { Contact } from "../models/Contact";

type ContactTableColumnsOptions = Readonly<{
  allFilteredSelected: boolean;
  compactActions: boolean;
  filteredCount: number;
  onOpenDetails: (contact: Contact) => void;
  onOpenEditor: (contact: Contact) => void;
  onRemove: (contact: Contact) => Promise<void>;
  onToggleAllFiltered: () => void;
  onToggleRow: (id: string) => void;
  pendingRemovalIds: ReadonlySet<string>;
  selectedFilteredCount: number;
  selectedIds: ReadonlySet<string>;
}>;

/** Column definitions for the Contacts table; selection state remains with the table. */
export function useContactTableColumns({
  allFilteredSelected,
  compactActions,
  filteredCount,
  onOpenDetails,
  onOpenEditor,
  onRemove,
  onToggleAllFiltered,
  onToggleRow,
  pendingRemovalIds,
  selectedFilteredCount,
  selectedIds,
}: ContactTableColumnsOptions): readonly TableColumnDef<Contact>[] {
  const { t } = useDevelopmentGuideTranslation();
  const columns = useMemo<readonly TableColumnDef<Contact>[]>(
    () => [
      {
        align: "center",
        id: "selection",
        header: (
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={selectedFilteredCount > 0 && selectedFilteredCount < filteredCount}
            onChange={onToggleAllFiltered}
            size="small"
            slotProps={{
              input: { "aria-label": t("contacts.selection.selectAll") },
            }}
          />
        ),
        renderCell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.id)}
            onChange={() => onToggleRow(row.id)}
            size="small"
            slotProps={{
              input: {
                "aria-label": t("contacts.selection.select", {
                  name: row.name,
                }),
              },
            }}
          />
        ),
        sticky: "left",
        width: compactActions ? 48 : 56,
      },
      {
        id: "name",
        header: t("contacts.fields.name"),
        cellSx: compactActions ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : undefined,
        minWidth: compactActions ? 146 : 170,
        renderCell: ({ row }) => row.name,
        rowHeader: true,
        sort: { compare: (left, right) => left.name.localeCompare(right.name) },
        sticky: "left",
        width: compactActions ? 146 : 180,
      },
      {
        id: "email",
        header: t("contacts.fields.email"),
        minWidth: 220,
        renderCell: ({ row }) => row.email,
        sort: {
          compare: (left, right) => left.email.localeCompare(right.email),
        },
        width: 260,
      },
      {
        id: "organization",
        header: t("contacts.fields.organization"),
        minWidth: 220,
        renderCell: ({ row }) => row.organization,
        sort: {
          compare: (left, right) => left.organization.localeCompare(right.organization),
        },
      },
      {
        id: "role",
        header: t("contacts.fields.role"),
        minWidth: 170,
        renderCell: ({ row }) => row.role,
        sort: { compare: (left, right) => left.role.localeCompare(right.role) },
        width: 200,
      },
      {
        id: "status",
        header: t("contacts.fields.status"),
        minWidth: 120,
        renderCell: ({ row }) => (
          <Chip
            color={row.status === "ACTIVE" ? "success" : "default"}
            label={t(`contacts.status.${row.status}`)}
            size="small"
            variant="outlined"
          />
        ),
        sort: {
          compare: (left, right) => left.status.localeCompare(right.status),
        },
        width: 130,
      },
      {
        align: compactActions ? "center" : "right",
        cellSx: compactActions ? { p: 0 } : undefined,
        headerSx: compactActions ? { p: 0 } : undefined,
        id: "actions",
        header: compactActions ? (
          <Box
            component="span"
            sx={{
              clip: "rect(0 0 0 0)",
              clipPath: "inset(50%)",
              height: 1,
              m: -1,
              overflow: "hidden",
              p: 0,
              position: "absolute",
              whiteSpace: "nowrap",
              width: 1,
            }}
          >
            {t("contacts.table.actions")}
          </Box>
        ) : (
          t("contacts.table.actions")
        ),
        renderCell: ({ row }) =>
          compactActions ? (
            <ContactActionMenu
              contact={row}
              onOpenDetails={onOpenDetails}
              onOpenEditor={onOpenEditor}
              onRemove={onRemove}
              pendingRemoval={pendingRemovalIds.has(row.id)}
            />
          ) : (
            <Stack direction="row" spacing={0.25} sx={{ justifyContent: "flex-end" }}>
              <Tooltip title={t("contacts.details.open", { name: row.name })}>
                <IconButton
                  aria-label={t("contacts.details.open", { name: row.name })}
                  onClick={() => onOpenDetails(row)}
                  size="small"
                  sx={{
                    color: "text.primary",
                    minHeight: 32,
                    minWidth: 32,
                    p: 0.5,
                  }}
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("contacts.actions.edit", { name: row.name })}>
                <IconButton
                  aria-label={t("contacts.actions.edit", { name: row.name })}
                  onClick={() => onOpenEditor(row)}
                  size="small"
                  sx={{
                    color: "text.primary",
                    minHeight: 32,
                    minWidth: 32,
                    p: 0.5,
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("contacts.actions.delete", { name: row.name })}>
                <IconButton
                  aria-label={t("contacts.actions.delete", { name: row.name })}
                  color="error"
                  disabled={pendingRemovalIds.has(row.id)}
                  onClick={() => void onRemove(row)}
                  size="small"
                  sx={{
                    color: "error.main",
                    minHeight: 32,
                    minWidth: 32,
                    p: 0.5,
                  }}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ),
        sticky: "right",
        width: compactActions ? 48 : 132,
      },
    ],
    [
      allFilteredSelected,
      compactActions,
      onRemove,
      filteredCount,
      onOpenEditor,
      onOpenDetails,
      onToggleAllFiltered,
      onToggleRow,
      pendingRemovalIds,
      selectedFilteredCount,
      selectedIds,
      t,
    ],
  );

  return columns;
}
