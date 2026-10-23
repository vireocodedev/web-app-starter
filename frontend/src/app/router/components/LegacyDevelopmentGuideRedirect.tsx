import { Navigate, useLocation } from "react-router";

/** Keeps the explicitly registered previous guide URLs usable. */
export function LegacyDevelopmentGuideRedirect() {
  const location = useLocation();
  const example = /^\/dev-guide\/(?:frontend\/)?(home|contacts)\/?$/i.exec(location.pathname);
  const pathname = example
    ? `/dev-guide/frontend/example-pages/${example[1]?.toLowerCase() === "home" ? "contacts-dashboard" : "contacts-crud"}`
    : location.pathname.replace(/^\/dev-guide\//i, "/dev-guide/frontend/");
  return (
    <Navigate
      replace
      state={location.state}
      to={{
        pathname,
        search: location.search,
        hash: location.hash,
      }}
    />
  );
}
