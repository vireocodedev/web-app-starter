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
    "agent-workflow-implementation-bounded-task-and-decision-contract": {
      title: "Preuzmi jedan ograničen ishod i sačuvaj decision gateove",
      description:
        "Definiraj prihvat, vlasništvo i source decision gate za task bez pretvaranja prijedloga u coding odobrenje.",
    },
    "agent-workflow-implementation-capability-owners-and-review-boundaries": {
      title: "Promjenu smjesti iza capabilityja koji posjeduje ugovor",
      description:
        "Biraj public seam i review prema ponašanju, lifetimeu i dependency smjeru uz jasnog integration ownera.",
    },
    "agent-workflow-implementation-incremental-reviewable-delivery": {
      title: "Isporuči cjelovit inkrement s istinitim review zapisom",
      description:
        "Sačuvaj task source i dokaze kroz checkpoint uz odvojene ishode commita, pusha, PR-a, mergea i deploymenta.",
    },
    "agent-workflow-implementation-source-bound-evidence-and-handoff": {
      title: "Svaku tvrdnju o dovršetku veži uz izvor i sloj dokaza",
      description:
        "Odvoji source hash, run/attempt, artefakt, live prihvat i implementacijsko stanje u jasnom handoffu.",
    },
    "agent-workflow-implementation-initialization-to-business-acceptance": {
      title: "Odvoji setup spremnost od prihvaćenog poslovnog V1",
      description:
        "Prati neovisnu pripremu, locked scope, spec, implementaciju i exact-pair prihvat bez preskakanja faza.",
    },
  },
} satisfies StringLeaves<typeof englishAgentWorkflowHandbookTranslations>;
