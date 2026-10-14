import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Badge, Box, Button, IconButton, InputAdornment, Stack, TextField, Tooltip } from "@mui/material";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { activeFilterCount, buildDefaultContactFilters, type ContactFilters } from "../models/ContactFilters";

type ContactsToolbarProps = Readonly<{
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  onOpenEditor: () => void;
  onOpenFilters: () => void;
}>;

export function ContactsToolbar({ filters, onFiltersChange, onOpenEditor, onOpenFilters }: ContactsToolbarProps) {
  const { t } = useDevelopmentGuideTranslation();
  const panelFilterCount = Number(filters.status !== "all");

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        borderBottom: 1,
        borderColor: "divider",
        minHeight: 64,
        overflow: "hidden",
        px: 2,
      }}
    >
      <TextField
        onChange={event => onFiltersChange({ ...filters, query: event.target.value })}
        placeholder={t("contacts.filters.searchPlaceholder")}
        size="small"
        slotProps={{
          htmlInput: { "aria-label": t("contacts.filters.search") },
          input: {
            endAdornment: filters.query ? (
              <InputAdornment position="end">
                <Tooltip title={t("contacts.filters.clearSearch")}>
                  <IconButton
                    aria-label={t("contacts.filters.clearSearch")}
                    edge="end"
                    onClick={() => onFiltersChange({ ...filters, query: "" })}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined,
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ flex: "0 1 320px", minWidth: 120 }}
        value={filters.query}
      />
      <Box sx={{ flex: 1 }} />
      {activeFilterCount(filters) > 0 ? (
        <Button onClick={() => onFiltersChange(buildDefaultContactFilters())} size="small" variant="text">
          {t("contacts.filters.clear")}
        </Button>
      ) : null}
      <Tooltip title={t("contacts.filters.action")}>
        <IconButton
          aria-label={`${t("contacts.filters.action")}${panelFilterCount > 0 ? ` ${panelFilterCount}` : ""}`}
          onClick={onOpenFilters}
          size="small"
        >
          {panelFilterCount > 0 ? (
            <Badge
              anchorOrigin={{ horizontal: "left", vertical: "top" }}
              badgeContent={panelFilterCount}
              color="primary"
            >
              <FilterAltOutlinedIcon />
            </Badge>
          ) : (
            <FilterAltOutlinedIcon />
          )}
        </IconButton>
      </Tooltip>
      <Button
        aria-label={t("contacts.create")}
        onClick={onOpenEditor}
        size="small"
        startIcon={<AddIcon />}
        sx={{
          flexShrink: 0,
          minWidth: { sm: "auto", xs: 40 },
          "& .MuiButton-startIcon": { mr: { sm: 1, xs: 0 } },
        }}
        variant="contained"
      >
        <Box component="span" sx={{ display: { sm: "inline", xs: "none" } }}>
          {t("contacts.create")}
        </Box>
      </Button>
    </Stack>
  );
}
