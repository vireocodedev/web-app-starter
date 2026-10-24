import { describe, expect, it } from "vitest";

import { createGeneratedExampleRoutes } from "@/app/router/generatedExampleRoutes";

describe("generated example route discovery", () => {
  const loader = async () => ({ Component: () => null });
  it("derives lazy authenticated child routes and removes absent registrations", () => {
    const file = "../../pages/development-guide/generated/form/profile--profile.example.tsx";
    const routes = createGeneratedExampleRoutes({ [file]: loader });
    expect(routes["generated-example:form:profile:profile"]).toMatchObject({
      path: "dev-guide/frontend/generated/form/profile--profile",
      access: "authenticated",
      developmentOnly: true,
      parentId: "generatedExamples",
      lazy: loader,
    });
    expect(createGeneratedExampleRoutes({})["generated-example:form:profile:profile"]).toBeUndefined();
  });
  it("rejects malformed or duplicate route identities", () => {
    expect(() => createGeneratedExampleRoutes({ "bad.example.tsx": loader })).toThrow(/Invalid/);
    expect(() =>
      createGeneratedExampleRoutes({
        "a/generated/form/a--b.example.tsx": loader,
        "b/generated/form/a--b.example.tsx": loader,
      }),
    ).toThrow(/Duplicate/);
  });
});
