import { Alert, Box, Button, Chip, Link, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, MemoryRouter, useLocation, useNavigate } from "react-router";

import { loadArchitectureMarkdown } from "../../architecture/ArchitectureReference/catalog/architectureArticles";
import { loadHandbookMarkdown } from "../../handbook/Handbook/catalog/handbookMarkdown";
import { handbookCategories, handbookTopics } from "../../handbook/Handbook/catalog/handbookManifest";
import { StorybookAddressBar } from "../../routing/shared/StorybookAddressBar";
import { DocumentationMarkdown } from "./DocumentationMarkdown";
import { handbookLabel, referenceArticles, resolveReferenceHref, type ReferenceArticle } from "./referenceLinks";

type Content = { status: "loading" } | { status: "ready"; markdown: string } | { status: "error" };

function ReferenceBody({ article }: Readonly<{ article: ReferenceArticle }>) {
  const { hash } = useLocation();
  const body = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [content, setContent] = useState<Content>({ status: "loading" });
  useEffect(() => {
    let current = true;
    const load =
      article.kind === "handbook"
        ? loadHandbookMarkdown(article.contentPath, "en")
        : loadArchitectureMarkdown(article.article.id, "en");
    void load.then(
      markdown => {
        if (current) setContent({ status: "ready", markdown });
      },
      () => {
        if (current) setContent({ status: "error" });
      },
    );
    return () => {
      current = false;
    };
  }, [article, attempt]);
  useEffect(() => {
    if (content.status !== "ready" || !hash) return;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      // A malformed fragment must not prevent the article from being read.
      return;
    }
    let current = true;
    const frame = window.requestAnimationFrame(() => {
      if (!current) return;
      const container = body.current;
      const target = container?.ownerDocument.getElementById(id);
      if (target && container?.contains(target)) target.scrollIntoView?.({ block: "start", behavior: "auto" });
    });
    return () => {
      current = false;
      window.cancelAnimationFrame(frame);
    };
  }, [content.status, hash]);

  return (
    <Box aria-busy={content.status === "loading"} ref={body}>
      {article.kind === "handbook" ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={handbookLabel(`implementation.${article.article.implementation}`)} size="small" />
          <Chip label={handbookLabel(`size.${article.article.size}`)} size="small" />
        </Stack>
      ) : null}
      {content.status === "loading" ? (
        <Typography role="status">Loading selected article…</Typography>
      ) : content.status === "error" ? (
        <Alert severity="error">
          The selected article could not be loaded.{" "}
          <Button
            onClick={() => {
              setContent({ status: "loading" });
              setAttempt(value => value + 1);
            }}
          >
            Retry article
          </Button>{" "}
          Refresh the page if the browser retains a failed module request.
        </Alert>
      ) : (
        <DocumentationMarkdown
          markdown={content.markdown}
          contentsLabels={{ label: "Article contents", title: "On this page" }}
          resolveHref={href => resolveReferenceHref(article.sourcePath, href)}
        />
      )}
      {article.kind === "handbook" ? (
        <Box component="nav" aria-label="Related reading" sx={{ mt: 3 }}>
          <Typography component="h2" variant="h6">
            Related reading
          </Typography>
          {referenceArticles
            .filter(
              candidate =>
                candidate.kind === "handbook" &&
                (article.article.relatedArticleIds?.includes(candidate.id) ??
                  candidate.article.topicId === article.article.topicId) &&
                candidate.id !== article.id,
            )
            .map(candidate => (
              <Box key={candidate.id}>
                <Link component={RouterLink} to={candidate.to}>
                  {candidate.title}
                </Link>
              </Box>
            ))}
        </Box>
      ) : null}
    </Box>
  );
}

