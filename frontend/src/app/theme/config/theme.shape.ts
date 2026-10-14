import type { ThemeOptions } from "@mui/material/styles";

import { deriveApplicationShape, themeSetup } from "../themeSetup";

export function createApplicationShape(surfaceBorderRadius: number) {
  return deriveApplicationShape(surfaceBorderRadius) satisfies NonNullable<ThemeOptions["shape"]>;
}

export const APPLICATION_SHAPE = createApplicationShape(themeSetup.shape.surfaceBorderRadius);
