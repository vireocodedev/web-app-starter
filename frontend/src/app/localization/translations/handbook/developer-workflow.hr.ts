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
    "developer-verification": {
      title: "Tok provjere",
      description:
        "Odaberite dopuštene provjere, serijalizirajte zahtjevan rad i zabilježite dokaze vezane uz izvor i izostavljene provjere.",
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
  },
} satisfies StringLeaves<typeof englishDeveloperWorkflowHandbookTranslations>;
