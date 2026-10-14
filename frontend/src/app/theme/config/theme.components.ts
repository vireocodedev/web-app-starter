import type { ThemeOptions } from "@mui/material/styles";

const rgo = {
  action: "var(--mui-palette-rgo-action)",
  actionHover: "var(--mui-palette-rgo-actionHover)",
  actionPressed: "var(--mui-palette-rgo-actionPressed)",
  borderControl: "var(--mui-palette-rgo-borderControl)",
  borderSubtle: "var(--mui-palette-rgo-borderSubtle)",
  dangerBg: "var(--mui-palette-rgo-dangerBg)",
  dangerFg: "var(--mui-palette-rgo-dangerFg)",
  dangerHover: "var(--mui-palette-rgo-dangerHover)",
  dangerPressed: "var(--mui-palette-rgo-dangerPressed)",
  disabledBg: "var(--mui-palette-rgo-disabledBg)",
  disabledText: "var(--mui-palette-rgo-disabledText)",
  focus: "var(--mui-palette-rgo-focus)",
  hover: "var(--mui-palette-rgo-hover)",
  infoBg: "var(--mui-palette-rgo-infoBg)",
  infoFg: "var(--mui-palette-rgo-infoFg)",
  onAction: "var(--mui-palette-rgo-onAction)",
  onDanger: "var(--mui-palette-rgo-onDanger)",
  selection: "var(--mui-palette-rgo-selection)",
  selectionText: "var(--mui-palette-rgo-selectionText)",
  shadowDialog: "var(--mui-palette-rgo-shadowDialog)",
  shadowPopover: "var(--mui-palette-rgo-shadowPopover)",
  scrim: "var(--mui-palette-rgo-scrim)",
  shellSurface: "var(--mui-palette-rgo-shellSurface)",
  successBg: "var(--mui-palette-rgo-successBg)",
  successFg: "var(--mui-palette-rgo-successFg)",
  surface: "var(--mui-palette-rgo-surface)",
  surfaceRaised: "var(--mui-palette-rgo-surfaceRaised)",
  surfaceSubtle: "var(--mui-palette-rgo-surfaceSubtle)",
  text: "var(--mui-palette-rgo-text)",
  textMuted: "var(--mui-palette-rgo-textMuted)",
  warningBg: "var(--mui-palette-rgo-warningBg)",
  warningFg: "var(--mui-palette-rgo-warningFg)",
} as const;

