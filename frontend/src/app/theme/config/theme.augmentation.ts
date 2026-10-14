import type {
  CSSProperties,
  CssVarsPalette,
  Palette,
  PaletteOptions,
  Shape,
  ShapeOptions,
  TypographyVariants,
  TypographyVariantsOptions,
} from "@mui/material/styles";

import type { RgoPaletteTokens } from "../themeSetup";

declare module "@mui/material/styles" {
  interface ColorSchemeOverrides {
    "soft-dark": true;
  }

  interface Palette {
    rgo: RgoPaletteTokens;
  }

  interface PaletteOptions {
    rgo?: RgoPaletteTokens;
  }

  interface CssVarsPalette {
    rgo: RgoPaletteTokens;
  }

  interface Shape {
    controlBorderRadius: number;
    dialogBorderRadius: number;
    pillBorderRadius: number;
    surfaceBorderRadius: number;
  }

  interface ShapeOptions {
    controlBorderRadius?: number;
    dialogBorderRadius?: number;
    pillBorderRadius?: number;
    surfaceBorderRadius?: number;
  }

  interface TypographyVariants {
    dataHeadline: CSSProperties;
    display: CSSProperties;
    marketingHeading: CSSProperties;
    pageTitle: CSSProperties;
    sectionTitle: CSSProperties;
    ui: CSSProperties;
  }

  interface TypographyVariantsOptions {
    dataHeadline?: CSSProperties;
    display?: CSSProperties;
    marketingHeading?: CSSProperties;
    pageTitle?: CSSProperties;
    sectionTitle?: CSSProperties;
    ui?: CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    dataHeadline: true;
    display: true;
    marketingHeading: true;
    pageTitle: true;
    sectionTitle: true;
    ui: true;
  }
}

export type ApplicationThemePalette = Palette;
export type ApplicationThemePaletteOptions = PaletteOptions;
export type ApplicationThemeCssVarsPalette = CssVarsPalette;
export type ApplicationThemeShape = Shape;
export type ApplicationThemeShapeOptions = ShapeOptions;
export type ApplicationThemeTypography = TypographyVariants;
export type ApplicationThemeTypographyOptions = TypographyVariantsOptions;
