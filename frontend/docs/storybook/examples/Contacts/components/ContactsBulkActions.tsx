import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DisabledByDefaultOutlinedIcon from "@mui/icons-material/DisabledByDefaultOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Button, Divider, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";

import { useDevelopmentGuideTranslation } from "../../shared/localization/useDevelopmentGuideTranslation";

import { contactStatusSchema, type ContactStatus } from "../models/ContactStatus";

const statusActionTranslationKeys = {
  ACTIVE: "contacts.bulk.setActive",
  INACTIVE: "contacts.bulk.setInactive",
} as const satisfies Record<ContactStatus, "contacts.bulk.setActive" | "contacts.bulk.setInactive">;

type ContactsBulkActionsProps = Readonly<{
  allSelectedStatus?: ContactStatus;
  count: number;
  pending: boolean;
  onClear: () => void;
  onDelete: () => void;
  onSetStatus: (status: ContactStatus) => void;
}>;

export function ContactsBulkActions({
  allSelectedStatus,
  count,
  pending,
  onClear,
  onDelete,
  onSetStatus,
}: ContactsBulkActionsProps) {
  const { t } = useDevelopmentGuideTranslation();
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null);
  const [bulkActionsMenuAnchor, setBulkActionsMenuAnchor] = useState<HTMLElement | null>(null);
  const statusOptions = contactStatusSchema.options.map(status => ({
    disabled: allSelectedStatus === status,
    label: t(statusActionTranslationKeys[status]),
    status,
  }));
  const renderStatusActions = (closeMenu: () => void) =>
    statusOptions.map(({ status, label, disabled }) => (
      <MenuItem
        disabled={pending || disabled}
        key={status}
        onClick={() => {
          closeMenu();
          onSetStatus(status);
        }}
      >
        {label}
      </MenuItem>
    ));

  return (
    <Stack
      aria-label={t("contacts.bulk.actions")}
      direction="row"
      role="toolbar"
      spacing={1}
      sx={{
        alignItems: "center",
        bgcolor: "action.selected",
        bottom: { md: 0, xs: "auto" },
        boxSizing: "border-box",
        flexShrink: 0,
        height: 52,
        left: 0,
        maxWidth: { md: "calc(100% - 430px)", xs: "100%" },
        overflow: "hidden",
        position: { md: "absolute", xs: "relative" },
        px: 2,
        width: { md: "auto", xs: "100%" },
        zIndex: 2,
      }}
    >
      <Tooltip title={t("contacts.bulk.clearSelection")}>
        <span>
          <IconButton
            aria-label={t("contacts.bulk.clearSelection")}
            disabled={pending}
            onClick={onClear}
            size="small"
            sx={{ color: "primary.main" }}
          >
            <DisabledByDefaultOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Typography
        sx={{
          flex: { md: "0 0 auto", xs: "1 1 auto" },
          fontWeight: 600,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        variant="body2"
      >
        {t("contacts.bulk.selected", { count })}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ display: { md: "flex", xs: "none" } }}>
        <Tooltip title={t("contacts.bulk.changeStatus")}>
          <span>
            <IconButton
              aria-label={t("contacts.bulk.changeStatus")}
              color="default"
              disabled={pending}
              onClick={event => setStatusMenuAnchor(event.currentTarget)}
              size="small"
              sx={{ color: "text.primary" }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t("contacts.bulk.delete.action")}>
          <span>
            <IconButton
              aria-label={t("contacts.bulk.delete.action")}
              color="error"
              disabled={pending}
              onClick={onDelete}
              size="small"
              sx={{ color: "error.main" }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Button
        disabled={pending}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={event => setBulkActionsMenuAnchor(event.currentTarget)}
        size="small"
        sx={{ display: { md: "none", xs: "inline-flex" }, flexShrink: 0 }}
        variant="outlined"
      >
        {t("contacts.bulk.actions")}
      </Button>
      <Menu anchorEl={statusMenuAnchor} onClose={() => setStatusMenuAnchor(null)} open={Boolean(statusMenuAnchor)}>
        {renderStatusActions(() => setStatusMenuAnchor(null))}
      </Menu>
      <Menu
        anchorEl={bulkActionsMenuAnchor}
        onClose={() => setBulkActionsMenuAnchor(null)}
        open={Boolean(bulkActionsMenuAnchor)}
      >
        {renderStatusActions(() => setBulkActionsMenuAnchor(null))}
        <Divider />
        <MenuItem
          disabled={pending}
          onClick={() => {
            setBulkActionsMenuAnchor(null);
            onDelete();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteOutlineOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          {t("contacts.bulk.delete.action")}
        </MenuItem>
      </Menu>
    </Stack>
  );
}
