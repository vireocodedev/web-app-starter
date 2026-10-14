import { matchPath } from "react-router";

export function navigationPathMatchesLocation(pathname: string, to: string, activePath?: string): boolean {
  if (activePath) {
    return matchPath({ end: true, path: activePath }, pathname) !== null;
  }

  const destinationPath = to.split(/[?#]/, 1)[0] || "/";
  return (
    matchPath(
      {
        end: destinationPath === "/",
        path: destinationPath === "/" ? "/" : `${destinationPath.replace(/\/+$/, "")}/*`,
      },
      pathname,
    ) !== null
  );
}
