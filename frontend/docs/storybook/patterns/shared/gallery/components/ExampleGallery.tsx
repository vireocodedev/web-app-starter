import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { Alert, Box, Card, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";
import { DocumentationContents, useDocumentationRail } from "../../../../shared/documentation";

import { ExampleCodeBlock } from "./ExampleCodeBlock";

declare const __RGO_EXAMPLE_SOURCE__: Readonly<{
  repositoryBaseUrl: string | null;
  editorEndpoint: string | null;
}>;

type ExampleGalleryEntry = Readonly<{
  code: string;
  description: string;
  id: string;
  preview: ReactNode;
  sourcePath: string;
  title: string;
}>;

export type ExampleGalleryResources = Readonly<{
  codeLabels: Readonly<{
    hide: string;
    language: string;
    show: string;
  }>;
  contents: Readonly<{
    label: string;
    title: string;
  }>;
  examples: readonly ExampleGalleryEntry[];
}>;

type ExampleGalleryProps = Readonly<{
  resources: ExampleGalleryResources;
}>;

type ExampleGalleryCardProps = Readonly<{
  codeLabels: ExampleGalleryResources["codeLabels"];
  defaultCodeExpanded: boolean;
  example: ExampleGalleryEntry;
}>;

function ExampleGalleryCard({ codeLabels, defaultCodeExpanded, example }: ExampleGalleryCardProps) {
  const { t } = useDevelopmentGuideTranslation();
  const [openingSource, setOpeningSource] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  const sourceConfig = typeof __RGO_EXAMPLE_SOURCE__ === "undefined" ? null : __RGO_EXAMPLE_SOURCE__;
  const editorEndpoint = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    ? sourceConfig?.editorEndpoint
    : null;
  const sourceHref = sourceConfig?.repositoryBaseUrl
    ? `${sourceConfig.repositoryBaseUrl.replace(/\/$/, "")}/${example.sourcePath.split("/").map(encodeURIComponent).join("/")}`
    : null;
  const sourceLabel = t(
    editorEndpoint
      ? "exampleGallery.source.openEditor"
      : sourceHref
        ? "exampleGallery.source.openRepository"
        : "exampleGallery.source.unavailable",
  );
  const [previewRuntime, setPreviewRuntime] = useState(() => ({
    queryClient: createAppQueryClient(),
    revision: 0,
  }));

  useEffect(
    () => () => {
      void previewRuntime.queryClient.cancelQueries();
      previewRuntime.queryClient.clear();
    },
    [previewRuntime.queryClient],
  );

  const reloadPreview = () => {
    previewRuntime.queryClient.clear();
    setPreviewRuntime(({ revision }) => ({
      queryClient: createAppQueryClient(),
      revision: revision + 1,
    }));
  };

  const openEditor = async () => {
    if (!editorEndpoint || openingSource) return;

    setOpeningSource(true);
    setSourceError(false);
    try {
      const response = await fetch(editorEndpoint, {
        body: JSON.stringify({ path: example.sourcePath }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error("Editor request failed");
    } catch {
      setSourceError(true);
    } finally {
      setOpeningSource(false);
    }
  };

  return (
    <Stack
      component="section"
      id={example.id}
      sx={{
        scrollMarginTop: "6rem",
        width: "100%",
      }}
      spacing={3}
    >
      <Box>
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h6">
          {example.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, opacity: 0.8 }} variant="body2">
          {example.description}
        </Typography>
      </Box>

      <Card
        variant="outlined"
        sx={theme => {
          const borderSubtle = theme.palette.rgo?.borderSubtle ?? theme.palette.divider;
          const borderControl = theme.palette.rgo?.borderControl ?? theme.palette.divider;

          return {
            bgcolor: "background.paper",
            borderColor: `color-mix(in srgb, ${borderSubtle} 50%, ${borderControl})`,
            overflow: "hidden",
            ...theme.applyStyles("dark", {
              borderColor: `var(--mui-palette-rgo-borderSubtle, ${theme.palette.divider})`,
            }),
          };
        }}
      >
        <Box
          sx={theme => {
            const accent = `var(--mui-palette-primary-main, ${theme.palette.primary.main})`;
            const pattern = `var(--mui-palette-rgo-borderControl, ${theme.palette.divider})`;

            return {
              alignItems: "center",
              bgcolor: "rgo.surfaceSubtle",
              backgroundImage: [
                `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${accent} 12%, transparent) 0%, transparent 52%)`,
                `radial-gradient(circle, color-mix(in srgb, ${pattern} 42%, transparent) 1px, transparent 1px)`,
              ].join(","),
              backgroundPosition: "center, center",
              backgroundSize: "100% 100%, 20px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 180,
              p: { sm: 4, xs: 3 },
              position: "relative",
              ...theme.applyStyles("dark", {
                backgroundImage: [
                  `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${accent} 10%, transparent) 0%, transparent 52%)`,
                  `radial-gradient(circle, color-mix(in srgb, ${pattern} 30%, transparent) 1px, transparent 1px)`,
                ].join(","),
              }),
            };
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              position: "absolute",
              right: { sm: 1.5, xs: 1 },
              top: { sm: 1.5, xs: 1 },
              zIndex: 1,
            }}
          >
            <Tooltip title={sourceLabel}>
              <span>
                {!editorEndpoint && sourceHref ? (
                  <IconButton
                    aria-label={sourceLabel}
                    component="a"
                    href={sourceHref}
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ color: "text.secondary" }}
                    target="_blank"
                  >
                    <CodeOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton
                    aria-label={sourceLabel}
                    disabled={!editorEndpoint || openingSource}
                    onClick={() => void openEditor()}
                    size="small"
                    sx={{ color: "text.secondary" }}
                  >
                    <CodeOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </span>
            </Tooltip>
            <Tooltip title={t("exampleGallery.reload")}>
              <IconButton
                aria-label={t("exampleGallery.reload")}
                onClick={reloadPreview}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <RefreshOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <QueryClientProvider client={previewRuntime.queryClient}>
            <Box
              key={previewRuntime.revision}
              sx={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                minWidth: 0,
                py: 3.5,
                width: "100%",
                "& > *": {
                  maxWidth: "100%",
                },
                "& > .MuiStack-root": {
                  alignItems: "center",
                  justifyContent: "center",
                },
              }}
            >
              {example.preview}
            </Box>
          </QueryClientProvider>
        </Box>
        {sourceError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {t("exampleGallery.source.editorError")}
          </Alert>
        ) : null}
        <ExampleCodeBlock
          code={example.code}
          defaultExpanded={defaultCodeExpanded}
          hideLabel={codeLabels.hide}
          languageLabel={codeLabels.language}
          showLabel={codeLabels.show}
        />
      </Card>
    </Stack>
  );
}

/** Renders the shared contents legend and interactive example gallery. */
export function ExampleGallery({ resources }: ExampleGalleryProps) {
  const examplesRail = useDocumentationRail();
  const contentsNavigation = (
    <DocumentationContents
      items={resources.examples}
      label={resources.contents.label}
      title={resources.contents.title}
    />
  );
  const gallery = (
    <Stack spacing={{ sm: 8, xs: 6 }} sx={{ minWidth: 0, width: "100%" }}>
      {resources.examples.map(example => (
        <ExampleGalleryCard codeLabels={resources.codeLabels} defaultCodeExpanded example={example} key={example.id} />
      ))}
    </Stack>
  );

  return (
    <Box sx={{ minWidth: 0, width: "100%" }}>
      {examplesRail ? (
        <>
          {contentsNavigation}
          {gallery}
        </>
      ) : (
        <Stack spacing={6}>
          {contentsNavigation}
          {gallery}
        </Stack>
      )}
    </Box>
  );
}
