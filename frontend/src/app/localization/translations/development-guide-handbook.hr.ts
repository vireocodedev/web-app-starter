import type { StringLeaves } from "../types/TranslationShape";
import type { englishHandbookTranslations } from "./development-guide-handbook.en";

export const croatianHandbookTranslations = {
  navigation: {
    index: "Teme: {{category}}",
    choosePage: "Odaberite članak, trenutačni članak: {{page}}",
    closePages: "Zatvori članke",
    pageNavigation: "Navigacija članaka",
    contents: "Sadržaj članka",
    related: "Povezano čitanje",
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
    backend: {
      title: "Backend",
      description: "Runtime, sigurnost, aplikacijski servisi i trajni podaci.",
    },
    ci: {
      title: "Kontinuirana integracija",
      description: "Provjere prema vlasniku, potpuni dokazi i izolirani izvršitelji.",
    },
    delivery: {
      title: "Isporuka i operacije",
      description: "Nepromjenjiva izdanja, promocija okruženja, migracije i oporavak.",
    },
    "developer-workflow": {
      title: "Razvojni postupci",
      description: "Lokalni runtimeovi, debugiranje, provjere i svakodnevna implementacija.",
    },
    "agent-workflow": {
      title: "Rad AI agenata",
      description: "Pronađite vlasnika, provedite ograničen zadatak i predajte dokaze.",
    },
    "frontend-workflows": {
      title: "Obrasci radnih tokova",
      description: "Sesije uređivanja, asinkrone ovlasti, pouzdane naredbe i nacrti kroz više ruta.",
    },
  },
  topics: {
    "backend-foundation": {
      title: "Temelji",
      description: "Konfiguracija, granice aplikacije, validacija i pogreške.",
    },
    "backend-security": {
      title: "Sigurnost",
      description: "Ovlasti sesije, CSRF i namjerno stvaranje identiteta.",
    },
    "backend-data": {
      title: "Podaci i shema",
      description: "Trajne invarijante, povijest migracija i vlasništvo nad shemom.",
    },
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
    "delivery-releases": {
      title: "Izdanja i promocija",
      description: "Izgradite jedan nepromjenjivi par i promovirajte prihvaćene artefakte.",
    },
    "delivery-recovery": {
      title: "Migracije i oporavak",
      description: "Sačuvajte podatke i utvrdite točnu granicu neuspjeha.",
    },
    "developer-workflow-local-development": {
      title: "Lokalni razvoj",
      description: "Pokrenite namijenjene runtimeove i sačuvajte postojeće lokalno stanje.",
    },
    "agent-workflow-implementation": {
      title: "Postupak implementacije",
      description: "Odaberite vlasnika i javno sučelje prije promjene ponašanja.",
    },
    "frontend-editing": {
      title: "Sesije uređivanja",
      description: "Uskladite vrijednosti, revizije, vlasništvo i nacrte koji prelaze rute.",
    },
    "frontend-async-commands": {
      title: "Asinkrone naredbe",
      description: "Posjedujte zahtjeve, ponovno provjerite ovlasti nakon čekanja i odvojite zapis od promatrača.",
    },
    "frontend-task-interfaces": {
      title: "Sučelja zadataka",
      description: "Sastavite duge forme, točne preglede, dokaze preduvjeta i potvrđene ishode.",
    },
  },
  articles: {
    "backend-foundation-runtime-and-configuration": {
      title: "Vlasništvo nad runtimeom i konfiguracijom",
      description:
        "Odredite vlasnike Jave, Spring profila, konfiguracije baze, cookie transporta i pravila sheme bez dupliciranja operatorskog postavljanja.",
    },
    "backend-foundation-http-service-persistence-boundaries": {
      title: "Granice HTTP-a, aplikacijskog servisa i persistencije",
      description:
        "Odvojite transportne DTO-e, žive ovlasti, cjelovite transakcijske radnje i persistenciju, uz jasno označen recept promjene s revizijom.",
    },
    "backend-foundation-validation-and-error-contracts": {
      title: "Validacija i javni ugovori pogrešaka",
      description:
        "Razlikujte ugrađene autentikacijske odgovore od namjernog protokola domenskih pogrešaka, sigurnih detalja validacije i oporavka koji čuva nacrt.",
    },
    "backend-security-session-and-csrf-lifecycle": {
      title: "Session autentikacija i CSRF imaju zajednički životni ciklus",
      description:
        "Sačuvajte dohvat CSRF-a, rotaciju sesije, eksplicitno spremanje konteksta, novi token nakon prijave i odjavu kao jedinstven sigurnosni ugovor.",
    },
    "backend-security-account-provisioning": {
      title: "Lokalno stvaranje korisnika i jednokratni provisioning",
      description:
        "Odvojite lokalno stvaranje bez ažuriranja od operatorskog provisioninga s točnim podudaranjem, zaštitama profila i BCrypt granicom bajtova.",
    },
    "backend-data-flyway-and-schema-ownership": {
      title: "Flyway upravlja aplikacijskom i session shemom",
      description:
        "Verzionirajte promjene s jednim DDL vlasnikom, čuvajte povijest migracija i provedite veze ograničene opsegom kroz bazu i autorizaciju.",
    },
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
    "developer-workflow-local-development-workspace-runtimes": {
      title: "Jedan workspace, dva runtimea",
      description:
        "Pokrenite Javu i Node deklariranim runtimeovima i uređenim VS Code helperima uz čuvanje identiteta baze, pristupnih podataka, volumea i same-origin sesije.",
    },
    "agent-workflow-implementation-owner-first-change": {
      title: "Prije uređivanja pronađite vlasnika",
      description:
        "Pretvorite traženi ishod u ograničenu promjenu s jasnim vlasnikom, vrstom dokaza, javnim granicama, dopuštenom verifikacijom i zasebno autoriziranom isporukom.",
    },
    "frontend-editing-pinned-values-and-revisions": {
      title: "Zadržane vrijednosti i revizije",
      description:
        "Sačuvajte jednu osnovu uređivanja dok pozadinski dohvati, zastarjelost i ponovno učitavanje mijenjaju okolne ovlasti.",
    },
    "frontend-async-commands-owned-reads-and-shared-subscriptions": {
      title: "Vlastiti dohvati i zajedničke pretplate",
      description:
        "Otkažite zastarjele dohvate uređivača bez prekidanja zajedničkih query promatrača i skrivanja stvarnih pogrešaka.",
    },
    "frontend-async-commands-generation-guards-after-await": {
      title: "Provjere generacije nakon awaita",
      description:
        "Poništite zastarjele potvrde i zakašnjele dovršetke kada se promijene zapis, sesija ili opažene ovlasti.",
    },
    "frontend-async-commands-stable-retry-identity": {
      title: "Stabilan identitet ponovnog pokušaja",
      description:
        "Povežite nepromjenjivu klijentsku naredbu s autoriziranim transakcijskim potvrdama prije ponavljanja neizvjesnog zapisivanja.",
    },
    "frontend-async-commands-committed-writes-and-observer-failures": {
      title: "Potvrđeno zapisivanje i pogreške promatrača",
      description: "Razdvojite potvrđenu persistenciju od neuspjelih osvježavanja, callbackova i neizvjesnih odgovora.",
    },
    "frontend-editing-drafts-across-routes": {
      title: "Nacrti kroz više ruta",
      description:
        "Zadržite nacrt određenog vlasnika kroz dopušten prijelaz, osvježite izbore pri povratku i sačuvajte izričit korisnikov odabir.",
    },
    "frontend-task-interfaces-topic-editors-and-error-focus": {
      title: "Navigacija tema zadržava jednu formu i jednog vlasnika",
      description:
        "Sačuvajte stanje polja kroz teme, zadržite slanje kod vlasnika forme te otkrijte i fokusirajte ciljeve pogrešaka.",
    },
    "frontend-task-interfaces-readable-review-and-exact-decisions": {
      title: "Prikažite čitljive dokaze prije točne odluke",
      description:
        "Prikažite cjelovite verzionirane dokaze i točno imenovanu odluku bez izmišljanja potvrda čitanja ili zamrzavanja ovlasti.",
    },
    "frontend-task-interfaces-prerequisites-and-confirmed-receipts": {
      title: "Preduvjeti prikazuju dokaze, potvrde priznate ishode",
      description:
        "Objasnite blokade izvora, djelomičnu pokrivenost, precizna rješenja i razliku prihvaćenog rada od dovršenih učinaka.",
    },
  },
} satisfies StringLeaves<typeof englishHandbookTranslations>;
