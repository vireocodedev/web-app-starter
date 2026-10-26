import type { Nodes } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type MarkdownHeading = Readonly<{
  depth: 2 | 3;
  id: string;
  title: string;
  /** One-based Markdown source line, shared with ReactMarkdown's node positions. */
  sourceLine: number;
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

function headingText(node: Nodes): string {
  if (node.type === "html") return "";
  if (node.type === "image" || node.type === "imageReference") return node.alt ?? "";
  if ("value" in node) return node.value;
  return "children" in node ? node.children.map(headingText).join("") : "";
}

/** Collect rendered section nodes, retaining their exact original Markdown source positions. */
export function markdownHeadings(markdown: string): readonly MarkdownHeading[] {
  // Construct only when guide content is rendered, so unused guide exports remain removable.
  const markdownParser = unified().use(remarkParse).use(remarkGfm).freeze();
  const headings: MarkdownHeading[] = [];
  const assignedIds = new Set<string>();
  const visit = (node: Nodes): void => {
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3) && node.position) {
      const title = headingText(node).trim();
      const baseId = markdownHeadingId(title) || "section";
      let id = baseId;
      let occurrence = 0;
      while (assignedIds.has(id)) id = `${baseId}-${++occurrence}`;
      assignedIds.add(id);
      headings.push({ depth: node.depth, id, title, sourceLine: node.position.start.line });
    }
    if ("children" in node) node.children.forEach(visit);
  };
  visit(markdownParser.parse(markdown));
  return headings;
}
