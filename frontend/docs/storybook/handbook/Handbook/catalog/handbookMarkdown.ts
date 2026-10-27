import type { AppLocale } from "@/app/localization/localeConfig";

import { handbookArticles } from "./handbookManifest";

const markdownRoot = "../../../../development-guide";
const markdown = import.meta.glob<string>("../../../../development-guide/{en,hr}/**/*.md", {
  import: "default",
  query: "?raw",
});

function markdownKey(contentPath: string, locale: AppLocale): string {
  return `${markdownRoot}/${locale}/${contentPath}.md`;
}

/** Only the selected article/language is requested; successful module reuse belongs to native ESM. */
export async function loadHandbookMarkdown(contentPath: string, locale: AppLocale): Promise<string> {
  const loader = markdown[markdownKey(contentPath, locale)];
  if (!loader) throw new Error(`Development guide content is missing: ${locale}/${contentPath}.md`);
  return loader();
}

{
  // Validate structure at startup without invoking any body loader.
  for (const article of handbookArticles) {
    for (const locale of ["en", "hr"] as const) {
      if (!(markdownKey(article.contentPath, locale) in markdown)) {
        throw new Error(`Development guide content is missing: ${locale}/${article.contentPath}.md`);
      }
    }
  }
}

if (import.meta.env.DEV && import.meta.hot) {
  // Raw-body updates bubble here. A self-accepting boundary reloads cached native modules
  // instead of letting Fast Refresh preserve the article hook's previous Markdown state.
  import.meta.hot.accept(() => window.location.reload());
}
