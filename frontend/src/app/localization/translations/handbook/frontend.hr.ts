import type { StringLeaves } from "../../types/TranslationShape.ts";
import type { englishFrontendHandbookTranslations } from "./frontend.en.ts";

export const croatianFrontendHandbookTranslations = {
  categories: {
    "frontend-workflows": {
      title: "Obrasci radnih tokova",
      description:
        "Frontend radni tokovi s jasnim vlasništvom, životnim ciklusima i oporavkom od neuspjeha, utemeljeni na izvorima.",
    },
  },
  topics: {
    "frontend-access": {
      title: "Pristup i ovlasti",
      description:
        "Koristite trenutačne ovlasti poslužitelja te poništite ograničene nacrte, radnje i privatne predmemorije.",
    },
    "frontend-routing": {
      title: "Ugovori ruta",
      description: "Zadržite čistu izgradnju URL-a te uskladite navigaciju i pomicanje s potvrđenom stranicom.",
    },
    "frontend-editing": {
      title: "Sesije uređivanja",
      description: "Uskladite vrijednosti, revizije, vlasništvo i nacrte koji prelaze rute.",
    },
    "frontend-async-commands": {
      title: "Asinkrone naredbe",
      description: "Posjedujte zahtjeve, ponovno provjerite ovlasti nakon čekanja i odvojite zapis od promatrača.",
    },
    "frontend-collections": {
      title: "Kolekcije i vlasništvo upita",
      description: "Odvojite prikaz tablice od vlasništva rezultata, opsega identiteta upita i invalidacije.",
    },
    "frontend-task-interfaces": {
      title: "Sučelja zadataka",
      description: "Sastavite duge forme, točne preglede, dokaze preduvjeta i potvrđene ishode.",
    },
    "frontend-real-time": {
      title: "Događaji u stvarnom vremenu",
      description:
        "Upravljajte životnim vijekom autoriziranih tokova i uskladite čitanja potaknuta događajima s autoritativnim stanjem poslužitelja.",
    },
    "frontend-offline": {
      title: "Offline tokovi rada",
      description:
        "Odvojite mogućnost rada, trajnu lokalnu namjeru, potvrde sinkronizacije i posljednje valjane snimke.",
    },
    "frontend-state": {
      title: "Trajno lokalno stanje",
      description: "Verzionirajte sheme lokalnih postavki i odvojite vlasništvo pohrane od autoriteta poslužitelja.",
    },
    "frontend-forms": {
      title: "Obrasci i naredbe",
      description:
        "Modelirajte izričito značenje polja, načine entiteta, validaciju među poljima i vlasništvo rezultata uvoza.",
    },
    "frontend-specialized": {
      title: "Specijalizirana sučelja",
      description: "Ograničite životni vijek imperativnih SDK-ova i uskladite nacrte s vanjskim vizualnim prikazima.",
    },
  },
  articles: {
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
    "frontend-access-capability-aware-pages": {
      title: "Stranice prema ovlastima",
      description:
        "Koristite jedan izričit rječnik prikaza kroz izbornike, izravne poveznice i radnje zapisa uz živu backend autorizaciju.",
    },
    "frontend-access-revocation-and-private-cache": {
      title: "Opoziv i privatna predmemorija",
      description:
        "Pri promjeni opaženih ovlasti zajedno poništite stare operacije, ograničene nacrte i zahvaćene privatne query projekcije.",
    },
    "frontend-editing-complete-navigation-guards": {
      title: "Cjelovita zaštita navigacije",
      description:
        "Povežite promjenu rute i upita, izlazak iz preglednika, izričitu odjavu i provjere zauzetosti s jednim životnim ciklusom obrasca.",
    },
    "frontend-routing-typed-route-contracts": {
      title: "Tipizirani ugovori ruta",
      description:
        "Gradite i parsirajte stabilne identitete prikaza i točnih zadataka čistim ugovorom s namjernom nevaljanošću i kompatibilnošću.",
    },
    "frontend-routing-data-aware-scroll-restoration": {
      title: "Vraćanje položaja prema spremnosti podataka",
      description:
        "Prepustite potvrđenoj završnoj stranici spremnost ulaza dok router upravlja poviješću, fragmentom i jednokratnim pomicanjem.",
    },
    "frontend-collections-client-and-server-table-ownership": {
      title: "Vlasništvo klijentskih i poslužiteljskih tablica",
      description:
        "Dijelite prikaz tablice dok feature upravlja udaljenim filtriranjem, sortiranjem, stranicama, opsegom odabira i oporavkom.",
    },
    "frontend-collections-query-key-scope-and-invalidation": {
      title: "Opseg query ključeva i invalidacije",
      description:
        "Uključite sve ulaze koji određuju rezultat i ograničite osvježavanje mutacija na projekcije koje feature može promijeniti.",
    },
    "frontend-real-time-authenticated-event-lifetimes": {
      title: "Autentificirani životni vijek događaja",
      description: "Vezu, listenere i oporavak vežite uz korisnika i sesiju bez poistovjećivanja veze s ovlastima.",
    },
    "frontend-real-time-event-to-cache-reconciliation": {
      title: "Usklađivanje događaja i predmemorije",
      description:
        "Prije primjene provjerite omotnice i entitete te izričito definirajte poredak, ponavljanje i oporavak rupa.",
    },
    "frontend-offline-capability-scoped-offline-adapters": {
      title: "Offline adapteri prema ovlastima",
      description:
        "Definirajte dopuštene offline operacije, podatke vlasnika i transportni fallback bez zaobilaženja zabrane ili sukoba.",
    },
    "frontend-offline-durable-command-queues": {
      title: "Trajni redovi naredbi",
      description:
        "Trajno spremite namjeru vlasnika uz atomsku lokalnu pohranu, ovisnosti, mapiranje identiteta i izričit oporavak ponavljanja.",
    },
    "frontend-offline-synchronization-state-machines": {
      title: "Strojevi stanja sinkronizacije",
      description:
        "Odvojite lokalni red, slanje, prihvaćanje, obradu i konačan ishod trajnim potvrdama i ograničenim oporavkom.",
    },
    "frontend-offline-worker-snapshots-and-last-good-data": {
      title: "Worker snimci i posljednji valjani podaci",
      description:
        "Sačuvajte dosljednu predmemoriju pri djelomičnoj pogrešci i razlikujte potpunost preuzimanja, validaciju i atomsku promociju.",
    },
    "frontend-state-versioned-persisted-preferences": {
      title: "Verzionirane trajne postavke",
      description:
        "Provjerite spremljene vrijednosti, sačuvajte žive postavke pri pogrešci pohrane i migrirajte značenje bez brisanja drugih podataka.",
    },
    "frontend-forms-schema-driven-fields-and-explicit-choices": {
      title: "Polja prema shemi i izričiti izbori",
      description:
        "Dijelite mehaniku polja bez izmišljanja bitnih union izbora inicijalizacijom i skrivanja domenske validacije.",
    },
    "frontend-collections-filter-prerequisites-and-result-states": {
      title: "Preduvjeti filtra i stanja rezultata",
      description: "Razlikujte nedostajući preduvjet, prvi dohvat, prazni uspjeh, osvježavanje, pogrešku i zabranu.",
    },
    "frontend-collections-hierarchical-rows-and-nested-editors": {
      title: "Hijerarhijski retci i ugniježđeni uređivači",
      description: "Odvojite proširenje, odabir, uređivanje djeteta i slanje agregata uz stabilne lokalne identitete.",
    },
    "frontend-forms-entity-modes-and-validation-policy": {
      title: "Načini entiteta i politika validacije",
      description: "Stvaranje i ažuriranje ostavite izričitima uz dijeljenu lokaliziranu validaciju i čekano slanje.",
    },
    "frontend-forms-cross-field-constraints-and-reset": {
      title: "Međupoljna ograničenja i reset",
      description: "Provjerite potpune odnose i namjernim prijelazima uklonite samo nekompatibilne ovisne izbore.",
    },
    "frontend-specialized-imperative-sdk-lifetimes": {
      title: "Životni vijek imperativnih SDK-ova",
      description:
        "Upravljajte DOM ciljevima, instancama, pretplatama i asinkronom inicijalizacijom uz određeno čišćenje.",
    },
    "frontend-specialized-draft-and-visualization-synchronization": {
      title: "Usklađivanje nacrta i vizualizacije",
      description:
        "Čuvajte jedan kanonski nacrt uz izričito mapiranje vizuala, interakcije i zasebnu naredbu spremanja.",
    },
    "frontend-collections-reporting-and-export-scope": {
      title: "Izvještavanje i opseg izvoza",
      description:
        "Izričito definirajte filtre, razdoblje, odabir, format i ishode generiranja na ekranu i u datoteci.",
    },
    "frontend-forms-file-import-command-results": {
      title: "Ishodi naredbe uvoza datoteke",
      description:
        "Odvojite prijenos, prihvaćenu obradu, primijenjene zapise i oporavak uz sigurno ponavljanje i preuzimanje.",
    },
  },
} satisfies StringLeaves<typeof englishFrontendHandbookTranslations>;
