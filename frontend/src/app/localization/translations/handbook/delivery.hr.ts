import type { StringLeaves } from "../../types/TranslationShape.ts";
import type { englishDeliveryHandbookTranslations } from "./delivery.en.ts";

export const croatianDeliveryHandbookTranslations = {
  categories: {
    delivery: {
      title: "Isporuka i operacije",
      description: "Nepromjenjiva izdanja, promocija okruženja, migracije i oporavak.",
    },
  },
  topics: {
    "delivery-artifacts": {
      title: "Izvršivi artefakti",
      description: "Izgradite imageove neovisne o okruženju i provjerite stvarne artefakte pod runtime ograničenjima.",
    },
    "delivery-releases": {
      title: "Izdanja i promocija",
      description: "Izgradite jedan nepromjenjivi par i promovirajte prihvaćene artefakte.",
    },
    "delivery-recovery": {
      title: "Migracije i oporavak",
      description: "Sačuvajte podatke i utvrdite točnu granicu neuspjeha.",
    },
    "delivery-operations": {
      title: "Operacije na hostu",
      description:
        "Povežite pouzdanu predaju hostu, izolaciju okruženja, dijagnostiku i izričito provisioniranje s dokazima vezanim uz izvor.",
    },
  },
  articles: {
    "delivery-releases-immutable-image-pairs": {
      title: "Isporuči jedan nepromjenjivi par frontend/backend slika",
      description: "Pakiraj obje aplikacije iz istog izvora i očuvaj prihvaćeni par digesta između okruženja.",
    },
    "delivery-releases-staging-and-production-promotion": {
      title: "Provjeri par na stagingu i promoviraj upravo prihvaćeni artefakt",
      description:
        "Odvoji build, objavu u svježem workeru i šifrirani host zahtjev; promoviraj točan prihvaćeni par bez rebuilda.",
    },
    "delivery-recovery-migration-failure-boundaries": {
      title: "Oporavak ovisi o granici na kojoj je migracija stala",
      description:
        "Blokiraj produkcijski startup do trajno provjerenog backupa i uskladi neuspjeh bez automatskog vraćanja baze.",
    },
    "delivery-artifacts-frontend-image-contract": {
      title: "Izgradi frontend sliku prenosivu između okruženja",
      description:
        "Sačuvaj same-origin postavke, SPA/API/asset granice, immutable cache i ograničeni Nginx u istoj slici.",
    },
    "delivery-artifacts-backend-image-contract": {
      title: "Odvoji backend kompilaciju od ograničenog runtimea",
      description:
        "Kompiliraj deklariranim JDK-om, pokreni non-root JRE jar i izvana dodaj zaštićenu konfiguraciju uz odvojene dokaze.",
    },
    "delivery-artifacts-runtime-smoke-evidence": {
      title: "Provjeri proizvedenu sliku pod stvarnim runtime ograničenjima",
      description:
        "Provjeri stvarnu sliku, API i provisioning uz jednokratne resurse i točan cleanup te jasno ograniči tvrdnje o dokazu.",
    },
    "delivery-releases-build-publish-request-boundaries": {
      title: "Build, objava i deployment zahtjev trebaju različite ovlasti",
      description:
        "Odvoji aplikacijski build, registry objavu u svježem workeru i šifrirani host zahtjev fiksnog ugovora.",
    },
    "delivery-operations-encrypted-host-handoff": {
      title: "Pošalji šifrirani ticket fiksnom pouzdanom host kodu",
      description: "Neovisno autoriziraj šifrirani zahtjev fiksnog ugovora pa izvrši zaštićeni instalirani host kod.",
    },
    "delivery-operations-environment-and-database-isolation": {
      title: "Odvoji identitet okruženja od zamjene aplikacije",
      description:
        "Odvoji konfiguraciju i trajnu bazu svakog okruženja dok release mijenja samo immutable aplikacijski par.",
    },
    "delivery-recovery-durable-backup-artifacts": {
      title: "Backup je dovršen tek nakon trajne provjere artefakta",
      description:
        "Provjeri arhivu, checksum i trajnost konačnog naziva te jasno ograniči retenciju i server-loss zaštitu.",
    },
    "delivery-recovery-isolated-restore-rehearsal": {
      title: "Oporavak probaj iz preuzete kopije u izoliranoj bazi",
      description:
        "Obnovi točnu preuzetu provjerenu kopiju u izolirani task PostgreSQL i potvrdi inicijalizaciju bez dodira live podataka.",
    },
    "delivery-recovery-reconcile-uncertain-releases": {
      title: "Prije retrya razriješi neizvjestan release",
      description:
        "Poveži request i transaction dokaze sa slikama, shemom i javnim stanjem prije retrya ili data-loss odluke.",
    },
    "delivery-operations-health-and-diagnostic-evidence": {
      title: "Odvojeno dijagnosticiraj dostupnost, identitet i ponašanje",
      description:
        "Koristi slojevite health/identity provjere i ciljanu netajnu dijagnostiku uz odvojeni poslovni prihvat.",
    },
    "delivery-operations-provisioning-after-deployment": {
      title: "Početni identitet provisioniraj zasebnom naredbom nakon deploymenta",
      description:
        "Koristi prihvaćeni digest i odvojene tajne za izričito stvaranje računa koje čuva isti repeat i odbija konflikt.",
    },
  },
} satisfies StringLeaves<typeof englishDeliveryHandbookTranslations>;
