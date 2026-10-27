import { Alert, AlertTitle, Box, Button, Chip, LinearProgress, Link, Stack, Typography } from "@mui/material";
import { useLayoutEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router";

import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useDevelopmentGuideTranslation } from "../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { DocumentationMarkdown } from "../../../shared/documentation";

import { handbookArticle, type HandbookArticleId } from "../catalog/handbookManifest";
import { useHandbookMarkdown } from "../hooks/useHandbookMarkdown";
import type { HandbookRelatedLink } from "../types/HandbookArticle";

export function HandbookArticle({
  articleId,
  resolveHref,
  relatedLinks = [],
}: Readonly<{
  articleId: HandbookArticleId;
  resolveHref: (href: string | undefined) => string | undefined;
  relatedLinks?: readonly HandbookRelatedLink[];
}>) {
  const { locale } = useAppLocalization();
  const { t } = useDevelopmentGuideTranslation();
  const article = handbookArticle(articleId);
  const content = useHandbookMarkdown(article.contentPath, locale);
  const body = useRef<HTMLDivElement>(null);
  const [measuredBody, setMeasuredBody] = useState<Readonly<{ articleId: HandbookArticleId; height: number }> | null>(
    null,
  );

  useLayoutEffect(() => {
    if (content.status !== "ready" || !body.current) return;
    const element = body.current;
    let active = true;
    const measure = () => {
      if (!active) return;
      const height = Math.ceil(element.getBoundingClientRect().height);
      setMeasuredBody(current =>
        current?.articleId === articleId && current.height === height ? current : { articleId, height },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [articleId, content.status, locale]);

  return (
    <Stack spacing={2} sx={{ minWidth: 0, width: "100%" }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip label={t(`handbook.implementation.${article.implementation}`)} size="small" variant="outlined" />
        <Chip label={t(`handbook.size.${article.size}`)} size="small" variant="outlined" />
      </Stack>
      <Box
        aria-busy={content.status === "loading"}
        ref={body}
        sx={{
          minWidth: 0,
          // A locale switch/retry removes the old body immediately, without collapsing its reading space.
          minHeight:
            content.status === "loading"
              ? measuredBody?.articleId === articleId
                ? measuredBody.height
                : "min(65vh, 36rem)"
              : undefined,
        }}
      >
        {content.status === "ready" ? (
          <DocumentationMarkdown
            markdown={content.markdown}
            contentsLabels={{ label: t("handbook.navigation.contents"), title: t("navigation.onThisPage") }}
            resolveHref={resolveHref}
          />
        ) : (
          <Stack spacing={2}>
            <Typography component="h2" variant="h4" sx={{ fontWeight: 700 }}>
              {t(article.titleKey)}
            </Typography>
            {content.status === "loading" ? (
              <Box aria-live="polite" role="status">
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {t("handbook.loading.message")}
                </Typography>
                <LinearProgress aria-label={t("handbook.loading.progress")} />
              </Box>
            ) : (
              <Alert severity="error">
                <AlertTitle>{t("handbook.loading.errorTitle")}</AlertTitle>
                <Typography>{t("handbook.loading.errorMessage")}</Typography>
                <Typography sx={{ mt: 1 }}>{t("handbook.loading.refreshHint")}</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}>
                  <Button onClick={content.retry} variant="outlined">
                    {t("handbook.loading.retry")}
                  </Button>
                  <Button onClick={() => window.location.reload()}>{t("handbook.loading.refresh")}</Button>
                </Stack>
              </Alert>
            )}
          </Stack>
        )}
      </Box>
      {relatedLinks.length ? (
        <Box aria-label={t("handbook.navigation.related")} component="nav" sx={{ mt: 5 }}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            {t("handbook.navigation.related")}
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            {relatedLinks.map(link => (
              <li key={link.to}>
                <Link component={RouterLink} to={link.to} underline="hover">
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}
