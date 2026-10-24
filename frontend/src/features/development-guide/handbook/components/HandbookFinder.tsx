import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useRef } from "react";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { AppCategoryList } from "@/app/shell/components/AppCategoryList";

import type { HandbookFinderProps } from "../types/HandbookFinder";
import { filterHandbookEntries } from "../utils/filterHandbookEntries";

const implementationOptions = ["all", "starter", "reference", "mixed"] as const;
const sizeOptions = ["all", "small", "medium", "large"] as const;

/** Controlled metadata discovery; URL ownership and concrete destinations remain with the router. */
export function HandbookFinder({ entries, filters, onFiltersChange }: HandbookFinderProps) {
  const { t } = useDevelopmentGuideTranslation();
  const searchInput = useRef<HTMLInputElement>(null);
  const categories = [...new Map(entries.map(entry => [entry.category.id, entry.category])).values()];
  const topicCount = new Set(entries.map(entry => entry.topic.id)).size;
  const projectCount = new Set(entries.flatMap(entry => entry.sources.map(source => source.project))).size;
  const active = Boolean(
    filters.q.trim() || filters.category !== "all" || filters.implementation !== "all" || filters.size !== "all",
  );
  const changed =
    filters.q !== "" || filters.category !== "all" || filters.implementation !== "all" || filters.size !== "all";
  const matches = active
    ? filterHandbookEntries(
        entries.map(entry => ({
          entry,
          title: t(entry.titleKey),
          description: t(entry.descriptionKey),
          categoryTitle: t(entry.category.titleKey),
          topicTitle: t(entry.topic.titleKey),
        })),
        filters,
      )
    : [];
  const visible = matches.slice(0, 30);
  const groups = categories.flatMap(category => {
    const items = visible
      .filter(match => match.record.entry.category.id === category.id)
      .map(({ record, sourceMatch }) => ({
        id: record.entry.id,
        Icon: ArticleOutlinedIcon,
        label: record.title,
        description: [
          `${record.topicTitle} · ${t(`handbook.implementation.${record.entry.implementation}`)} · ${t(`handbook.size.${record.entry.size}`)}`,
          record.description,
          ...(sourceMatch ? [t("handbook.finder.sourceMatch", { path: sourceMatch })] : []),
        ].join(" — "),
        to: record.entry.to,
      }));
    return items.length ? [{ id: category.id, label: t(category.titleKey), items }] : [];
  });

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Box>
        <Typography component="h2" variant="h4" sx={{ fontWeight: 750 }}>
          {t("handbook.finder.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {t("handbook.finder.scope")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {t("handbook.finder.inventory", { articles: entries.length, topics: topicCount, projects: projectCount })}
        </Typography>
      </Box>
      <Box component="form" role="search" onSubmit={event => event.preventDefault()}>
        <Stack spacing={2}>
          <TextField
            autoComplete="off"
            fullWidth
            inputRef={searchInput}
            label={t("handbook.finder.query")}
            onChange={event => onFiltersChange({ q: event.target.value })}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            type="search"
            value={filters.q}
          />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <TextField
              fullWidth
              label={t("handbook.finder.category")}
              onChange={event => {
                const category = categories.find(candidate => candidate.id === event.target.value)?.id ?? "all";
                onFiltersChange({ category });
              }}
              select
              slotProps={{ select: { native: true } }}
              value={filters.category}
            >
              <option value="all">{t("handbook.finder.allCategories")}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {t(category.titleKey)}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label={t("handbook.finder.implementation")}
              onChange={event => {
                const implementation = implementationOptions.find(value => value === event.target.value);
                if (implementation) onFiltersChange({ implementation });
              }}
              select
              slotProps={{ select: { native: true } }}
              value={filters.implementation}
            >
              {implementationOptions.map(value => (
                <option key={value} value={value}>
                  {value === "all" ? t("handbook.finder.allImplementations") : t(`handbook.implementation.${value}`)}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label={t("handbook.finder.size")}
              onChange={event => {
                const size = sizeOptions.find(value => value === event.target.value);
                if (size) onFiltersChange({ size });
              }}
              select
              slotProps={{ select: { native: true } }}
              value={filters.size}
            >
              {sizeOptions.map(value => (
                <option key={value} value={value}>
                  {value === "all" ? t("handbook.finder.allSizes") : t(`handbook.size.${value}`)}
                </option>
              ))}
            </TextField>
          </Box>
          {changed ? (
            <Button
              onClick={() => {
                onFiltersChange({ q: "", category: "all", implementation: "all", size: "all" });
                searchInput.current?.focus();
              }}
              sx={{ alignSelf: "flex-start" }}
              type="button"
              variant="outlined"
            >
              {t("handbook.finder.clear")}
            </Button>
          ) : null}
        </Stack>
      </Box>
      <Box aria-atomic="true" aria-live="polite" role="status">
        <Typography color="text.secondary">
          {!active
            ? t("handbook.finder.initial")
            : matches.length
              ? t("handbook.finder.resultCount", { shown: visible.length, total: matches.length })
              : t("handbook.finder.noMatches")}
        </Typography>
        {matches.length > 30 ? <Typography sx={{ mt: 1 }}>{t("handbook.finder.refine")}</Typography> : null}
      </Box>
      {groups.length ? (
        <AppCategoryList
          title={t("handbook.finder.results")}
          description={t("handbook.finder.resultOrder")}
          navigationLabel={t("handbook.finder.resultsNavigation")}
          items={groups}
        />
      ) : null}
    </Stack>
  );
}
