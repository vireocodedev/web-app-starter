import type { SxProps, Theme } from "@mui/material/styles";
import type { RgoOverlayProviderProps } from "@rgo-web/frontend";

/** Layout and surface styling for a full-height table with an overlay workspace. */
export const tableWorkspaceOverlaySlotProps = {
  dockedPanel: {
    sx: {
      alignSelf: "stretch",
      height: "auto",
      ml: 1,
      minWidth: 0,
      position: "relative",
      transition: "none",
      zIndex: 1,
      // Keep the resize edge and total docked width unchanged; only its inner surface owns the gutter.
      "& > :first-of-type": { pl: 1.25 },
    },
  },
  panelSurface: {
    sx: {
      boxSizing: "border-box",
    },
  },
  resizeHandle: {
    sx: {
      "&::after": {
        backgroundColor: "divider",
        width: "2px",
      },
    },
  },
  workspace: {
    sx: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      zIndex: 0,
    },
  },
} satisfies NonNullable<RgoOverlayProviderProps["slotProps"]>;

export const tableWorkspaceOverlaySx = {
  flex: "1 1 auto",
  minHeight: 0,
  width: "100%",
} satisfies SxProps<Theme>;

export const tableWorkspacePaperSx = (theme: Theme) =>
  ({
    boxShadow: theme.palette.mode === "light" ? theme.palette.rgo.shadowPopover : "none",
    border: "1px solid",
    borderColor: "divider",
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
    [theme.breakpoints.down("md")]: {
      bgcolor: "background.default",
      border: 0,
      borderRadius: 0,
      boxShadow: "none",
    },
  }) satisfies SxProps<Theme>;
