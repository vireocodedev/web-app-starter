export type MarkdownHeading = Readonly<{
  depth: 2 | 3;
  id: string;
  title: string;
}>;

export function markdownHeadingId(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function markdownHeadings(markdown: string): readonly MarkdownHeading[] {
  return [...markdown.matchAll(/^(##|###)\s+(.+?)\s*#*$/gm)].map(([, marker = "##", rawTitle = ""]) => {
    const title = rawTitle
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[`*_~]/g, "")
      .trim();

    return {
      depth: marker.length as 2 | 3,
      id: markdownHeadingId(title),
      title,
    };
  });
}
