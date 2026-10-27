import type { StringLeaves } from "@/app/localization/types/TranslationShape";
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
    "developer-verification": {
      title: "Tok provjere",
      description:
        "Odaberite dopuštene provjere, serijalizirajte zahtjevan rad i zabilježite dokaze vezane uz izvor i izostavljene provjere.",
    },
    "developer-template-evolution": {
      title: "Razvoj predložaka i paketa",
      description:
        "Prepoznajte instalirane profile, sačuvajte vlasništvo i usvojite pregledane promjene bez prepisivanja aplikacijskog rada.",
    },
  },
  articles: {
    "developer-workflow-local-development-workspace-runtimes": {
      title: "Jedan workspace, dva runtimea",
      description:
        "Pokrenite Javu i Node deklariranim runtimeovima i uređenim VS Code helperima uz čuvanje identiteta baze, pristupnih podataka, volumea i same-origin sesije.",
    },
    "developer-workflow-local-development-vscode-launch-contract": {
      title: "VS Code launch dijagnosticiraj redom njegovih ovisnosti",
      description:
        "Prati pre-launch lanac, desktop toolchain i odvojene debugger/database lifetimeove prije izmjene konfiguracije.",
    },
    "developer-workflow-local-development-parallel-checkouts-and-database-identity": {
      title: "Paralelnim checkoutima dodijeli eksplicitan identitet baze",
      description: "Odvoji port, Compose namespace, trajne tajne i browser identitet bez brisanja tuđih podataka.",
    },
    "developer-workflow-local-development-same-origin-session-debugging": {
      title: "Session dijagnosticiraj kroz jedan browser origin",
      description: "Lociraj proxy, cookie, account i CSRF problem kroz stvarni HTTP slijed bez slabljenja sigurnosti.",
    },
    "developer-workflow-verification-verification-selection-and-evidence": {
      title: "Provjere biraj prema promijenjenom ugovoru i opiši granice dokaza",
      description:
        "Pročitaj skripte, odaberi ovlašten relevantni dokaz i pošteno navedi kandidata, ishode i izostanke.",
    },
    "developer-workflow-template-evolution-identify-the-installed-stack-profile": {
      title: "Prije platform recepta utvrdi stvarno instalirani stack",
      description: "Prvo utvrdi stvarni paket, API i alate; Vireo referenca nije instalirana migracija.",
    },
    "developer-workflow-template-evolution-application-and-library-responsibility": {
      title: "Aplikacijsku politiku odvoji od library mehanike",
      description: "Klasificiraj modul, recept i feature uz očuvanu domain politiku i prijevode kod pravog vlasnika.",
    },
    "developer-workflow-template-evolution-published-artifacts-and-local-overrides": {
      title: "Razlikuj objavljenu ovisnost od lokalnog kandidata",
      description: "Odvoji source preview, packed kandidat i public install uz očuvan manifest i lock.",
    },
    "developer-workflow-template-evolution-generated-once-and-regenerated-ownership": {
      title: "Generirani app kod i mehanički indeksi imaju različit lifetime",
      description: "Reference ownership odvaja adoptirani kod od indeksa, otkriva drift i čuva migration povijest.",
    },
    "developer-workflow-template-evolution-projection-boundaries-and-classified-paths": {
      title: "Svaku template putanju klasificiraj prije projekcije",
      description: "Reference projekcija klasificira svaku putanju i identitet umjesto kopiranja flagship governancea.",
    },
    "developer-workflow-template-evolution-three-way-template-adoption": {
      title: "Usporedi immutable baseline, lokalni kod i upstream cilj",
      description: "Reference adopcija uspoređuje hashove i edge te odbija drift bez nagađanja sigurnog mergea.",
    },
  },
} satisfies StringLeaves<typeof englishDeveloperWorkflowHandbookTranslations>;