function ReferenceReaderContent({ initialKind }: Readonly<{ initialKind: ReferenceArticle["kind"] }>) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const article = referenceArticles.find(candidate => candidate.to === pathname);
  const kind = pathname.startsWith("/architecture")
    ? "architecture"
    : pathname.startsWith("/handbook")
      ? "handbook"
      : initialKind;
  const records = referenceArticles.filter(candidate => candidate.kind === kind);
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = records.filter(candidate => {
    const topic =
      candidate.kind === "handbook" ? handbookTopics.find(value => value.id === candidate.article.topicId) : undefined;
    const group = topic ? handbookCategories.find(value => value.id === topic.categoryId) : undefined;
    const sourceText =
      candidate.kind === "handbook"
        ? candidate.article.sources.map(source => `${source.project}@${source.revision}:${source.path}`).join(" ")
        : "";
    const searchable =
      `${candidate.title} ${candidate.description} ${group ? handbookLabel(group.titleKey) : ""} ${topic ? handbookLabel(topic.titleKey) : ""} ${sourceText}`.toLowerCase();
    return (
      (kind !== "handbook" || category === "all" || group?.id === category) &&
      tokens.every(token => searchable.includes(token))
    );
  });
  return (
    <Stack spacing={3} sx={{ minWidth: 0, p: { xs: 2, sm: 3 } }}>
      <StorybookAddressBar />
      <Typography component="h1" variant="h4">
        {kind === "handbook" ? "Handbook reference" : "Architecture reference"}
      </Typography>
      <Typography>
        Read the complete English reference. Bodies load only for the selected article. Both canonical language files
        remain in docs; pinned source references retain their original provenance.
      </Typography>
      <Stack component="nav" aria-label="Reference collections" direction="row" spacing={2}>
        <Link
          component={RouterLink}
          to="/handbook"
          onClick={() => {
            setQuery("");
            setCategory("all");
          }}
        >
          Handbook ({referenceArticles.filter(value => value.kind === "handbook").length})
        </Link>
        <Link
          component={RouterLink}
          to="/architecture"
          onClick={() => {
            setQuery("");
            setCategory("all");
          }}
        >
          Architecture (15)
        </Link>
      </Stack>
      <TextField
        label="Search reference articles"
        type="search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        helperText="Search titles, summaries, categories, topics and pinned source references."
      />
      {kind === "handbook" ? (
        <TextField
          select
          label="Category"
          value={category}
          onChange={event => setCategory(event.target.value)}
          slotProps={{ select: { native: true } }}
        >
          <option value="all">All categories</option>
          {handbookCategories.map(value => (
            <option key={value.id} value={value.id}>
              {handbookLabel(value.titleKey)}
            </option>
          ))}
        </TextField>
      ) : null}
      <TextField
        select
        label="Read article"
        value={filtered.some(value => value.to === pathname) ? pathname : ""}
        onChange={event => {
          if (event.target.value) void navigate(event.target.value);
        }}
        slotProps={{ select: { native: true } }}
      >
        <option value="">Choose an article</option>
        {filtered.map(value => (
          <option key={value.id} value={value.to}>
            {value.title}
          </option>
        ))}
      </TextField>
      <Typography role="status">
        Matching articles: {filtered.length} of {records.length}.
      </Typography>
      {article ? (
        <ReferenceBody article={article} key={article.to} />
      ) : (
        <Box component="nav" aria-label="Matching reference articles">
          <Stack component="ul" spacing={1} sx={{ pl: 3 }}>
            {filtered.map(value => (
              <li key={value.id}>
                <Link component={RouterLink} to={value.to}>
                  {value.title}
                </Link>
                <Typography color="text.secondary" variant="body2">
                  {value.description}
                </Typography>
              </li>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export function ReferenceReader({
  kind = "handbook",
  initialPath,
}: Readonly<{ kind?: ReferenceArticle["kind"]; initialPath?: string }>) {
  return (
    <MemoryRouter initialEntries={[initialPath ?? `/${kind}`]}>
      <ReferenceReaderContent initialKind={kind} />
    </MemoryRouter>
  );
}
