import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";
import { z } from "zod";

import {
  handbookArticles,
  handbookCategories,
  handbookTopics,
  type HandbookArticleId,
  type HandbookFinderEntry,
  type HandbookFinderFilters,
  type HandbookCategoryId,
  type HandbookTopicId,
} from "@/features/development-guide/handbook";
import { HandbookFinderPage } from "@/pages/development-guide/handbook/HandbookFinderPage";
import { HandbookArticlePage } from "@/pages/development-guide/handbook/HandbookArticlePage";
import { HandbookIndexPage } from "@/pages/development-guide/handbook/HandbookIndexPage";
import { HandbookTopicLayout } from "@/pages/development-guide/handbook/HandbookTopicLayout";

import { useAppQueryParams } from "./hooks/useAppQueryParams";
import { updateQueryParams } from "./queryParams";
import type { AppRouteDefinition } from "./types/AppRoute";

type CategoryRouteId = "developmentGuideBackend" | `handbook-category:${Exclude<HandbookCategoryId, "backend">}`;
export type HandbookRouteId =
  | "handbook-finder"
  | CategoryRouteId
  | `handbook-category-index:${HandbookCategoryId}`
  | `handbook-topic:${HandbookTopicId}`
  | `handbook-topic-index:${HandbookTopicId}`
  | `handbook-article:${HandbookArticleId}`;

const categoryIcons: Readonly<Record<HandbookCategoryId, SvgIconComponent>> = {
  "frontend-workflows": AccountTreeOutlinedIcon,
  backend: StorageOutlinedIcon,
  quality: FactCheckOutlinedIcon,
  ci: HubOutlinedIcon,
  delivery: CloudUploadOutlinedIcon,
  "developer-workflow": BuildOutlinedIcon,
  "agent-workflow": SmartToyOutlinedIcon,
};

type HandbookNestedMount = Readonly<{
  parentId: "developmentGuideFrontend";
  path: string;
}>;

// Browser placement belongs to the router; source articles retain portable paths.
const nestedMounts: Partial<Record<HandbookCategoryId, HandbookNestedMount>> = {
  "frontend-workflows": {
    parentId: "developmentGuideFrontend",
    path: "dev-guide/frontend/workflow-patterns",
  },
};

function categoryRouteId(id: HandbookCategoryId): CategoryRouteId {
  return id === "backend" ? "developmentGuideBackend" : `handbook-category:${id}`;
}

function categoryPath(id: HandbookCategoryId): string {
  const category = handbookCategories.find(candidate => candidate.id === id);
  if (!category) throw new Error(`Unknown handbook category: ${id}`);
  return nestedMounts[id]?.path ?? `dev-guide/${category.slug}`;
}

function topicPath(id: string): string {
  const topic = handbookTopics.find(candidate => candidate.id === id);
  if (!topic) throw new Error(`Unknown handbook topic: ${id}`);
  return `${categoryPath(topic.categoryId)}/${topic.slug}`;
}

function articlePath(id: string): string {
  const article = handbookArticles.find(candidate => candidate.id === id);
  if (!article) throw new Error(`Unknown handbook article: ${id}`);
  return `${topicPath(article.topicId)}/${article.slug}`;
}

const finderPath = "dev-guide/find";

/** Utility links and inventory counts belong to development route composition. */
export const handbookFinderEntry = import.meta.env.DEV
  ? { to: `/${finderPath}`, articleCount: handbookArticles.length }
  : undefined;

/** The route owner supplies all category destinations to the presentation-only index. */
export const handbookCategoryEntries = import.meta.env.DEV
  ? handbookCategories
      .filter(category => !nestedMounts[category.id])
      .map(category => ({
        id: category.id,
        Icon: categoryIcons[category.id],
        titleKey: category.titleKey,
        descriptionKey: category.descriptionKey,
        to: `/${categoryPath(category.id)}`,
      }))
  : [];

const markdownRoutes = new Map<string, string>();
if (import.meta.env.DEV) {
  for (const locale of ["en", "hr"]) {
    for (const article of handbookArticles) {
      markdownRoutes.set(
        `/frontend/docs/development-guide/${locale}/${article.contentPath}.md`,
        `/${articlePath(article.id)}`,
      );
    }
  }
  markdownRoutes.set("/frontend/docs/development-guide/README.md", "/dev-guide");
}

