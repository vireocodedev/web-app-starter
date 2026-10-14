import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import useAutocomplete, { createFilterOptions } from "@mui/material/useAutocomplete";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import type { AppCommandPaletteEntry } from "../types/AppCommandPaletteEntry";

const filterOptions = createFilterOptions<AppCommandPaletteEntry>({
  ignoreAccents: true,
  ignoreCase: true,
  stringify: entry => `${entry.label} ${entry.context}`,
  trim: true,
});

function anotherModalIsActive(): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>('.MuiModal-root, [role="dialog"], [role="menu"]')).some(
    element =>
      !element.closest('[aria-hidden="true"], [hidden]') &&
      window.getComputedStyle(element).visibility !== "hidden" &&
      window.getComputedStyle(element).display !== "none",
  );
}

function PageSearch({
  entries,
  onClose,
  onSelect,
}: Readonly<{
  entries: readonly AppCommandPaletteEntry[];
  onClose: () => void;
  onSelect: (entry: AppCommandPaletteEntry) => void;
}>) {
  const { t } = useAppTranslation();
  const instructionsId = useId();
  const { getRootProps, getInputProps, getListboxProps, getOptionProps, groupedOptions } = useAutocomplete({
    autoHighlight: true,
    filterOptions,
    getOptionLabel: entry => entry.label,
    getOptionKey: entry => entry.id,
    isOptionEqualToValue: (option, value) => option.id === value.id,
    onChange: (_event, entry) => {
      if (entry) onSelect(entry);
    },
    onClose: (_event, reason) => {
      if (reason === "escape") onClose();
    },
    open: true,
    options: [...entries],
  });
  const { ref: inputRef, ...inputProps } = getInputProps();
  const options = groupedOptions as AppCommandPaletteEntry[];

  return (
    <Box {...getRootProps()}>
      <TextField
        autoFocus
        fullWidth
        id={inputProps.id}
        inputRef={inputRef}
        label={t("commandPalette.search")}
        slotProps={{
          htmlInput: { ...inputProps, "aria-describedby": instructionsId },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon sx={{ color: "rgo.textMuted" }} />
              </InputAdornment>
            ),
          },
        }}
      />
      {options.length > 0 ? (
        <Box
          component="ul"
          {...getListboxProps()}
          aria-label={t("commandPalette.pages")}
          aria-labelledby={undefined}
          sx={{
            listStyle: "none",
            m: 0,
            maxHeight: { xs: "min(48dvh, 420px)", sm: "min(48vh, 420px)" },
            overflowY: "auto",
            overscrollBehavior: "contain",
            // MUI scrolls options using offsets relative to this listbox.
            position: "relative",
            p: 0.5,
            mt: 1.5,
          }}
        >
          {options.map((entry, index) => {
            const { key, ...optionProps } = getOptionProps({ option: entry, index });
            return (
              <ListItemButton
                component="li"
                key={key}
                {...optionProps}
                sx={{
                  borderRadius: 1,
                  minHeight: 56,
                  px: 1.5,
                  py: 1.25,
                  "& + li": { mt: 0.5 },
                  "&.Mui-focused": { bgcolor: "action.hover" },
                  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "rgo.focus", outlineOffset: -2 },
                }}
              >
                <ListItemText
                  primary={entry.label}
                  secondary={entry.context || undefined}
                  slotProps={{
                    primary: { sx: { fontWeight: 600, lineHeight: 1.4, overflowWrap: "anywhere" } },
                    secondary: {
                      sx: { color: "rgo.textMuted", mt: 0.25, overflowWrap: "anywhere" },
                    },
                  }}
                  sx={{ my: 0 }}
                />
              </ListItemButton>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 1, px: 2, py: 5 }}>
          <SearchOutlinedIcon sx={{ color: "rgo.textMuted", fontSize: 32 }} />
          <Typography role="status" sx={{ color: "rgo.textMuted", textAlign: "center" }}>
            {t("commandPalette.empty")}
          </Typography>
        </Box>
      )}
      <Typography
        id={instructionsId}
        sx={{
          borderTop: 1,
          borderColor: "divider",
          color: "rgo.textMuted",
          fontSize: "0.75rem",
          lineHeight: 1.5,
          mt: 1.5,
          pt: 1.5,
        }}
      >
        {t("commandPalette.instructions")}
      </Typography>
    </Box>
  );
}

