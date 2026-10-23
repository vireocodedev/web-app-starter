import type { StringLeaves } from "../../types/TranslationShape.ts";
import type { englishCiHandbookTranslations } from "./ci.en.ts";

export const croatianCiHandbookTranslations = {
  categories: {
    ci: {
      title: "Kontinuirana integracija",
      description: "Provjere prema vlasniku, potpuni dokazi i izolirani izvršitelji.",
    },
  },
  topics: {
    "ci-pipelines": {
      title: "Pipelineovi i završne provjere",
      description: "Odaberite relevantne provjere uz očuvanje obveznog rezultata.",
    },
    "ci-verification": {
      title: "Dokazi provjera",
      description: "Dokažite potpuno izvršavanje za ispravan izvor i pokretanje.",
    },
    "ci-isolation": {
      title: "Izolacija izvršitelja",
      description: "Odvojite nepouzdano izvršavanje poslova od privilegiranog hosta.",
    },
  },
  articles: {
    "ci-pipelines-owner-scoped-checks": {
      title: "Odabir provjera prema vlasniku uz obvezno izvješće završnog statusa",
      description: "Odaberi CI provjere prema vlasniku uz obvezne prenosive provjere i pouzdan završni status.",
    },
    "ci-verification-complete-shard-evidence": {
      title: "Dokaži potpuno izvršavanje testova kroz shardove",
      description:
        "Dokaži potpun obuhvat frontend datoteka i backend klasa kroz SHA/run/attempt izvješća; neovisno usporedi backend slučajeve i validiraj prijavljene frontend assertione/zbrojeve.",
    },
    "ci-isolation-disposable-worker-boundary": {
      title: "Jednokratni CI izvršitelj je provjerena granica povjerenja",
      description: "Odvoji izvršavanje PR koda od host ovlasti kroz svježe workere, limite i dokaz izolacije.",
    },
    "ci-pipelines-required-gates-and-main-protection": {
      title: "Veži obvezni status uz politiku koja ga je proizvela",
      description: "Veži CI gate uz pouzdani source App i zasebno potvrdi efektivnu zaštitu aktualne glavne grane.",
    },
    "ci-pipelines-pinned-toolchains-and-actions": {
      title: "Odaberi deklarirani aplikacijski toolchain unutar posla",
      description:
        "Razlikuj aplikacijski target, točan package manager, dependency lock, Action commit i baseline jednokratnog workera.",
    },
    "ci-verification-resource-budgets": {
      title: "Ograniči konkurentnost na svakoj razini izvršavanja",
      description: "Uskladi slotove, limite posla, unutarnje workere, disk i rokove uz očuvan obuhvat provjera.",
    },
    "ci-verification-phase-deadlines-and-process-cleanup": {
      title: "Sačuvaj početni rok faze i vlasništvo nad čišćenjem procesa",
      description:
        "Referentni recept za rokove sa setupom, zadržano PGID vlasništvo, cleanup i aggregate koji čuva neuspjehe.",
    },
  },
} satisfies StringLeaves<typeof englishCiHandbookTranslations>;
