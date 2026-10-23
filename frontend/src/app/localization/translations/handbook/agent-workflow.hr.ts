import type { StringLeaves } from "../../types/TranslationShape.ts";
import type { englishAgentWorkflowHandbookTranslations } from "./agent-workflow.en.ts";

export const croatianAgentWorkflowHandbookTranslations = {
  categories: {
    "agent-workflow": {
      title: "Rad AI agenata",
      description: "Pronađite vlasnika, provedite ograničen zadatak i predajte dokaze.",
    },
  },
  topics: {
    "agent-workflow-implementation": {
      title: "Postupak implementacije",
      description: "Odaberite vlasnika i javno sučelje prije promjene ponašanja.",
    },
  },
  articles: {
    "agent-workflow-implementation-owner-first-change": {
      title: "Prije uređivanja pronađite vlasnika",
      description:
        "Pretvorite traženi ishod u ograničenu promjenu s jasnim vlasnikom, vrstom dokaza, javnim granicama, dopuštenom verifikacijom i zasebno autoriziranom isporukom.",
    },
  },
} satisfies StringLeaves<typeof englishAgentWorkflowHandbookTranslations>;