/** Page search owns modal interaction; the router supplies entries and navigation. */
export function AppCommandPalette({
  entries,
  onNavigate,
}: Readonly<{
  entries: readonly AppCommandPaletteEntry[];
  onNavigate: (destination: string) => void;
}>) {
  const { t } = useAppTranslation();
  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pendingDestinationRef = useRef<string | undefined>(undefined);
  const completingRef = useRef(false);
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");

  const openPalette = useCallback(() => {
    if (phase !== "closed" || anotherModalIsActive()) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pendingDestinationRef.current = undefined;
    setPhase("open");
  }, [phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.shiftKey ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "k" ||
        (event.target instanceof HTMLElement &&
          event.target.closest('[contenteditable]:not([contenteditable="false"])')) ||
        phase !== "closed" ||
        anotherModalIsActive()
      )
        return;
      event.preventDefault();
      openPalette();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openPalette, phase]);

  useEffect(() => {
    if (phase !== "closed" || !completingRef.current) return;
    completingRef.current = false;
    const destination = pendingDestinationRef.current;
    pendingDestinationRef.current = undefined;
    // This effect runs after the dialog unmounts and releases its focus trap and aria-hidden ownership.
    // Restoring first lets an existing navigation confirmation restore the same focus on cancellation.
    const previousFocus = previousFocusRef.current;
    const canRestorePreviousFocus =
      previousFocus?.isConnected &&
      previousFocus !== document.body &&
      previousFocus !== document.documentElement &&
      !previousFocus.matches(":disabled") &&
      !previousFocus.closest("[inert]");
    if (canRestorePreviousFocus) previousFocus.focus({ preventScroll: true });
    if (!canRestorePreviousFocus || document.activeElement !== previousFocus) {
      launcherRef.current?.focus({ preventScroll: true });
    }
    if (destination !== undefined) onNavigate(destination);
  }, [onNavigate, phase]);

  const closePalette = (destination?: string) => {
    if (phase !== "open") return;
    completingRef.current = true;
    pendingDestinationRef.current = destination;
    setPhase("closing");
  };

  return (
    <>
      <Tooltip title={t("commandPalette.shortcut")}>
        <IconButton aria-label={t("commandPalette.search")} onClick={openPalette} ref={launcherRef}>
          <SearchOutlinedIcon />
        </IconButton>
      </Tooltip>
      {phase !== "closed" && (
        <Dialog
          aria-labelledby={titleId}
          disableRestoreFocus
          fullWidth
          maxWidth="sm"
          onClose={() => closePalette()}
          open={phase === "open"}
          slotProps={{
            paper: {
              sx: {
                backgroundImage: "none",
                bgcolor: "rgo.surface",
                border: 1,
                borderColor: "divider",
                m: { xs: 1, sm: 4 },
                maxHeight: "calc(100dvh - 32px)",
                width: { xs: "calc(100% - 16px)", sm: "calc(100% - 64px)" },
              },
            },
            transition: { onExited: () => setPhase("closed") },
          }}
        >
          <DialogTitle
            component="div"
            sx={{ alignItems: "center", display: "flex", gap: 1, px: { xs: 2, sm: 2.5 }, py: 1.5 }}
          >
            <Typography component="h2" id={titleId} sx={{ flex: 1, minWidth: 0 }} variant="h6">
              {t("commandPalette.search")}
            </Typography>
            <IconButton aria-label={t("commandPalette.close")} onClick={() => closePalette()}>
              <CloseOutlinedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, pb: 2, "&.MuiDialogContent-root": { pt: 3 } }}>
            <PageSearch entries={entries} onClose={() => closePalette()} onSelect={entry => closePalette(entry.to)} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
