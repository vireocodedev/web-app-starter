import type { ThemeOptions } from "@mui/material/styles";

import { themeSetup } from "../themeSetup";

export const APPLICATION_TYPOGRAPHY = {
  allVariants: {
    fontOpticalSizing: "auto",
  },
  body1: {
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: "1.5rem",
  },
  body2: {
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: "1.25rem",
  },
  button: {
    fontSize: "0.875rem",
    fontWeight: 600,
    lineHeight: "1.25rem",
    textTransform: "none",
  },
  caption: {
    fontSize: "0.75rem",
    fontWeight: 400,
    lineHeight: "1.125rem",
  },
  dataHeadline: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "2rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: "2.5rem",
    "@media (max-width:599.95px)": {
      fontSize: "1.75rem",
      lineHeight: "2.25rem",
    },
  },
  display: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "3.5rem",
    fontWeight: 650,
    letterSpacing: "-0.035em",
    lineHeight: "4rem",
    "@media (max-width:599.95px)": {
      fontSize: "2.25rem",
      lineHeight: "2.75rem",
    },
  },
  fontFamily: themeSetup.fontFamily,
  fontSize: 16,
  fontWeightBold: 700,
  fontWeightMedium: 500,
  fontWeightRegular: 400,
  h1: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "3.5rem",
    fontWeight: 650,
    letterSpacing: "-0.035em",
    lineHeight: "4rem",
    "@media (max-width:599.95px)": {
      fontSize: "2.25rem",
      lineHeight: "2.75rem",
    },
  },
  h2: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "2.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: "3rem",
    "@media (max-width:599.95px)": {
      fontSize: "1.75rem",
      lineHeight: "2.25rem",
    },
  },
  h3: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "2rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: "2.5rem",
    "@media (max-width:599.95px)": {
      fontSize: "1.75rem",
      lineHeight: "2.25rem",
    },
  },
  h4: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "1.75rem",
    fontWeight: 650,
    letterSpacing: "-0.02em",
    lineHeight: "2.25rem",
    "@media (max-width:599.95px)": {
      fontSize: "1.5rem",
      lineHeight: "2rem",
    },
  },
  h5: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "1.25rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "1.75rem",
  },
  h6: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "1.25rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "1.75rem",
  },
  marketingHeading: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "2.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: "3rem",
    "@media (max-width:599.95px)": {
      fontSize: "1.75rem",
      lineHeight: "2.25rem",
    },
  },
  overline: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    lineHeight: "1rem",
  },
  pageTitle: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "1.75rem",
    fontWeight: 650,
    letterSpacing: "-0.02em",
    lineHeight: "2.25rem",
    "@media (max-width:599.95px)": {
      fontSize: "1.5rem",
      lineHeight: "2rem",
    },
  },
  sectionTitle: {
    fontFamily: themeSetup.fontDisplayFamily,
    fontSize: "1.25rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "1.75rem",
  },
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: "1.5rem",
  },
  subtitle2: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: "1.25rem",
  },
  ui: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: "1.25rem",
  },
} satisfies NonNullable<ThemeOptions["typography"]>;
