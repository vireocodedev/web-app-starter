import type { AppLocale } from "@/app/localization/localeConfig";

import { handbookArticles } from "./handbookManifest";

const markdownRoot = "../../../../../docs/development-guide";
const markdown = import.meta.env.DEV
  ? import.meta.glob<string>("../../../../../docs/development-guide/{en,hr}/**/*.md", {
      eager: true,
      import: "default",
      query: "?raw",
    })
  : {};

/** Content is paired by its full relative path, so repeated article names are safe. */
export function handbookMarkdown(contentPath: string, locale: AppLocale): string {
  const key = `${markdownRoot}/${locale}/${contentPath}.md`;
  const content = markdown[key];
  if (content === undefined) throw new Error(`Development guide content is missing: ${locale}/${contentPath}.md`);
  return content;
}

if (import.meta.env.DEV) {
  for (const article of handbookArticles) {
    handbookMarkdown(article.contentPath, "en");
    handbookMarkdown(article.contentPath, "hr");
  }
}
