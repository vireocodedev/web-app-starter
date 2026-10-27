import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import type { PropsWithChildren } from "react";
import { styled } from "storybook/theming";

import { storybookThemes } from "./theme.js";
import { useStorybookTheme } from "./useStorybookTheme.js";

const DocsMain = styled.main({
  "& .docs-story iframe": { display: "block" },
  "& .sbdocs-content :not(pre) > code": {
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  },
});

export function StorybookDocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const { scheme } = useStorybookTheme();
  return (
    <DocsMain aria-label="Storybook documentation">
      <DocsContainer {...props} theme={storybookThemes[scheme]} />
    </DocsMain>
  );
}