/** Full source paths keep identically named Markdown pages in separate topics distinct. */
function articleHref(contentPath: string, href: string | undefined): string | undefined {
  if (!href || href.startsWith("#") || href.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  const target = new URL(
    href,
    `https://development-guide.invalid/frontend/docs/development-guide/en/${contentPath}.md`,
  );
  const destination = markdownRoutes.get(decodeURIComponent(target.pathname));
  if (destination) return `${destination}${target.search}${target.hash}`;
  const architecture = /^\/frontend\/docs\/architecture\/(?:en|hr)\/([a-z0-9-]+)\.md$/.exec(target.pathname);
  if (architecture) return `/dev-guide/frontend/architecture/${architecture[1]}${target.search}${target.hash}`;
  if (target.pathname.endsWith(".md"))
    throw new Error(`Unregistered development guide link: ${contentPath} -> ${href}`);
  return href;
}

function relatedArticleLinks(
  article: Readonly<{ id: string; topicId: string; relatedArticleIds?: readonly string[] }>,
) {
  const related = article.relatedArticleIds?.length
    ? article.relatedArticleIds.map(id => {
        const match = handbookArticles.find(candidate => candidate.id === id);
        if (!match) throw new Error(`Unknown related handbook article: ${article.id} -> ${id}`);
        return match;
      })
    : handbookArticles.filter(candidate => candidate.topicId === article.topicId && candidate.id !== article.id);
  return related.map(candidate => ({ labelKey: candidate.titleKey, to: `/${articlePath(candidate.id)}` }));
}

function createHandbookRoutes(): Record<HandbookRouteId, AppRouteDefinition> {
  const entries: [HandbookRouteId, AppRouteDefinition][] = [];
  // Build query policy only within the DEV-only factory, outside the native pure catalog graph.
  const finderSchema = z.object({
    q: z.string().max(200).default(""),
    category: z.enum(["all", ...handbookCategories.map(category => category.id)]).default("all"),
    implementation: z.enum(["all", "starter", "reference", "mixed"]).default("all"),
    size: z.enum(["all", "small", "medium", "large"]).default("all"),
  });
  const finderEntries: readonly HandbookFinderEntry[] = handbookArticles.map(article => {
    const topic = handbookTopics.find(candidate => candidate.id === article.topicId);
    const category = handbookCategories.find(candidate => candidate.id === topic?.categoryId);
    if (!topic || !category) throw new Error(`Finder article ${article.id} has no topic/category`);
    return {
      id: article.id,
      to: `/${articlePath(article.id)}`,
      titleKey: article.titleKey,
      descriptionKey: article.descriptionKey,
      category: {
        id: category.id,
        titleKey: category.id === "frontend-workflows" ? "navigation.frontend" : category.titleKey,
      },
      topic: { id: topic.id, titleKey: topic.titleKey },
      implementation: article.implementation,
      size: article.size,
      sources: article.sources,
    };
  });
  function HandbookFinderRoute() {
    const location = useLocation();
    const navigationType = useNavigationType();
    const { values, setValues } = useAppQueryParams(finderSchema);
    const pending = useRef({
      locationKey: location.key,
      search: location.search,
      filters: values,
      expectedSearches: [] as string[],
    });
    useLayoutEffect(() => {
      const current = pending.current;
      if (current.locationKey === location.key && current.search === location.search) return;
      const acknowledged = navigationType === "REPLACE" ? current.expectedSearches.lastIndexOf(location.search) : -1;
      // An earlier local replace may commit while a later full snapshot is still pending.
      // Back/Forward and unrelated URL changes always replace the pending state with URL authority.
      current.expectedSearches = acknowledged < 0 ? [] : current.expectedSearches.slice(acknowledged + 1);
      if (!current.expectedSearches.length) current.filters = values;
      current.locationKey = location.key;
      current.search = location.search;
    }, [location.key, location.search, navigationType, values]);
    const updateFilters = (update: Partial<HandbookFinderFilters>) => {
      const next = { ...pending.current.filters, ...update };
      const search = updateQueryParams(finderSchema, location.search, next).toString();
      pending.current.filters = next;
      pending.current.expectedSearches.push(search ? `?${search}` : "");
      // Pass a full owned-field snapshot so rapid controls cannot overwrite each other's patches.
      setValues(next, { replace: true, preventScrollReset: true });
    };
    return <HandbookFinderPage entries={finderEntries} filters={values} onFiltersChange={updateFilters} />;
  }
  for (const category of handbookCategories) {
    const categoryId = categoryRouteId(category.id);
    const mount = nestedMounts[category.id];
    entries.push([
      categoryId,
      {
        Component: Outlet,
        access: "authenticated",
        commandPalette: true,
        developmentOnly: true,
        ...(mount
          ? { navigation: { Icon: categoryIcons[category.id], labelKey: category.titleKey } }
          : { headerBreadcrumb: true }),
        parentId: mount?.parentId ?? "developmentGuide",
        path: categoryPath(category.id),
        title: t => t(category.titleKey),
        translationNamespace: "development-guide",
      },
    ]);
    entries.push([
      `handbook-category-index:${category.id}`,
      {
        Component: () => (
          <HandbookIndexPage
            titleKey={category.titleKey}
            descriptionKey={category.descriptionKey}
            items={handbookTopics
              .filter(topic => topic.categoryId === category.id)
              .map(topic => ({
                id: topic.id,
                Icon: FolderOutlinedIcon,
                titleKey: topic.titleKey,
                descriptionKey: topic.descriptionKey,
                to: `/${topicPath(topic.id)}`,
              }))}
          />
        ),
        access: "authenticated",
        index: true,
        parentId: categoryId,
        title: t => t(category.titleKey),
        translationNamespace: "development-guide",
      },
    ]);
  }
  for (const topic of handbookTopics) {
    const category = handbookCategories.find(candidate => candidate.id === topic.categoryId);
    if (!category) throw new Error(`Handbook topic ${topic.id} has no category`);
    const articles = handbookArticles.filter(article => article.topicId === topic.id);
    const links = articles.map(article => ({ labelKey: article.titleKey, to: `/${articlePath(article.id)}` }));
    entries.push([
      `handbook-topic:${topic.id}`,
      {
        Component: () => <HandbookTopicLayout topicId={topic.id} titleKey={topic.titleKey} links={links} />,
        access: "authenticated",
        commandPalette: true,
        parentId: categoryRouteId(category.id),
        path: topicPath(topic.id),
        title: t => t(topic.titleKey),
        translationNamespace: "development-guide",
      },
    ]);
    entries.push([
      `handbook-topic-index:${topic.id}`,
      {
        Component: () => (
          <HandbookIndexPage
            titleKey={topic.titleKey}
            descriptionKey={topic.descriptionKey}
            items={articles.map(article => ({
              id: article.id,
              Icon: ArticleOutlinedIcon,
              titleKey: article.titleKey,
              descriptionKey: article.descriptionKey,
              to: `/${articlePath(article.id)}`,
            }))}
          />
        ),
        access: "authenticated",
        index: true,
        parentId: `handbook-topic:${topic.id}`,
        title: t => t(topic.titleKey),
        translationNamespace: "development-guide",
      },
    ]);
    for (const article of articles) {
      entries.push([
        `handbook-article:${article.id}`,
        {
          Component: () => (
            <HandbookArticlePage
              articleId={article.id}
              resolveHref={href => articleHref(article.contentPath, href)}
              relatedLinks={relatedArticleLinks(article)}
            />
          ),
          access: "authenticated",
          commandPalette: true,
          parentId: `handbook-topic:${topic.id}`,
          path: articlePath(article.id),
          scrollToTop: true,
          title: t => t(article.titleKey),
          translationNamespace: "development-guide",
        },
      ]);
    }
  }
  for (const article of finderEntries) {
    const registered = entries.find(([id]) => id === `handbook-article:${article.id}`)?.[1];
    if (!registered || !("path" in registered) || `/${registered.path}` !== article.to) {
      throw new Error(`Finder destination is not registered: ${article.id}`);
    }
  }
  entries.push([
    "handbook-finder",
    {
      Component: HandbookFinderRoute,
      access: "authenticated",
      commandPalette: true,
      developmentOnly: true,
      parentId: "developmentGuide",
      path: finderPath,
      scrollToTop: true,
      title: t => t("handbook.finder.title"),
      translationNamespace: "development-guide",
    },
  ]);
  const expected = handbookCategories.length * 2 + handbookTopics.length * 2 + handbookArticles.length + 1;
  if (entries.length !== expected || new Set(entries.map(([id]) => id)).size !== expected) {
    throw new Error("Development guide route IDs are incomplete or duplicated");
  }
  return Object.fromEntries(entries) as Record<HandbookRouteId, AppRouteDefinition>;
}

// Like the main registry, the type names development routes while availability is
// decided by the build mode. The development factory checks every generated ID.
export const handbookRouteRegistry = (import.meta.env.DEV ? createHandbookRoutes() : {}) as ReturnType<
  typeof createHandbookRoutes
>;
