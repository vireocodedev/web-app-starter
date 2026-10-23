import { Box, Link, TableContainer, Typography } from "@mui/material";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Link as RouterLink } from "react-router";
import remarkGfm from "remark-gfm";

import { DocumentationContents } from "./DocumentationContents";
import { markdownHeadingId, markdownHeadings } from "./markdownHeadings";

export type DocumentationMarkdownProps = Readonly<{
  markdown: string;
  contentsLabels: Readonly<{ label: string; title: string }>;
  resolveHref?: (href: string | undefined) => string | undefined;
  children?: ReactNode;
}>;

function textContent(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    return textContent((children as Readonly<{ props: { children?: ReactNode } }>).props.children);
  }
  return "";
}

function safeDocumentationHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const destination = href.trim();
  if (
    destination.startsWith("//") ||
    destination.includes("\\") ||
    [...destination].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  )
    return undefined;
  // Link resolvers are content adapters, not a way around Markdown's URL safety policy.
  const protocol = destination.match(/^([a-z][a-z0-9+.-]*):/i)?.[1];
  if (protocol && !["http", "https", "mailto", "tel"].includes(protocol.toLowerCase())) return undefined;
  return destination;
}

/** Markdown presentation takes translated labels and content-owned link resolution as data. */
export function DocumentationMarkdown({ markdown, contentsLabels, resolveHref, children }: DocumentationMarkdownProps) {
  const headings = markdownHeadings(markdown);
  const headingIds = new Map(headings.map(heading => [heading.sourceLine, heading.id]));
  const markdownComponents: Components = {
    a({ children, href }) {
      const resolvedHref = safeDocumentationHref(resolveHref ? resolveHref(href) : href);
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
          rel={resolvedHref !== undefined && /^https?:/i.test(resolvedHref) ? "noopener noreferrer" : undefined}
          sx={{ overflowWrap: "anywhere" }}
          target={resolvedHref !== undefined && /^https?:/i.test(resolvedHref) ? "_blank" : undefined}
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
    h2({ children, node }) {
      return (
        <Typography
          component="h2"
          id={headingIds.get(node?.position?.start.line ?? 0) ?? markdownHeadingId(textContent(children))}
          sx={{ fontWeight: 700, scrollMarginTop: "6rem" }}
          variant="h5"
        >
          {children}
        </Typography>
      );
    },
    h3({ children, node }) {
      return (
        <Typography
          component="h3"
          id={headingIds.get(node?.position?.start.line ?? 0) ?? markdownHeadingId(textContent(children))}
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

  return (
    <Box component="article" sx={{ maxWidth: "100%", minWidth: 0, width: "100%" }}>
      <DocumentationContents items={headings} label={contentsLabels.label} title={contentsLabels.title} />
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
        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} skipHtml>
          {markdown}
        </ReactMarkdown>
      </Box>
      {children}
    </Box>
  );
}
