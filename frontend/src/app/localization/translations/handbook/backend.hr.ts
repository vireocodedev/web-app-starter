import type { StringLeaves } from "../../types/TranslationShape.ts";
import type { englishBackendHandbookTranslations } from "./backend.en.ts";

export const croatianBackendHandbookTranslations = {
  categories: {
    backend: {
      title: "Backend",
      description: "Runtime, sigurnost, aplikacijski servisi i trajni podaci.",
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
    "backend-application-services": {
      title: "Aplikacijski servisi",
      description: "Posjedujte cjelovite naredbe, transakcijske granice, prijelaze i potvrđene ishode.",
    },
    "backend-data": {
      title: "Podaci i shema",
      description: "Trajne invarijante, povijest migracija i vlasništvo nad shemom.",
    },
    "backend-queries": {
      title: "Upiti i modeli čitanja",
      description:
        "Projicirajte dopuštenu vidljivost, ograničite rezultate i trošak te opišite jamstva snimke i pokrivenosti.",
    },
    "backend-integrations": {
      title: "Vanjske integracije",
      description: "Odvojite identitet ulaza, opaženo stanje, neizvjesnost pružatelja, usklađivanje i ograničeni rad.",
    },
    "backend-files": {
      title: "Privatne datoteke",
      description:
        "Ograničite bajtove uploada i zajedničke kvote, odvojite projekcije metapodataka i autorizirajte svako privatno preuzimanje.",
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
    "backend-application-services-transactional-commands": {
      title: "Jedna transakcija za jednu cjelovitu poslovnu naredbu",
      description:
        "Objedinite povezane promjene, zaštićene invarijante i obvezni audit te razlikujte proxy ulaz, flush, commit i vanjske učinke.",
    },
    "backend-data-revision-conflicts-and-shared-locks": {
      title: "Konflikti revizija i zajednička zaključavanja invarijanti",
      description:
        "Očekivanom revizijom zaštitite namjeru uređivača, a zajedničkim uređenim lock protokolom kvote i životni ciklus agregata.",
    },
    "backend-data-lock-order-and-fresh-transaction-retries": {
      title: "Stabilan redoslijed lockova i retry u novoj transakciji",
      description:
        "Uredite kanonske identitete, razriješite insert utrke ograničenjima i oporavite se tek nakon završetka neuspjele transakcije, uz ograničen retry i provjeru vlasništva.",
    },
    "backend-security-resource-scope-and-composite-keys": {
      title: "Provedite opseg resursa kroz ovlasti, upite i ključeve",
      description:
        "Žive ovlasti, child upite i veze resursa zadržite u dopuštenom opsegu uz složene strane ključeve, bez izjednačavanja integriteta i autorizacije.",
    },
    "backend-foundation-patch-tristate-and-write-dtos": {
      title: "Tri stanja PATCH-a i namjenski write DTO-i",
      description:
        "Sačuvajte izostanak, eksplicitni null i prisutnu vrijednost kroz dekodiranje, validaciju i mapiranje, uz server-owned identitet, audit i izvedena polja.",
    },
    "backend-data-audit-fields-events-and-versions": {
      title: "Audit polja, događaji i nepromjenjive verzije odgovaraju na različita pitanja",
      description:
        "Namjerno odaberite last-modified podatke, transakcijsku povijest i zadržane verzije, uz aktera, privatnost, projekcije i pravila nepromjenjivog ispravljanja.",
    },
    "backend-queries-visibility-before-search-and-facets": {
      title: "Primijenite vidljivost prije pretrage, faceta i brojeva",
      description:
        "Pretragu, filtre, opcije i totale gradite nad dopuštenom projekcijom kako privatni povezani identitet ne bi procurio kroz metapodatke ili podudaranje.",
    },
    "backend-queries-bounded-pagination-and-sort-contracts": {
      title: "Ograničena paginacija i namjenski ugovor sortiranja",
      description:
        "Validirajte paging, allowlistajte strukturu sortiranja i definirajte stabilan tie-breaker uz cijenu counta, faceta i dubokog offseta.",
    },
    "backend-queries-snapshot-consistent-page-metadata": {
      title: "Jedan snapshot za retke i metapodatke stranice",
      description:
        "Eksplicitnom kratkom transakcijskom granicom i izolacijom uskladite retke, total, opcije i checked-at dokaz jednog odgovora.",
    },
    "backend-queries-signed-cursors-and-scope": {
      title: "Potpisani cursori vežu paging uz semantički opseg",
      description:
        "Vežite nastavak uz aktera, opseg, poredak, istek i vidljivu projekciju, uz jasne granice process-local ključa i in-memory paginga.",
    },
    "backend-queries-read-budgets-and-unknown-coverage": {
      title: "Ograničite rad čitanja i pošteno prijavite nepoznatu pokrivenost",
      description:
        "Sastavite ograničene činjenice uz istinitu potpunu, djelomičnu, nedostupnu i nepoznatu pokrivenost, čuvajući cancellation i ovlasti.",
    },
    "backend-application-services-commit-aware-notifications": {
      title: "Obavijestite klijente nakon commita i navedite granice isporuke",
      description:
        "Odvojite hint potvrđene promjene od trajne isporuke, uz fallback, ThreadLocal čišćenje, subscriber ovlasti i reconnect usklađivanje.",
    },
    "backend-integrations-transport-and-domain-boundaries": {
      title: "Odvojite dekodiranje transporta od domenskih ovlasti",
      description:
        "Odvojite ograničeno wire dekodiranje i odgovore od source autentikacije, odobrene resource mape, živog vlasništva i transakcijske persistencije.",
    },
    "backend-integrations-durable-ingestion-deduplication": {
      title: "Deduplirajte trajne učinke, ne samo primljene poruke",
      description:
        "Trajnim observation identitetom, lockovima i watermarkom čuvajte učinke kroz restart, uz ograničenu ulogu cachea i protokolskih odgovora.",
    },
    "backend-integrations-intent-and-observed-state": {
      title: "Trajnu namjeru odvojite od opaženog vanjskog stanja",
      description:
        "Zadržite zahtjev odvojeno od svježeg pouzdanog opažanja, uz korelaciju, opseg i prijelaze umjesto izjednačavanja prihvata i remote uspjeha.",
    },
    "backend-integrations-lease-expiry-and-fresh-evidence": {
      title: "Istek leasea ostaje neizvjesnost do svježeg dokaza",
      description:
        "Isteklu pripremu oporavite trenutačnim ovlastima i svježim inactive dokazom, uz imenovanu skew/age politiku umjesto preuzimanja samo timerom.",
    },
    "backend-integrations-uncertain-provider-outcomes": {
      title: "Modelirajte neizvjesnost providera i zatvorite nepostavljenu putanju",
      description:
        "Definirajte capabilities i potvrđen, odbijen ili neizvjestan ishod te provjerite dokaze bez izmišljanja uspjeha nekonfiguriranog adaptera ili izgubljenog odgovora.",
    },
    "backend-integrations-claim-call-reconcile": {
      title: "Preuzmite rad, pozovite izvan transakcije pa uskladite",
      description:
        "Potvrdite nepromjenjivu namjeru i claim, izvedite vanjski I/O bez database transakcije pa isti identitet uskladite pod eksplicitnom worker/evidence ovlasti.",
    },
    "backend-integrations-bounded-scheduled-work": {
      title: "Ograničite scheduled rad i jasno odredite vlasništvo",
      description:
        "Odvojite cadence, event vrijeme, ograničen odabir i item transakcije, uz trajni claim te jasne granice kapaciteta, cancellationa i replika.",
    },
    "backend-integrations-process-adapter-boundaries": {
      title: "Podproces tretirajte kao ograničen integracijski adapter",
      description:
        "Prilagodite tipizirani legacy protokol uz nove rokove, cancellation, bounded output, eksplicitan kvar i sigurno čišćenje vlastitog procesa.",
    },
    "backend-security-live-authority-and-session-claims": {
      title: "Provjerite žive ovlasti umjesto zastarjelih session tvrdnji",
      description:
        "Razlikujte session identitet predloška i žive account, role, membership i resource politike zaštićenih radnji.",
    },
    "backend-security-api-key-selectors-and-one-time-secrets": {
      title: "API ključevi: javni selektor i jednokratna tajna",
      description:
        "Odvojite javni lookup i hashiranu bearer tajnu uz jednokratnu objavu, lifecycle, machine ovlasti i rotaciju.",
    },
    "backend-security-remembered-credentials-and-fixed-expiry": {
      title: "Zapamćena prijava ima vlastiti istek i vezu s računom",
      description:
        "Obnovite identitet cookie tajnom i stored digest/fingerprintom uz fixed-expiry konkurenciju, bez obnove operativnog bindinga.",
    },
    "backend-files-bounded-uploads-and-shared-quotas": {
      title: "Ograničite stvarne upload bajtove pod zajedničkim quota lockom",
      description:
        "Provedite transport/domain/database granice, serializirajte count/byte kvotu i provjerite sadržaj umjesto metadata povjerenja.",
    },
    "backend-files-private-downloads-and-metadata-projections": {
      title: "Odvojite privatno preuzimanje i metadata projekcije",
      description:
        "Izostavite blobove iz lista/kvota, autorizirajte scoped download i attachment transport bez izmišljenog scan/streaminga.",
    },
    "backend-data-exact-decimals-and-rounding-policy": {
      title: "Odvojite točne decimale, zaokruživanje i prikaz",
      description:
        "Sačuvajte bounded decimalne stringove i BigDecimal uz eksplicitne sign/unit/precision i rounding mode/fazu, odvojeno od prikaza.",
    },
    "backend-data-digests-and-reviewed-artifact-versions": {
      title: "Vežite pregled i export uz točnu zadržanu verziju artefakta",
      description:
        "Zadržite pregledane bajtove, reviziju i input digeste te razlikujte povijesni export, current evidence, kanonizaciju i ovlasti.",
    },
  },
} satisfies StringLeaves<typeof englishBackendHandbookTranslations>;
