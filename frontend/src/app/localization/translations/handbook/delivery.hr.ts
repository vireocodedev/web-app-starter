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
  },
} satisfies StringLeaves<typeof englishDeliveryHandbookTranslations>;
