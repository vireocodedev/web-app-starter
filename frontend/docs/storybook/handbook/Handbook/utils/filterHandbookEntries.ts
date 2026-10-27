import type { HandbookFinderEntry, HandbookFinderFilters } from "../types/HandbookFinder";

export type TranslatedHandbookFinderEntry = Readonly<{
  entry: HandbookFinderEntry;
  title: string;
  description: string;
  categoryTitle: string;
  topicTitle: string;
}>;

export function normalizeHandbookSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

/** Match every token against localized metadata, retaining manifest order for equally ranked rows. */
export function filterHandbookEntries(
  records: readonly TranslatedHandbookFinderEntry[],
  filters: HandbookFinderFilters,
) {
  const query = normalizeHandbookSearch(filters.q).trim().replace(/\s+/g, " ");
  const tokens = query ? query.split(" ") : [];
  return records
    .flatMap((record, index) => {
      const { entry } = record;
      if (
        (filters.category !== "all" && filters.category !== entry.category.id) ||
        (filters.implementation !== "all" && filters.implementation !== entry.implementation) ||
        (filters.size !== "all" && filters.size !== entry.size)
      ) {
        return [];
      }
      const title = normalizeHandbookSearch(record.title);
      const fields = [
        title,
        record.description,
        record.categoryTitle,
        record.topicTitle,
        ...entry.sources.flatMap(source => [source.project, source.path, source.revision]),
      ].map(normalizeHandbookSearch);
      if (!tokens.every(token => fields.some(field => field.includes(token)))) return [];
      const rank = !query
        ? 3
        : title === query
          ? 0
          : title.startsWith(query)
            ? 1
            : tokens.every(token => title.includes(token))
              ? 2
              : 3;
      const sourceMatch = tokens.length
        ? entry.sources.find(source => tokens.some(token => normalizeHandbookSearch(source.path).includes(token)))?.path
        : undefined;
      return [{ record, sourceMatch, rank, index }];
    })
    .sort((left, right) => left.rank - right.rank || left.index - right.index);
}
