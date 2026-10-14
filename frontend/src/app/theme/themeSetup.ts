type ApplicationPaletteMode = "light" | "dark" | "soft-dark";
export type ApplicationColorMode = ApplicationPaletteMode | "system";
export type AppFontSize = "normal" | "medium" | "big";
export type AppDesktopTableSize = "small" | "medium";
export type AppEditorPresentation = "dialog" | "docked-panel" | "overlay-panel";
export type AppMotionPreference = "system" | "reduce";
export type AppLinkUnderlinePreference = "page" | "always";

export type ApplicationShape = Readonly<{
  borderRadius: number;
  controlBorderRadius: number;
  dialogBorderRadius: number;
  pillBorderRadius: number;
  surfaceBorderRadius: number;
}>;

export type RgoPaletteTokens = Readonly<{
  canvas: string;
  surface: string;
  surfaceSubtle: string;
  surfaceRaised: string;
  shellSurface: string;
  navigationSelected: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderControl: string;
  action: string;
  actionHover: string;
  actionPressed: string;
  onAction: string;
  selection: string;
  selectionText: string;
  focus: string;
  brand: string;
  brandSoft: string;
  onBrand: string;
  disabledBg: string;
  disabledText: string;
  successFg: string;
  successBg: string;
  warningFg: string;
  warningBg: string;
  dangerFg: string;
  dangerBg: string;
  dangerHover: string;
  dangerPressed: string;
  onDanger: string;
  infoFg: string;
  infoBg: string;
  offlineFg: string;
  offlineBg: string;
  hover: string;
  shadowPopover: string;
  shadowDialog: string;
  scrim: string;
}>;

type ApplicationPalette = Readonly<{
  rgo: RgoPaletteTokens;
  /** Compatibility aliases for Storybook's application-theme adapter. */
  backgroundDefault: string;
  backgroundPaper: string;
  primary: string;
  secondary: string;
  success: string;
}>;

type ApplicationThemeSetup = Readonly<{
  defaultDesktopTableSize: AppDesktopTableSize;
  defaultEditorPresentation: AppEditorPresentation;
  defaultFontSize: AppFontSize;
  defaultIncreasedContrast: boolean;
  defaultMode: ApplicationColorMode;
  defaultMotion: AppMotionPreference;
  defaultLinkUnderlines: AppLinkUnderlinePreference;
  fontFamily: string;
  fontDisplayFamily: string;
  palette: Readonly<Record<ApplicationPaletteMode, ApplicationPalette>>;
  shape: Readonly<{
    pillBorderRadius: number;
    surfaceBorderRadius: number;
    surfaceBorderRadiusRange: Readonly<{
      max: number;
      min: number;
      step: number;
    }>;
  }>;
  spacing: number;
}>;

function createApplicationPalette(rgo: RgoPaletteTokens): ApplicationPalette {
  return {
    rgo,
    // Keep these derived aliases while the Storybook adapter consumes the
    // recipe setup directly. The semantic `rgo` namespace remains the source.
    backgroundDefault: rgo.canvas,
    backgroundPaper: rgo.surface,
    primary: rgo.action,
    secondary: rgo.textSecondary,
    success: rgo.successFg,
  };
}

