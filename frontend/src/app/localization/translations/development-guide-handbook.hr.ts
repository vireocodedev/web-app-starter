import type { StringLeaves } from "../types/TranslationShape.ts";
import type { englishHandbookTranslations } from "./development-guide-handbook.en.ts";

import { croatianBackendHandbookTranslations } from "./handbook/backend.hr.ts";
import { croatianQualityHandbookTranslations } from "./handbook/quality.hr.ts";
import { croatianCiHandbookTranslations } from "./handbook/ci.hr.ts";
import { croatianDeliveryHandbookTranslations } from "./handbook/delivery.hr.ts";
import { croatianDeveloperWorkflowHandbookTranslations } from "./handbook/developer-workflow.hr.ts";
import { croatianAgentWorkflowHandbookTranslations } from "./handbook/agent-workflow.hr.ts";
import { croatianFrontendHandbookTranslations } from "./handbook/frontend.hr.ts";

// Imported branches are plain literal data without getters; aggregation only allocates an object.
export const croatianHandbookTranslations = /* @__PURE__ */ (() =>
  ({
    navigation: {
      index: "Teme: {{category}}",
      choosePage: "Odaberite članak, trenutačni članak: {{page}}",
      closePages: "Zatvori članke",
      pageNavigation: "Navigacija članaka",
      contents: "Sadržaj članka",
      related: "Povezano čitanje",
    },
    loading: {
      message: "Učitavanje ovog članka…",
      progress: "Učitavanje članka",
      errorTitle: "Članak nije moguće učitati",
      errorMessage:
        "Zahtjev za odabrani jezik ili članak nije uspio. Možete pokušati ponovno uz zadržavanje trenutačne lokacije u vodiču.",
      refreshHint:
        "Ponovni pokušaj može i dalje koristiti neuspjeli zahtjev preglednika za modulom. Ako i dalje ne uspijeva, osvježite stranicu kada veza ili razvojni poslužitelj postanu dostupni.",
      retry: "Pokušaj ponovno",
      refresh: "Osvježi stranicu",
    },
    finder: {
      action: "Pronađi članke",
      actionCount: "Članci priručnika: {{count}}",
      title: "Pronađite članke priručnika",
      scope:
        "Pretražite naslove, sažetke, kategorije, teme i izvorne reference članaka priručnika. Interaktivni primjeri i članci arhitekture dostupni su kroz kategorije i pretragu stranica.",
      inventory: "Članci: {{articles}} · Teme: {{topics}} · Izvorni projekti: {{projects}}",
      query: "Pretražite naslove, sažetke ili putanje izvora",
      category: "Kategorija",
      implementation: "Vrsta obrasca",
      size: "Veličina obrasca",
      allCategories: "Sve kategorije",
      allImplementations: "Sve vrste obrazaca",
      allSizes: "Sve veličine obrazaca",
      clear: "Očisti pretragu i filtre",
      initial: "Unesite pojam ili odaberite kategoriju, vrstu ili veličinu obrasca za pronalazak članaka priručnika.",
      noMatches: "Nema odgovarajućih članaka priručnika. Pokušajte s manje riječi ili očistite filtre.",
      resultCount: "Odgovarajući članci: {{total}} · Prikazano: {{shown}}",
      refine: "Prikazano je prvih 30 rezultata. Precizirajte pretragu ili filtre kako biste suzili popis.",
      results: "Odgovarajući članci",
      resultsNavigation: "Odgovarajući članci priručnika",
      resultOrder: "Rezultati su grupirani po kategorijama, a unutar svake grupe poredani po relevantnosti.",
      sourceMatch: "Odgovarajući izvor: {{path}}",
    },
    implementation: {
      starter: "Ugrađeni obrazac",
      reference: "Referentni recept",
      mixed: "Ugrađeno + referentni recept",
    },
    size: {
      small: "Mali obrazac",
      medium: "Srednji obrazac",
      large: "Veliki obrazac",
    },
    categories: {
      ...croatianBackendHandbookTranslations.categories,
      ...croatianQualityHandbookTranslations.categories,
      ...croatianCiHandbookTranslations.categories,
      ...croatianDeliveryHandbookTranslations.categories,
      ...croatianDeveloperWorkflowHandbookTranslations.categories,
      ...croatianAgentWorkflowHandbookTranslations.categories,
      ...croatianFrontendHandbookTranslations.categories,
    },
    topics: {
      ...croatianBackendHandbookTranslations.topics,
      ...croatianQualityHandbookTranslations.topics,
      ...croatianCiHandbookTranslations.topics,
      ...croatianDeliveryHandbookTranslations.topics,
      ...croatianDeveloperWorkflowHandbookTranslations.topics,
      ...croatianAgentWorkflowHandbookTranslations.topics,
      ...croatianFrontendHandbookTranslations.topics,
    },
    articles: {
      ...croatianBackendHandbookTranslations.articles,
      ...croatianQualityHandbookTranslations.articles,
      ...croatianCiHandbookTranslations.articles,
      ...croatianDeliveryHandbookTranslations.articles,
      ...croatianDeveloperWorkflowHandbookTranslations.articles,
      ...croatianAgentWorkflowHandbookTranslations.articles,
      ...croatianFrontendHandbookTranslations.articles,
    },
  }) satisfies StringLeaves<typeof englishHandbookTranslations>)();
