import {
  HandbookArticle,
  type HandbookArticleId,
  type HandbookRelatedLink,
} from "@/features/development-guide/handbook";

export function HandbookArticlePage(
  props: Readonly<{
    articleId: HandbookArticleId;
    resolveHref: (href: string | undefined) => string | undefined;
    relatedLinks: readonly HandbookRelatedLink[];
  }>,
) {
  return <HandbookArticle {...props} />;
}
