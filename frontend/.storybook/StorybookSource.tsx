import {
  CodeOrSourceMdx,
  DocsContext,
  SourceContext,
  useSourceProps,
  type SourceProps,
} from "@storybook/addon-docs/blocks";
import { useContext } from "react";

/** Resolve Source snippets normally, then inherit the surrounding Docs palette. */
export function StorybookSource(props: SourceProps) {
  const docsContext = useContext(DocsContext);
  const sourceContext = useContext(SourceContext);
  const source = {
    ...useSourceProps(props, docsContext, sourceContext),
    copyable: props.copyable,
    // The Source block otherwise installs Storybook's built-in light theme.
    dark: undefined,
  };
  return (
    <CodeOrSourceMdx {...source} className={`language-${source.language ?? "text"}`}>
      {source.code}
    </CodeOrSourceMdx>
  );
}
