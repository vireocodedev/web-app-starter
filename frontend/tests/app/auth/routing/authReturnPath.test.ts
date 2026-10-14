import { describe, expect, it } from "vitest";

import { resolveAuthReturnPath } from "@/app/auth/routing/authReturnPath";

describe("authentication return path", () => {
  it("preserves a safe internal destination", () => {
    expect(resolveAuthReturnPath("/projects?sort=name#current")).toBe("/projects?sort=name#current");
  });

  it.each([
    undefined,
    "https://example.invalid",
    "//example.invalid/path",
    "/\\example.invalid/path",
    "/login",
    "/LOGIN/",
    "/login?from=/projects",
    "/projects\nother",
  ])("falls back to root for unsafe destination %s", candidate => {
    expect(resolveAuthReturnPath(candidate)).toBe("/");
  });
});
