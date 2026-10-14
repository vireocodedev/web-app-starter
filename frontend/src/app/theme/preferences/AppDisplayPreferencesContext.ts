import { createContext } from "react";

import type { AppDesktopTableSize, AppEditorPresentation, AppFontSize } from "../themeSetup";

export type AppDisplayPreferencesValue = Readonly<{
  desktopTableSize: AppDesktopTableSize;
  editorPresentation: AppEditorPresentation;
  fixedColorMode: "system" | "light" | "dark" | "soft-dark" | undefined;
  fontSize: AppFontSize;
  increasedContrast: boolean;
  setDesktopTableSize: (size: AppDesktopTableSize) => void;
  setEditorPresentation: (presentation: AppEditorPresentation) => void;
  setFontSize: (fontSize: AppFontSize) => void;
  setIncreasedContrast: (increasedContrast: boolean) => void;
  setSurfaceBorderRadius: (surfaceBorderRadius: number) => void;
  surfaceBorderRadius: number;
}>;

export const AppDisplayPreferencesContext = createContext<AppDisplayPreferencesValue | null>(null);
