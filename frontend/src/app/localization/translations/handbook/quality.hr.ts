import type { StringLeaves } from "../../types/TranslationShape.ts";
import type { englishQualityHandbookTranslations } from "./quality.en.ts";

export const croatianQualityHandbookTranslations = {
  categories: {
    quality: {
      title: "Kvaliteta i provjera",
      description:
        "Odaberite opažljive granice, izolirane fixture, scenarije utrke, stvarne integracijske dokaze i pristupačne tokove u pregledniku.",
    },
  },
  topics: {
    "quality-test-design": {
      title: "Dizajn testova",
      description: "Provjerite smislene ishode na granicama i održavajte determinističke fixture, satove i dokaze.",
    },
    "quality-frontend": {
      title: "Provjera frontenda",
      description: "Izolirajte runtime i cache, HTTP scenarije, asinkrono vlasništvo i efekte s čišćenjem.",
    },
    "quality-backend": {
      title: "Provjera backenda",
      description:
        "Koristite stvarne granice baze i HTTP-a te izričito opišite granice dokaza transakcija i konkurentnosti.",
    },
    "quality-browser": {
      title: "Preglednik i pristupačnost",
      description:
        "Provjerite sastavljene rute, tipkovnicu i fokus, prilagodljiv raspored i dopunjujuće dokaze pristupačnosti.",
    },
  },
  articles: {
    "quality-test-design-assert-boundary-outcomes": {
      title: "Provjerite ishode granice",
      description:
        "Odaberite najmanju stvarnu granicu za namjerne promjene, odsutnost zabranjenog i izolaciju drugih vlasnika.",
    },
    "quality-frontend-fresh-runtime-and-query-fixtures": {
      title: "Svježi runtime i query fixturei",
      description:
        "Izolirajte runtime, cache i servise te odvojite produkcijsku retry politiku od determinističkih fixturea.",
    },
    "quality-frontend-http-contract-mocks-and-handler-lifetimes": {
      title: "HTTP mockovi i životni vijek handlera",
      description:
        "Zadržite stvarnu serijalizaciju i parsiranje uz scenarijske MSW handlere za zaglavlja, brojeve, pogreške i čišćenje.",
    },
    "quality-frontend-async-generation-and-stale-result-scenarios": {
      title: "Asinkrone generacije i stari rezultati",
      description:
        "Zadržite i otpustite odgovore kako biste dokazali aktualnu ovlast kroz stare dohvate, potvrde i kasne ishode.",
    },
    "quality-frontend-signal-effect-disposal-and-storage-failures": {
      title: "Disposal signal effecta i pogreške pohrane",
      description: "Provjerite živo stanje, status persistencije i odsutnost kasnijih upisa nakon uklanjanja effecta.",
    },
    "quality-backend-real-postgres-and-http-contracts": {
      title: "Stvarni PostgreSQL i HTTP ugovori",
      description:
        "Koristite jednokratni PostgreSQL i stvarni HTTP za sesije, cookieje, CSRF, JSON i trajne negativne ishode.",
    },
    "quality-backend-transaction-conflicts-and-lock-scenarios": {
      title: "Transakcijski sukobi i lock scenariji",
      description:
        "Kontrolirajte preklapanje transakcija i provjerite ovlast, replay i trajne invariante bez preuveličavanja timeouta.",
    },
    "quality-browser-assembled-routes-and-development-profiles": {
      title: "Sastavljene rute i razvojni profili",
      description:
        "Povežite browser dokaze s DEV ili build profilom, izričitim odabirom scenarija i frontend mock granicom.",
    },
    "quality-browser-keyboard-responsive-and-accessibility-evidence": {
      title: "Tipkovnički, responzivni i pristupačni dokazi",
      description: "Povežite semantički fokus, usku lokaliziranu geometriju i axe opseg uz izričite granice dokaza.",
    },
    "quality-test-design-deterministic-fixtures-and-clock-ownership": {
      title: "Deterministički fixturei i vlasništvo sata",
      description: "Neovisno upravljajte brojačima, odgovorima, timerima, poslovnim vremenom, jezikom i kalendarom.",
    },
  },
} satisfies StringLeaves<typeof englishQualityHandbookTranslations>;
