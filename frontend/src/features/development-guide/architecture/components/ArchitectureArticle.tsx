import { Box, Link, Typography } from "@mui/material";
import type { ParseKeys } from "i18next";
import { Link as RouterLink } from "react-router";

import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { DocumentationMarkdown } from "@/app/shell/documentation";

import {
  architectureArticle,
  architectureArticleCatalog,
  type ArchitectureArticleId,
} from "../catalog/architectureArticles";

function documentationHref(href: string | undefined) {
  if (!href) return undefined;
  const [path, hash] = href.split("#");
  const fileName = path?.split("/").at(-1);
  const articleId = fileName?.replace(/\.md$/, "");
  const article = architectureArticleCatalog.find(candidate => candidate.id === articleId);
  return article ? `/dev-guide/frontend/architecture/${article.id}${hash ? `#${hash}` : ""}` : href;
}

export type ArchitectureRelatedLink = Readonly<{
  labelKey: ParseKeys<"development-guide">;
  to: string;
}>;

export function ArchitectureArticle({
  articleId,
  relatedPatternLinks = [],
}: Readonly<{
  articleId: ArchitectureArticleId;
  relatedPatternLinks?: readonly ArchitectureRelatedLink[];
}>) {
  const { locale } = useAppLocalization();
  const { t } = useDevelopmentGuideTranslation();
  const article = architectureArticle(articleId);
  const markdown = article.markdown[locale];

  return (
    <DocumentationMarkdown
      markdown={markdown}
      contentsLabels={{ label: t("architectureGuide.contents.label"), title: t("architectureGuide.contents.title") }}
      resolveHref={documentationHref}
    >
      {relatedPatternLinks.length > 0 ? (
        <Box aria-label={t("architectureGuide.relatedPatterns.label")} component="nav" sx={{ mt: 5 }}>
          <Typography component="h2" sx={{ fontWeight: 700 }} variant="h6">
            {t("architectureGuide.relatedPatterns.title")}
          </Typography>
          <Box component="ul" sx={{ mb: 0, mt: 1, pl: 3 }}>
            {relatedPatternLinks.map(link => (
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
  );
}
