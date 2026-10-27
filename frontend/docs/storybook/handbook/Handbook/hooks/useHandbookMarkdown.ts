import { useCallback, useEffect, useState } from "react";

import type { AppLocale } from "@/app/localization/localeConfig";

import { loadHandbookMarkdown } from "../catalog/handbookMarkdown";

type MarkdownContent =
  Readonly<{ status: "loading" }> | Readonly<{ status: "ready"; markdown: string }> | Readonly<{ status: "error" }>;

type MarkdownRequest = Readonly<{ contentPath: string; locale: AppLocale; attempt: number }>;
type MarkdownState = Readonly<{ request: MarkdownRequest; content: MarkdownContent }>;

/** Selection and attempt share one owned identity; earlier effects cannot publish into a newer request. */
export function useHandbookMarkdown(
  contentPath: string,
  locale: AppLocale,
): MarkdownContent & Readonly<{ retry: () => void }> {
  const [state, setState] = useState<MarkdownState>(() => ({
    request: { contentPath, locale, attempt: 0 },
    content: { status: "loading" },
  }));
  const selected = state.request.contentPath === contentPath && state.request.locale === locale;
  if (!selected) {
    setState({
      request: { contentPath, locale, attempt: state.request.attempt + 1 },
      content: { status: "loading" },
    });
  }
  const request = state.request;
  useEffect(() => {
    let active = true;
    void loadHandbookMarkdown(request.contentPath, request.locale).then(
      markdown => {
        if (!active) return;
        setState(current =>
          current.request === request ? { request, content: { status: "ready", markdown } } : current,
        );
      },
      () => {
        if (!active) return;
        setState(current => (current.request === request ? { request, content: { status: "error" } } : current));
      },
    );
    return () => {
      active = false;
    };
  }, [request]);

  const retry = useCallback(() => {
    setState(current => ({
      request: { ...current.request, attempt: current.request.attempt + 1 },
      content: { status: "loading" },
    }));
  }, []);
  return { ...(selected ? state.content : { status: "loading" as const }), retry };
}
