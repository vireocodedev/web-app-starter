import {
  ArchitectureArticle,
  type ArchitectureArticleId,
  type ArchitectureRelatedLink,
} from "@/features/development-guide/architecture";

export function ArchitectureArticlePage({
  articleId,
  relatedPatternLinks,
}: Readonly<{
  articleId: ArchitectureArticleId;
  relatedPatternLinks: readonly ArchitectureRelatedLink[];
}>) {
  return <ArchitectureArticle articleId={articleId} relatedPatternLinks={relatedPatternLinks} />;
}
