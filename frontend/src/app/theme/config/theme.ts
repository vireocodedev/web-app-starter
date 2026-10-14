import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";

import type {} from "@/app/theme/config/theme.augmentation";
import { themeSetup } from "../themeSetup";
import { APPLICATION_BREAKPOINTS } from "./theme.breakpoints";
import { APPLICATION_COMPONENTS } from "./theme.components";
import { APPLICATION_COLOR_SCHEMES, APPLICATION_INCREASED_CONTRAST_COLOR_SCHEMES } from "./theme.palette";
import { createApplicationShape } from "./theme.shape";
import { APPLICATION_SHADOWS } from "./theme.shadows";
import { APPLICATION_SPACING } from "./theme.spacing";
import { APPLICATION_MOTION, APPLICATION_TRANSITIONS } from "./theme.transitions";
import { APPLICATION_TYPOGRAPHY } from "./theme.typography";

const APPLICATION_THEME_OPTIONS = {
  breakpoints: APPLICATION_BREAKPOINTS,
  colorSchemes: APPLICATION_COLOR_SCHEMES,
  components: APPLICATION_COMPONENTS,
  cssVariables: {
    colorSchemeSelector: "data",
  },
  motion: APPLICATION_MOTION,
  shadows: APPLICATION_SHADOWS,
  spacing: APPLICATION_SPACING,
  transitions: APPLICATION_TRANSITIONS,
  typography: APPLICATION_TYPOGRAPHY,
} satisfies ThemeOptions;

/**
 * Builds the one application theme. Consumers can fold their active locale
 * and writing direction into this seam without introducing a second provider.
 */
export function createApplicationTheme(
  overrides: ThemeOptions = {},
  surfaceBorderRadius: number = themeSetup.shape.surfaceBorderRadius,
  increasedContrast: boolean = themeSetup.defaultIncreasedContrast,
) {
  return createTheme(
    {
      ...APPLICATION_THEME_OPTIONS,
      colorSchemes: increasedContrast ? APPLICATION_INCREASED_CONTRAST_COLOR_SCHEMES : APPLICATION_COLOR_SCHEMES,
    },
    overrides,
    {
      shape: createApplicationShape(surfaceBorderRadius),
    },
  );
}

export const applicationTheme = createApplicationTheme();
