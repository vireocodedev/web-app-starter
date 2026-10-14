import { SearchLookupPreview } from "./SearchLookupPreview";

/** A fresh fixture fails its first completed request; retry then succeeds. */
export function ErrorRetryLookupPreview() {
  return <SearchLookupPreview failFirst />;
}
