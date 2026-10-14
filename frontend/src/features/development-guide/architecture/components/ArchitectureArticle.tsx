import { Box, Link, TableContainer, Typography } from "@mui/material";
import type { ParseKeys } from "i18next";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Link as RouterLink } from "react-router";
import remarkGfm from "remark-gfm";

import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { DocumentationContents } from "@/app/shell/documentation";

import {
  architectureArticle,
  architectureArticleCatalog,
  type ArchitectureArticleId,
} from "../catalog/architectureArticles";
import { markdownHeadingId, markdownHeadings } from "../utils/markdownHeadings";

function textContent(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(textContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    return textContent((children as Readonly<{ props: { children?: ReactNode } }>).props.children);
  }
  return "";
}

function documentationHref(href: string | undefined) {
  if (!href) return undefined;
  const [path, hash] = href.split("#");
  const fileName = path?.split("/").at(-1);
  const articleId = fileName?.replace(/\.md$/, "");
  const article = architectureArticleCatalog.find(candidate => candidate.id === articleId);
  return article ? `/dev-guide/architecture/${article.id}${hash ? `#${hash}` : ""}` : href;
}

const markdownComponents: Components = {
  a({ children, href }) {
    const resolvedHref = documentationHref(href);
    if (resolvedHref?.startsWith("/")) {
      return (
        <Link component={RouterLink} sx={{ overflowWrap: "anywhere" }} to={resolvedHref} underline="hover">
          {children}
        </Link>
      );
    }

    return (
      <Link
        href={resolvedHref}
        rel={resolvedHref?.startsWith("http") ? "noopener noreferrer" : undefined}
        sx={{ overflowWrap: "anywhere" }}
        target={resolvedHref?.startsWith("http") ? "_blank" : undefined}
        underline="hover"
      >
        {children}
      </Link>
    );
  },
  code({ children, className }) {
    const block = className?.startsWith("language-");
    return (
      <Box
        className={className}
        component="code"
        sx={
          block
            ? undefined
            : {
                bgcolor: "action.hover",
                borderRadius: 0.5,
                fontFamily: "monospace",
                fontSize: "0.875em",
                overflowWrap: "anywhere",
                px: 0.5,
                py: 0.125,
              }
        }
      >
        {children}
      </Box>
    );
  },
  h1({ children }) {
    return (
      <Typography component="h2" sx={{ fontWeight: 700 }} variant="h4">
        {children}
      </Typography>
    );
  },
  h2({ children }) {
    return (
      <Typography
        component="h2"
        id={markdownHeadingId(textContent(children))}
        sx={{ fontWeight: 700, scrollMarginTop: "6rem" }}
        variant="h5"
      >
        {children}
      </Typography>
    );
  },
  h3({ children }) {
    return (
      <Typography
        component="h3"
        id={markdownHeadingId(textContent(children))}
        sx={{ fontWeight: 700, scrollMarginTop: "6rem" }}
        variant="h6"
      >
        {children}
      </Typography>
    );
  },
  p({ children }) {
    return (
      <Typography component="p" variant="body1">
        {children}
      </Typography>
    );
  },
  pre({ children }) {
    return (
      <Box
        component="pre"
        tabIndex={0}
        sx={{
          bgcolor: "rgo.surfaceSubtle",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          fontFamily: "monospace",
          boxSizing: "border-box",
          fontSize: "0.8125rem",
          lineHeight: 1.6,
          m: 0,
          maxWidth: "100%",
          overflowX: "auto",
          p: 2,
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: "-2px",
          },
        }}
      >
        {children}
      </Box>
    );
  },
  table({ children }) {
    return (
      <TableContainer sx={{ maxWidth: "100%", minWidth: 0, my: 2, overflowX: "auto" }}>
        <Box component="table" sx={{ borderCollapse: "collapse", minWidth: "100%", width: "max-content" }}>
          {children}
        </Box>
      </TableContainer>
    );
  },
  td({ children }) {
    return (
      <Box component="td" sx={{ borderBottom: "1px solid", borderColor: "divider", p: 1 }}>
        {children}
      </Box>
    );
  },
  th({ children }) {
    return (
      <Box
        component="th"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          fontWeight: 700,
          p: 1,
          textAlign: "left",
        }}
      >
        {children}
      </Box>
    );
  },
};

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
  const headings = markdownHeadings(markdown);

  return (
    <Box component="article" sx={{ maxWidth: "100%", minWidth: 0, width: "100%" }}>
      <DocumentationContents
        items={headings}
        label={t("architectureGuide.contents.label")}
        title={t("architectureGuide.contents.title")}
      />
      <Box
        sx={{
          maxWidth: "100%",
          minWidth: 0,
          overflowWrap: "anywhere",
          "& > :first-of-type": { mt: 0 },
          "& blockquote": {
            borderLeft: "3px solid",
            borderColor: "primary.main",
            color: "text.secondary",
            m: 0,
            pl: 2,
          },
          "& li": { mb: 0.75 },
          "& ol, & ul": { pl: 3 },
          "& p": { lineHeight: 1.75 },
          "& > h2, & > h3": { mb: 1.5, mt: 5 },
        }}
      >
        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </Box>
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
    </Box>
  );
}
