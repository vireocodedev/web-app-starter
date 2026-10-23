import { Chip, Link, Stack, Typography, Box } from "@mui/material";
import { Link as RouterLink } from "react-router";

import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { DocumentationMarkdown } from "@/app/shell/documentation";

import { handbookArticle, type HandbookArticleId } from "../catalog/handbookManifest";
import { handbookMarkdown } from "../catalog/handbookMarkdown";
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

  return (
    <Stack spacing={2} sx={{ minWidth: 0, width: "100%" }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip label={t(`handbook.implementation.${article.implementation}`)} size="small" variant="outlined" />
        <Chip label={t(`handbook.size.${article.size}`)} size="small" variant="outlined" />
      </Stack>
      <DocumentationMarkdown
        markdown={handbookMarkdown(article.contentPath, locale)}
        contentsLabels={{ label: t("handbook.navigation.contents"), title: t("navigation.onThisPage") }}
        resolveHref={resolveHref}
      >
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
      </DocumentationMarkdown>
    </Stack>
  );
}
