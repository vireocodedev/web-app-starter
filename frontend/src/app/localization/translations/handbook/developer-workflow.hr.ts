import type { StringLeaves } from "../../types/TranslationShape.ts";
import type { englishDeveloperWorkflowHandbookTranslations } from "./developer-workflow.en.ts";

export const croatianDeveloperWorkflowHandbookTranslations = {
  categories: {
    "developer-workflow": {
      title: "Razvojni postupci",
      description: "Lokalni runtimeovi, debugiranje, provjere i svakodnevna implementacija.",
    },
  },
  topics: {
    "developer-workflow-local-development": {
      title: "Lokalni razvoj",
      description: "Pokrenite namijenjene runtimeove i sačuvajte postojeće lokalno stanje.",
    },
  },
  articles: {
    "developer-workflow-local-development-workspace-runtimes": {
      title: "Jedan workspace, dva runtimea",
      description:
        "Pokrenite Javu i Node deklariranim runtimeovima i uređenim VS Code helperima uz čuvanje identiteta baze, pristupnih podataka, volumea i same-origin sesije.",
    },
  },
} satisfies StringLeaves<typeof englishDeveloperWorkflowHandbookTranslations>;