/** The one typed source for RGO application-brand tokens. */
export const themeSetup = {
  defaultDesktopTableSize: "small",
  defaultEditorPresentation: "docked-panel",
  defaultFontSize: "medium",
  defaultIncreasedContrast: false,
  defaultMode: "system",
  defaultMotion: "system",
  defaultLinkUnderlines: "page",
  fontFamily: '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontDisplayFamily: '"Manrope Variable", "Inter Variable", Inter, system-ui, sans-serif',
  palette: {
    dark: createApplicationPalette({
      canvas: "#0D1117",
      surface: "#151B23",
      surfaceSubtle: "#1C232D",
      surfaceRaised: "#252D38",
      shellSurface: "#010409",
      navigationSelected: "#222B35",
      text: "#F0F3F6",
      textSecondary: "#B7C0CA",
      textMuted: "#9AA5B1",
      borderSubtle: "#303842",
      borderControl: "#7D8996",
      action: "#7BD4DB",
      actionHover: "#A1E3E7",
      actionPressed: "#5DC1CA",
      onAction: "#0D1117",
      selection: "#15363C",
      selectionText: "#A1E3E7",
      focus: "#7BD4DB",
      brand: "#F27670",
      brandSoft: "#3D272B",
      onBrand: "#0D1117",
      disabledBg: "#2A323D",
      disabledText: "#9AA5B1",
      successFg: "#8ED9AC",
      successBg: "#183C31",
      warningFg: "#F2CB76",
      warningBg: "#403622",
      dangerFg: "#FFB4AB",
      dangerBg: "#472F34",
      dangerHover: "#FFCEC8",
      dangerPressed: "#F49287",
      onDanger: "#0D1117",
      infoFg: "#A5C8FF",
      infoBg: "#203A56",
      offlineFg: "#B7C0CA",
      offlineBg: "#1C232D",
      hover: "#222B35",
      shadowPopover: "0 8px 24px rgb(0 0 0 / 28%)",
      shadowDialog: "0 16px 48px rgb(0 0 0 / 36%)",
      scrim: "rgb(0 0 0 / 64%)",
    }),
    "soft-dark": createApplicationPalette({
      canvas: "#22272E",
      surface: "#2D333B",
      surfaceSubtle: "#30363D",
      surfaceRaised: "#373E47",
      shellSurface: "#1C2128",
      navigationSelected: "#373E47",
      text: "#E6EDF3",
      textSecondary: "#C3CCD5",
      textMuted: "#A5B0BB",
      borderSubtle: "#444C56",
      borderControl: "#89939E",
      action: "#7BD4DB",
      actionHover: "#A1E3E7",
      actionPressed: "#5DC1CA",
      onAction: "#1C2128",
      selection: "#20434A",
      selectionText: "#A1E3E7",
      focus: "#7BD4DB",
      brand: "#F27670",
      brandSoft: "#493238",
      onBrand: "#1C2128",
      disabledBg: "#3D444D",
      disabledText: "#A5B0BB",
      successFg: "#8ED9AC",
      successBg: "#25463A",
      warningFg: "#F2CB76",
      warningBg: "#4B402A",
      dangerFg: "#FFB4AB",
      dangerBg: "#513A40",
      dangerHover: "#FFCEC8",
      dangerPressed: "#F49287",
      onDanger: "#1C2128",
      infoFg: "#A5C8FF",
      infoBg: "#2C455F",
      offlineFg: "#C3CCD5",
      offlineBg: "#30363D",
      hover: "#373E47",
      shadowPopover: "0 8px 24px rgb(0 0 0 / 28%)",
      shadowDialog: "0 16px 48px rgb(0 0 0 / 36%)",
      scrim: "rgb(0 0 0 / 64%)",
    }),
    light: createApplicationPalette({
      canvas: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceSubtle: "#F6F8FA",
      surfaceRaised: "#FFFFFF",
      shellSurface: "#F6F8FA",
      navigationSelected: "#E4EAF0",
      text: "#1F2328",
      textSecondary: "#59636E",
      textMuted: "#626C76",
      borderSubtle: "#D1D9E0",
      borderControl: "#79838D",
      action: "#006D77",
      actionHover: "#005B64",
      actionPressed: "#004A52",
      onAction: "#FFFFFF",
      selection: "#E0F1F2",
      selectionText: "#005B64",
      focus: "#006D77",
      brand: "#C93632",
      brandSoft: "#FDEDEC",
      onBrand: "#FFFFFF",
      disabledBg: "#EFF1F3",
      disabledText: "#626C76",
      successFg: "#236342",
      successBg: "#EAF5EE",
      warningFg: "#865300",
      warningBg: "#FFF4D6",
      dangerFg: "#B42318",
      dangerBg: "#FFF0EE",
      dangerHover: "#912018",
      dangerPressed: "#781B15",
      onDanger: "#FFFFFF",
      infoFg: "#225EA8",
      infoBg: "#EDF4FF",
      offlineFg: "#59636E",
      offlineBg: "#F6F8FA",
      hover: "#F3F6F8",
      shadowPopover: "0 8px 24px rgb(31 35 40 / 12%)",
      shadowDialog: "0 16px 48px rgb(31 35 40 / 18%)",
      scrim: "rgb(13 17 23 / 48%)",
    }),
  },
  shape: {
    pillBorderRadius: 999,
    surfaceBorderRadius: 8,
    surfaceBorderRadiusRange: {
      max: 18,
      min: 6,
      step: 2,
    },
  },
  spacing: 4,
} as const satisfies ApplicationThemeSetup;

/** Keep surfaces and brand colors stable while making boundaries and supporting text easier to distinguish. */
const increasedContrastOverrides: Readonly<
  Record<ApplicationPaletteMode, Pick<RgoPaletteTokens, "borderSubtle" | "borderControl" | "textMuted">>
> = {
  light: {
    borderSubtle: "#79838D",
    borderControl: "#59636E",
    textMuted: "#48525C",
  },
  dark: {
    borderSubtle: "#7D8996",
    borderControl: "#B7C0CA",
    textMuted: "#C3CCD5",
  },
  "soft-dark": {
    borderSubtle: "#89939E",
    borderControl: "#C3CCD5",
    textMuted: "#D0D7DE",
  },
};

export function getApplicationPalette(mode: ApplicationPaletteMode, increasedContrast = false): ApplicationPalette {
  const base = themeSetup.palette[mode];
  if (!increasedContrast) return base;
  return createApplicationPalette({ ...base.rgo, ...increasedContrastOverrides[mode] });
}

/** Clamps and snaps external values to the supported application range. */
export function normalizeApplicationSurfaceBorderRadius(value: number) {
  const { max, min, step } = themeSetup.shape.surfaceBorderRadiusRange;
  if (!Number.isFinite(value)) return themeSetup.shape.surfaceBorderRadius;

  const clamped = Math.min(max, Math.max(min, value));
  return min + Math.round((clamped - min) / step) * step;
}

/** Derives every semantic radius from the user-adjustable surface radius. */
export function deriveApplicationShape(surfaceBorderRadius: number): ApplicationShape {
  const normalizedSurfaceBorderRadius = normalizeApplicationSurfaceBorderRadius(surfaceBorderRadius);

  return {
    borderRadius: normalizedSurfaceBorderRadius,
    controlBorderRadius: Math.round(normalizedSurfaceBorderRadius / 2),
    dialogBorderRadius: Math.round((normalizedSurfaceBorderRadius * 4) / 3),
    pillBorderRadius: themeSetup.shape.pillBorderRadius,
    surfaceBorderRadius: normalizedSurfaceBorderRadius,
  };
}