export const APPLICATION_COMPONENTS = {
  MuiAlert: {
    styleOverrides: {
      action: {
        color: "inherit",
        "& .MuiButton-root, & .MuiIconButton-root": {
          backgroundColor: "transparent",
          boxShadow: "none",
          color: "inherit",
        },
        "& .MuiButton-root:hover, & .MuiIconButton-root:hover": {
          backgroundColor: rgo.hover,
          boxShadow: "none",
        },
        "& .MuiButton-root:active, & .MuiIconButton-root:active": {
          backgroundColor: rgo.selection,
          boxShadow: "none",
        },
      },
      icon: {
        color: "inherit",
      },
      root: ({ ownerState, theme }) => {
        const status = ownerState.color ?? ownerState.severity ?? "success";
        const semanticStatusStyles =
          ownerState.variant === "standard" || ownerState.variant === "filled"
            ? status === "error"
              ? {
                  backgroundColor: rgo.dangerBg,
                  color: rgo.dangerFg,
                }
              : status === "info"
                ? {
                    backgroundColor: rgo.infoBg,
                    color: rgo.infoFg,
                  }
                : status === "warning"
                  ? {
                      backgroundColor: rgo.warningBg,
                      color: rgo.warningFg,
                    }
                  : {
                      backgroundColor: rgo.successBg,
                      color: rgo.successFg,
                    }
            : {};

        return {
          alignItems: "center",
          borderRadius: theme.shape.surfaceBorderRadius,
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          ...semanticStatusStyles,
        };
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: rgo.shellSurface,
        backgroundImage: "none",
        borderBottom: `1px solid ${rgo.borderSubtle}`,
        boxShadow: "none",
        color: rgo.text,
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      variant: "contained",
    },
    styleOverrides: {
      outlined: {
        "&:active": {
          backgroundColor: rgo.selection,
        },
        "&:hover": {
          backgroundColor: rgo.hover,
          borderColor: rgo.borderControl,
        },
        backgroundColor: rgo.surface,
        borderColor: rgo.borderControl,
        color: rgo.text,
      },
      root: ({ ownerState, theme }) => {
        const isContainedPrimary =
          ownerState.variant === "contained" && (ownerState.color === undefined || ownerState.color === "primary");
        const isContainedError = ownerState.variant === "contained" && ownerState.color === "error";
        const isTextPrimary =
          ownerState.variant === "text" && (ownerState.color === undefined || ownerState.color === "primary");

        return {
          borderRadius: theme.shape.controlBorderRadius,
          minHeight: 44,
          paddingInline: 16,
          textTransform: "none",
          "&.Mui-disabled": {
            backgroundColor: rgo.disabledBg,
            color: rgo.disabledText,
          },
          ...(isContainedPrimary && {
            "&:active": {
              backgroundColor: rgo.actionPressed,
            },
            "&:hover": {
              backgroundColor: rgo.actionHover,
            },
            backgroundColor: rgo.action,
            color: rgo.onAction,
          }),
          ...(isContainedError && {
            "&:active": {
              backgroundColor: rgo.dangerPressed,
            },
            "&:hover": {
              backgroundColor: rgo.dangerHover,
            },
            backgroundColor: rgo.dangerFg,
            color: rgo.onDanger,
          }),
          ...(isTextPrimary && {
            "&:active": {
              backgroundColor: rgo.selection,
            },
            "&:hover": {
              backgroundColor: rgo.hover,
            },
            color: rgo.action,
          }),
        };
      },
    },
  },
  MuiButtonBase: {
    styleOverrides: {
      root: {
        "&.Mui-focusVisible": {
          outline: `2px solid ${rgo.focus}`,
          outlineOffset: 3,
        },
      },
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ ownerState, theme }) => ({
        backgroundColor: rgo.surface,
        border: `1px solid ${rgo.borderSubtle}`,
        borderRadius: ownerState.square ? 0 : theme.shape.surfaceBorderRadius,
        boxShadow: "none",
      }),
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        color: rgo.borderControl,
        minHeight: 44,
        minWidth: 44,
        "&.Mui-checked": {
          color: rgo.action,
        },
        "&.Mui-disabled": {
          color: rgo.disabledText,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.shape.pillBorderRadius,
        fontSize: "0.75rem",
        fontWeight: 500,
        lineHeight: "1.125rem",
      }),
    },
  },
  MuiCssBaseline: {
    styleOverrides: {
      ":focus-visible": {
        outline: `2px solid ${rgo.focus}`,
        outlineOffset: 3,
      },
      body: {
        fontOpticalSizing: "auto",
      },
      "*, *::before, *::after": {
        boxSizing: "border-box",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: ({ ownerState, theme }) => ({
        backgroundColor: rgo.surfaceRaised,
        border: `1px solid ${rgo.borderSubtle}`,
        borderRadius: ownerState.fullScreen ? 0 : theme.shape.dialogBorderRadius,
        boxShadow: rgo.shadowDialog,
      }),
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: rgo.shellSurface,
        borderColor: rgo.borderSubtle,
        '&[data-rgo-overlay-presentation="bottom-drawer"], &[data-rgo-overlay-presentation="overlay-panel"]': {
          backgroundColor: rgo.surfaceRaised,
          backgroundImage: "none",
        },
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        color: rgo.textMuted,
        fontSize: "0.75rem",
        lineHeight: "1.125rem",
        marginLeft: 0,
        marginTop: 4,
        "&.Mui-error": {
          color: rgo.dangerFg,
        },
      },
    },
  },
  MuiIconButton: {
    defaultProps: {
      centerRipple: false,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.shape.controlBorderRadius,
        color: rgo.textMuted,
        minHeight: 44,
        minWidth: 44,
        "& .MuiTouchRipple-root": {
          borderRadius: theme.shape.controlBorderRadius,
        },
        "& .MuiTouchRipple-ripple": {
          borderRadius: `${theme.shape.controlBorderRadius}px !important`,
        },
        "& .MuiTouchRipple-child": {
          borderRadius: `${theme.shape.controlBorderRadius}px !important`,
        },
        "&:active": {
          backgroundColor: rgo.selection,
        },
        "&:hover": {
          backgroundColor: rgo.hover,
        },
        "&.Mui-disabled": {
          color: rgo.disabledText,
        },
      }),
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: rgo.text,
        fontSize: "0.875rem",
        fontWeight: 500,
        lineHeight: "1.25rem",
        "&.Mui-disabled": {
          color: rgo.disabledText,
        },
        "&.Mui-error": {
          color: rgo.dangerFg,
        },
      },
    },
  },
  MuiLink: {
    defaultProps: {
      underline: "always",
    },
    styleOverrides: {
      root: {
        color: rgo.action,
        textDecorationColor: "currentColor",
        textUnderlineOffset: "0.15em",
        "&:hover": {
          color: rgo.actionHover,
        },
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        backgroundColor: rgo.surfaceRaised,
        border: `1px solid ${rgo.borderSubtle}`,
        boxShadow: rgo.shadowPopover,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: 44,
        "&.Mui-selected": {
          backgroundColor: rgo.selection,
          color: rgo.selectionText,
          "&:hover": {
            backgroundColor: rgo.selection,
          },
        },
        "&:hover": {
          backgroundColor: rgo.hover,
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      input: {
        fontSize: "1rem",
        lineHeight: "1.5rem",
      },
      notchedOutline: {
        borderColor: rgo.borderControl,
      },
      root: ({ theme }) => ({
        backgroundColor: rgo.surface,
        borderRadius: theme.shape.controlBorderRadius,
        minHeight: 44,
        "&.Mui-disabled": {
          backgroundColor: rgo.disabledBg,
          color: rgo.disabledText,
        },
        "&.Mui-error .MuiOutlinedInput-notchedOutline": {
          borderColor: rgo.dangerFg,
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: rgo.focus,
          borderWidth: 2,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: rgo.borderControl,
        },
      }),
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: ({ theme }) => ({
        borderRadius: theme.shape.surfaceBorderRadius,
      }),
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        backgroundColor: rgo.surfaceRaised,
        border: `1px solid ${rgo.borderSubtle}`,
        boxShadow: rgo.shadowPopover,
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        color: rgo.borderControl,
        minHeight: 44,
        minWidth: 44,
        "&.Mui-checked": {
          color: rgo.action,
        },
        "&.Mui-disabled": {
          color: rgo.disabledText,
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        height: 44,
        padding: "15px 12px",
        width: 58,
      },
      switchBase: {
        color: rgo.surfaceRaised,
        padding: "12px 9px",
        "&.Mui-checked": {
          color: rgo.onAction,
          transform: "translateX(20px)",
          "& + .MuiSwitch-track": {
            backgroundColor: rgo.action,
            opacity: 1,
          },
        },
        "&.Mui-disabled": {
          color: rgo.disabledText,
        },
        "&.Mui-disabled + .MuiSwitch-track": {
          backgroundColor: rgo.disabledBg,
          opacity: 1,
        },
      },
      thumb: {
        border: `1px solid ${rgo.borderControl}`,
        boxShadow: "none",
        height: 20,
        width: 20,
      },
      track: ({ theme }) => ({
        backgroundColor: rgo.borderControl,
        borderRadius: theme.shape.pillBorderRadius,
        opacity: 1,
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        backgroundColor: rgo.surfaceSubtle,
        color: rgo.text,
        fontSize: "0.875rem",
        fontWeight: 600,
      },
      root: {
        borderBottom: `1px solid ${rgo.borderSubtle}`,
        fontSize: "0.875rem",
        fontVariantNumeric: "tabular-nums",
        lineHeight: "1.25rem",
        padding: "16px",
      },
      sizeSmall: {
        padding: "4px 12px",
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        "&.Mui-selected": {
          backgroundColor: rgo.selection,
          color: rgo.selectionText,
          "& > .MuiTableCell-root": {
            color: rgo.selectionText,
          },
          "&:hover": {
            backgroundColor: rgo.selection,
          },
        },
        "&:hover": {
          backgroundColor: rgo.hover,
        },
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.shape.controlBorderRadius,
      }),
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.shape.controlBorderRadius,
      }),
    },
  },
  MuiTooltip: {
    styleOverrides: {
      arrow: {
        color: rgo.surfaceRaised,
      },
      tooltip: ({ theme }) => ({
        backgroundColor: rgo.surfaceRaised,
        border: `1px solid ${rgo.borderSubtle}`,
        borderRadius: theme.shape.controlBorderRadius,
        boxShadow: rgo.shadowPopover,
        color: rgo.text,
        fontSize: "0.75rem",
        lineHeight: "1.125rem",
      }),
    },
  },
  MuiTypography: {
    defaultProps: {
      variantMapping: {
        dataHeadline: "h2",
        display: "h1",
        marketingHeading: "h2",
        pageTitle: "h1",
        sectionTitle: "h2",
        ui: "span",
      },
    },
  },
} satisfies NonNullable<ThemeOptions["components"]>;
