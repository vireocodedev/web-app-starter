import type { ThemeOptions } from "@mui/material/styles";

import { themeSetup } from "../themeSetup";

export const APPLICATION_SPACING = themeSetup.spacing satisfies NonNullable<ThemeOptions["spacing"]>;
