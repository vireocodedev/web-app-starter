import { Alert, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { ParseKeys } from "i18next";
import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { DocumentationMarkdown } from "../../../shared/documentation";
import { resolveReferenceHref } from "../../../shared/documentation/referenceLinks";
import { loadArchitectureMarkdown, type ArchitectureArticleId } from "../catalog/architectureArticles";
export type ArchitectureRelatedLink = Readonly<{ labelKey: ParseKeys<"development-guide">; to: string }>;
export function ArchitectureArticle({
  articleId,
}: Readonly<{ articleId: ArchitectureArticleId; relatedPatternLinks?: readonly ArchitectureRelatedLink[] }>) {
  const { locale } = useAppLocalization();
  const [state, setState] = useState<Readonly<{ key: string; markdown?: string; failed?: boolean }>>({ key: "" });
  const [attempt, setAttempt] = useState(0);
  const key = `${locale}/${articleId}/${attempt}`;
  useEffect(() => {
    let current = true;
    void loadArchitectureMarkdown(articleId, locale).then(
      markdown => {
        if (current) setState({ key, markdown });
      },
      () => {
        if (current) setState({ key, failed: true });
      },
    );
    return () => {
      current = false;
    };
  }, [articleId, locale, key]);
  if (state.key !== key) return <Typography role="status">Loading selected article…</Typography>;
  if (state.failed)
    return (
      <Alert severity="error">
        This article could not be loaded. <Button onClick={() => setAttempt(value => value + 1)}>Retry article</Button>
      </Alert>
    );
  return (
    <Stack>
      <DocumentationMarkdown
        markdown={state.markdown ?? ""}
        contentsLabels={{ label: "Article contents", title: "On this page" }}
        resolveHref={href => resolveReferenceHref(`/frontend/docs/architecture/${locale}/${articleId}.md`, href)}
      />
    </Stack>
  );
}
