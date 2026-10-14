/** Accepts only safe internal destinations and avoids redirecting to login itself. */
export function resolveAuthReturnPath(candidate: unknown) {
  if (
    typeof candidate !== "string" ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    [...candidate].some(character => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    })
  ) {
    return "/";
  }

  const pathname = candidate.split(/[?#]/, 1)[0];
  const normalizedPathname = pathname.replace(/\/+$/, "").toLowerCase();
  return normalizedPathname === "/login" ? "/" : candidate;
}
