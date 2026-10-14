import type { SxProps, Theme } from "@mui/material/styles";

/** Settings presentation; general choice inputs retain MUI defaults. */
export const settingsChoiceToggleGroupSx = {
  flexWrap: "wrap",
  gap: 1,
  maxWidth: "100%",
  minWidth: 0,
  width: "max-content",
  "& .MuiToggleButton-root": {
    borderColor: "rgo.borderControl",
    color: "text.secondary",
    flex: "0 1 auto",
    gap: 0.5,
    minHeight: 36,
    maxWidth: "100%",
    minWidth: 64,
    px: 1.5,
    py: 0.5,
    textTransform: "none",
    whiteSpace: "normal",
    "& .MuiSvgIcon-root": { flexShrink: 0 },
    "&:hover": { bgcolor: "action.hover", color: "text.primary" },
    "&.Mui-selected": {
      bgcolor: "action.selected",
      color: "text.primary",
      fontWeight: 700,
      "&:hover": { bgcolor: "action.selected" },
    },
  },
  // Override MUI's joined edges so each choice stays outlined when the group wraps.
  "& .MuiToggleButton-root.MuiToggleButtonGroup-grouped": {
    border: "1px solid",
    borderColor: "rgo.borderControl",
    borderRadius: theme => `${theme.shape.controlBorderRadius}px`,
    margin: 0,
  },
  "& [data-app-choice-label]": { overflowWrap: "anywhere", whiteSpace: "normal" },
  "@container (max-width: 420px)": {
    "& .MuiToggleButton-root": { px: 1 },
    "& [data-app-choice-icon]": { display: "none" },
  },
} satisfies SxProps<Theme>;
