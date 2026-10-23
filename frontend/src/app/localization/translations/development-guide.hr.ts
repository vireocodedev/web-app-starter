import type { DevelopmentGuideTranslationShape } from "../types/TranslationShape";

export const croatianDevelopmentGuideTranslations = {
  categories: {
    title: "Kategorije",
    description: "Odaberite kategoriju vodiča za razvoj.",
    navigationLabel: "Kategorije vodiča za razvoj",
    frontendDescription: "Primjeri stranica, Obrasci i Arhitektura.",
    backendDescription: "Razvoj poslužiteljskog dijela aplikacije.",
  },
  backendGuide: {
    greeting: "Pozdrav svijete!",
  },
  examplePages: {
    description: "Istražite primjere cjelovitih aplikacijskih stranica.",
    navigationLabel: "Primjeri stranica",
    dashboardDescription: "Sažeci i statistika kontakata.",
    contactsDescription: "Pretražujte, stvarajte, uređujte i brišite kontakte.",
  },
  patternCategories: {
    description: "Odaberite kategoriju obrazaca za razvoj sučelja.",
    navigationLabel: "Kategorije obrazaca",
    choosePage: "Odaberite primjer, trenutačni primjer: {{page}}",
    closePages: "Zatvori primjere",
  },
  application: {
    description: "Recept za lokalizaciju u vlasništvu aplikacije.",
    title: "Lokalizacija aplikacije",
  },
  home: {
    description: "Uredite src/pages/HomePage.tsx kako biste počeli graditi svoju aplikaciju.",
    title: "Početna",
  },
  architectureGuide: {
    articles: {
      addChangeOrRemoveAFeature: "Dodavanje, izmjena ili uklanjanje značajke",
      apisModelsQueriesAndMutations: "API-ji, modeli, upiti i mutacije",
      authenticationAndSession: "Autentikacija i sesija",
      dependencyBoundariesAndImports: "Granice ovisnosti i uvozi",
      entryPointToRenderedApplication: "Od ulazne točke do prikazane aplikacije",
      featureAnatomyFilenamesAndPublicInterfaces: "Anatomija značajke, nazivi datoteka i javna sučelja",
      featureInventoryAndResponsibilities: "Popis značajki i odgovornosti",
      httpQueryAndBrowserStorage: "HTTP, Query i pohrana preglednika",
      localizationThemeAndPreferences: "Lokalizacija, tema i korisničke postavke",
      routeEntriesAndFeatureComposition: "Ulazi ruta i kompozicija značajki",
      routerAndShellResponsibilities: "Odgovornosti routera i ljuske",
      runtimeProvidersAndLifetimes: "Izvršno okruženje, provideri i životni vijekovi",
      sourceMapAndOwnership: "Karta izvornog koda i vlasništvo",
      stateOwnershipAndSignalLifecycle: "Vlasništvo stanja i životni ciklus Signala",
      testsMocksStoriesAndArchitectureChecks: "Testovi, mockovi, priče i arhitekturne provjere",
    },
    contents: {
      label: "Sadržaj članka",
      title: "Na ovoj stranici",
    },
    groups: {
      application: "Aplikacija — src/app",
      contributing: "Doprinos projektu",
      features: "Značajke — src/features",
      pages: "Stranice — src/pages",
      startHere: "Počnite ovdje",
      startup: "Pokretanje — main.tsx + app/bootstrap",
    },
    pageNavigation: {
      label: "Navigacija arhitekturnih članaka",
      next: "Sljedeće",
      previous: "Prethodno",
    },
    relatedPatterns: {
      label: "Povezani interaktivni Patterns primjeri",
      title: "Isprobajte u Patternsu",
    },
  },
  applicationStateExamples: {
    effects: {
      application: {
        active: "Aplikacijski efekt je aktivan",
        description:
          "Pokrenite efekte životnog vijeka aplikacije jednom, nakon hidratacije, i vratite funkciju za njihovo uklanjanje izvršnom okruženju.",
        hint: "Uređivanje procjene pokreće registrirani efekt spremanja.",
        title: "Efekt životnog vijeka aplikacije",
      },
      component: {
        action: "Prikaži ukupnu procjenu u naslovu preglednika",
        description:
          "Integraciju s preglednikom smjestite u efekt komponente i tijekom čišćenja vratite prethodnu vrijednost.",
        documentTitle: "{{total}} · Procjena",
        title: "Efekt komponente s čišćenjem",
      },
      contents: {
        label: "Primjeri efekata i čišćenja Signala",
        title: "Na ovoj stranici",
      },
      nonReactive: {
        action: "Zabilježi trenutačni iznos",
        description:
          "Koristite peek za bilježenje u trenutku događaja koje čita Signal bez stvaranja reaktivne ovisnosti.",
        empty: "Iznos još nije zabilježen.",
        recorded: "Zabilježeni iznos: {{total}}",
        title: "Nereaktivno bilježenje",
      },
    },
    persistence: {
      contents: {
        label: "Primjeri trajnog stanja",
        title: "Na ovoj stranici",
      },
      contract: {
        description:
          "Deklarirajte ključ pohrane, shemu i zadanu vrijednost zajedno kako bi spremljeno stanje ostalo provjereno i tipizirano.",
        title: "Tipizirani ugovor pohrane",
      },
      effect: {
        description:
          "Registrirajte spremanje kao aplikacijski efekt kako bi se svaka promjena stanja spremila izvan UI komponenti.",
        hint: "Promijenite bilo koju vrijednost procjene kako biste spremili cijelo stanje.",
        status: {
          idle: "Čekanje efekta",
          saved: "Spremljeno lokalno",
          unavailable: "Pohrana nije dostupna",
        },
        title: "Spremanje putem efekta",
      },
      hydration: {
        action: "Vrati spremljenu procjenu",
        description:
          "Hidratizirajte grupu Signala prije pokretanja efekata kako zadane vrijednosti ne bi prebrisale valjano spremljeno stanje.",
        title: "Hidratacija prije efekata",
      },
    },
    shared: {
      formula: "{{hours}} sati × {{rate}}",
      hoursLabel: "Sati",
      rateLabel: "Satnica",
    },
    sharing: {
      actions: {
        description: "Izložite radnje značajke umjesto da rutirane komponente usklađuju više zapisa u Signale.",
        reset: "Vrati procjenu",
        title: "Zapise zadržite iza radnji",
      },
      contents: {
        label: "Primjeri stanja između ruta",
        title: "Na ovoj stranici",
      },
      surface: {
        description:
          "Čitajte iste Signale značajke s bilo koje rutirane površine bez kopiranja stanja u komponente rute.",
        title: "Dijeljenje jedne površine stanja",
      },
      transition: {
        action: "Pregledaj spremanje",
        description:
          "Uobičajeno se krećite između ruta; grupa Signala u vlasništvu aplikacije ostaje aktivna izvan obje stranice.",
        hint: "Promijenite procjenu, slijedite rutu i ondje pronađite iste vrijednosti.",
        title: "Očuvanje stanja tijekom promjene rute",
      },
    },
    source: {
      batch: {
        apply: "Primijeni oglednu procjenu",
        description:
          "Grupirajte povezane zapise u jednoj radnji značajke kada ih potrošači trebaju vidjeti kao jedno ažuriranje.",
        reset: "Vrati procjenu",
        title: "Grupiranje povezanih zapisa",
      },
      computed: {
        description: "Izvedite ukupan iznos pomoću izračunatog Signala kako bi svi potrošači dijelili isti izračun.",
        title: "Izračunati Signal",
      },
      contents: {
        label: "Primjeri izvornih i izračunatih Signala",
        title: "Na ovoj stranici",
      },
      writable: {
        description: "Najmanje zapisive vrijednosti držite kao izvorne Signale i ažurirajte ih radnjama značajke.",
        title: "Izvorni Signali",
      },
    },
  },
  serverDataExamples: {
    optimistic: {
      contents: {
        label: "Primjeri optimističnih izmjena",
        title: "Na ovoj stranici",
      },
      title: "Trenutačna izmjena i povrat nakon odbijanja",
      description:
        "Izmijenite kolekciju i detalje prije odgovora poslužitelja. Odbijte spremanje da biste vratili prethodno stanje ili ga prihvatite da biste povećali reviziju poslužitelja. Istodobno se izvršava jedno spremanje.",
      loading: "Učitavanje primjera zapisa",
      loadFailed: "Primjer nije moguće učitati.",
      collection: "Status u kolekciji: {{status}}",
      detail: "Status u detaljima: {{status}}",
      revision: "Prihvaćena revizija poslužitelja: {{revision}}",
      rejectSave: "Odbij ovo spremanje",
      save: "Promijeni status i spremi",
      saving: "Spremanje…",
      pending: "Izmjena je privremena do odgovora poslužitelja.",
      failed:
        "Spremanje je odbijeno. Prethodno stanje je vraćeno. Isključite „Odbij ovo spremanje” i pokušajte ponovno.",
      saved: "Spremljeno i usklađeno s poslužiteljem.",
      status: {
        active: "Aktivan",
        paused: "Pauziran",
      },
    },
    cancellation: {
      automatic: {
        description: "Proslijedite signal upitu kako bi promjena filtra automatski prekinula zastarjeli zahtjev.",
        label: "Pretraži zapise",
        title: "Prekid zastarjelih pretraga",
      },
      contents: {
        label: "Primjeri prekida zahtjeva",
        title: "Na ovoj stranici",
      },
      manual: {
        action: "Prekini trenutačni zahtjev",
        cancelled: "Zahtjev je prekinut",
        description:
          "Izričito prekinite područje predmemorije kada korisnička radnja učini trenutačni zahtjev nepotrebnim.",
        pending: "Zahtjev je u tijeku",
        settled: "Nema zahtjeva u tijeku",
        start: "Pokreni zahtjev",
        title: "Izričiti prekid",
      },
      unmount: {
        description: "Prepustite TanStack Queryju prekid zahtjeva kada se ukloni posljednja površina koja ga koristi.",
        hide: "Ukloni rezultate",
        show: "Prikaži rezultate",
        title: "Prekid pri uklanjanju",
      },
    },
    mutations: {
      contents: {
        label: "Primjeri mutacija i osvježavanja predmemorije",
        title: "Na ovoj stranici",
      },
      pending: {
        action: {
          active: "Aktiviraj prvi zapis",
          paused: "Pauziraj prvi zapis",
        },
        description: "Onemogućite ponovljeno slanje i prikažite lokalni napredak dok je mutacija u tijeku.",
        saving: "Spremanje…",
        title: "Stanje mutacije u tijeku",
      },
      refresh: {
        description: "Odmah spremite vraćeni detalj i poništite kolekcijsku predmemoriju nakon uspješne mutacije.",
        ready: "Predmemorirani popis je ažuran",
        refreshing: "Osvježavanje predmemoriranog popisa…",
        title: "Osvježavanje povezanih podataka",
      },
    },
    pagination: {
      contents: {
        label: "Primjeri straničenja i filtriranja",
        title: "Na ovoj stranici",
      },
      filtering: {
        description:
          "Zadržite normalizirane vrijednosti filtra u ključu upita kako bi svaki skup rezultata imao stabilnu predmemoriju.",
        empty: "Nijedan zapis ne odgovara trenutačnom filtru.",
        label: "Pretraži zapise",
        title: "Filtriranje kolekcije",
      },
      key: {
        description:
          "Izgradite svaki kolekcijski ključ iz jednog korijena značajke i normaliziranih serijaliziranih filtara.",
        title: "Stabilni ključevi upita",
      },
      paging: {
        description:
          "Zadržite prethodnu stranicu vidljivom dok se učitava sljedeća kako biste izbjegli pomicanje sadržaja.",
        title: "Kretanje kroz stranice",
      },
    },
    queryStates: {
      contents: {
        label: "Primjeri stanja poslužiteljskog upita",
        title: "Na ovoj stranici",
      },
      empty: {
        description: "Uspješan prazan odgovor prikažite kao zasebno korisno stanje s jasnim sljedećim korakom.",
        message: "Još nema dostupnih zapisa.",
        title: "Prazno stanje",
      },
      error: {
        description: "Prikažite popravljive pogreške zahtjeva u sadržaju i ponudite jasnu radnju ponovnog pokušaja.",
        title: "Stanje pogreške",
      },
      loading: {
        description: "Rezervirajte područje rezultata i prikažite napredak dok se čeka prvi odgovor.",
        label: "Učitavanje zapisa",
        ready: "Prvi odgovor je spreman.",
        replay: "Ponovi učitavanje",
        title: "Stanje učitavanja",
      },
      success: {
        description: "Prikažite predmemorirane podatke s poslužitelja nakon uspješnog završetka zahtjeva.",
        title: "Uspješno stanje",
      },
    },
    shared: {
      recordMissing: "Odabrani zapis više ne postoji.",
      requestFailed: "Zapise nije moguće učitati.",
      retry: "Pokušaj ponovno",
      status: {
        active: "Aktivan",
        paused: "Pauziran",
      },
    },
  },
  routingExamples: {
    nested: {
      contents: {
        label: "Primjeri ugniježđenih ruta",
        title: "Na ovoj stranici",
      },
      layout: {
        description:
          "Zadržite zajedničke kontrole odjeljka u roditeljskoj ruti i prikažite aktivno dijete kroz Outlet.",
        title: "Zajednički ugniježđeni raspored",
      },
      preview: {
        activity: "Aktivnost",
        activityDescription: "Nedavnu aktivnost radnog prostora prikazuje aktivna podređena ruta.",
        overview: "Pregled",
        overviewDescription: "Pregled radnog prostora prikazuje aktivna podređena ruta.",
      },
      routes: {
        description:
          "Postavite podređene Routes ispod putanje registra koja završava s /* i dodajte koristan početni preusmjerivač.",
        title: "Stablo podređenih ruta",
      },
    },
    parameters: {
      breadcrumbs: {
        description:
          "Deklarirajte razrješivače navigacijskog puta i naslova uz rutu kako bi ih okvir aplikacije izveo iz istih parametara.",
        label: "Navigacijski put projekta",
        projects: "Projekti",
        title: "Navigacijski put u vlasništvu rute",
      },
      contents: {
        label: "Primjeri parametara ruta i navigacijskog puta",
        title: "Na ovoj stranici",
      },
      route: {
        current: "Parametar projekta: {{projectId}}",
        description:
          "Čitajte identitet iz dinamičkog segmenta putanje i dopustite poveznicama stvaranje valjanih izravnih URL-ova.",
        title: "Dinamički parametar rute",
      },
    },
    recovery: {
      action: {
        description: "Vratite neuspjelu granicu i zamijenite neispravnu lokaciju poznatom sigurnom podređenom rutom.",
        title: "Usmjerena radnja oporavka",
      },
      boundary: {
        description:
          "Ograničite pogreške prikaza na jedno stablo podređenih ruta kako bi okvir aplikacije ostao upotrebljiv.",
        title: "Ograničena granica rute",
      },
      contents: {
        label: "Primjeri oporavka rute",
        title: "Na ovoj stranici",
      },
      preview: {
        break: "Otvori neispravnu rutu",
        failed: "Ovu rutu nije moguće prikazati.",
        ready: "Ruta sažetka izvještaja je spremna.",
        recover: "Vrati se na sažetak",
        safe: "Otvori sažetak",
      },
    },
    searchParams: {
      contents: {
        label: "Primjeri parametara pretraživanja",
        title: "Na ovoj stranici",
      },
      filters: {
        description:
          "Spremite djeljive filtre u URL, uklonite zadane vrijednosti i vratite ovisno straničenje kada se filtri promijene.",
        queryLabel: "Pretraži projekte",
        status: {
          active: "Aktivni",
          all: "Svi",
          archived: "Arhivirani",
        },
        title: "Parametri pretraživanja kao stanje filtra",
      },
      history: {
        current: "Trenutačna stranica: {{page}}",
        description:
          "Zamijenite povijest pri prolaznom unosu i dodajte značajne promjene stranice kako bi navigacija preglednika ostala korisna.",
        title: "Namjerna povijest navigacije",
      },
    },
  },
  exampleGallery: {
    code: {
      hide: "Sakrij kod",
      language: "TSX",
      show: "Prikaži kod",
    },
    reload: "Ponovno učitaj primjer",
    source: {
      editorError:
        "Nije moguće otvoriti primjer u VSCodeu. Provjerite je li razvojni poslužitelj pokrenut i je li naredba code dostupna na njegovu računalu, zatim pokušajte ponovno.",
      openEditor: "Otvori izvorni kod primjera u VSCodeu",
      openRepository: "Otvori izvorni kod primjera u repozitoriju (nova kartica)",
      unavailable: "Izvorni kod primjera nije dostupan. Izvorni repozitorij nije postavljen.",
    },
    pageNavigation: {
      label: "Navigacija stranica obrazaca",
      next: "Sljedeće",
      previous: "Prethodno",
    },
  },
  feedback: {
    closeNotification: "Zatvori obavijest",
    confirmationExamples: {
      abortable: {
        action: "Otvori vremenski ograničenu potvrdu",
        cancel: "Ostani prijavljen",
        cancelled: "Zahtjev je otkazan ili je istekao.",
        confirm: "Nastavi sesiju",
        confirmed: "Nastavak sesije je potvrđen.",
        description:
          "Proslijedite AbortSignal kada odluka pripada ruti, sloju ili drugom životnom ciklusu koji može završiti prije nje.",
        dialogTitle: "Nastaviti ovu sesiju?",
        idle: "Još nema odluke.",
        message: "Ova se potvrda automatski zatvara nakon pet sekundi ako odluka nije donesena.",
        title: "Potvrda s mogućnošću prekida",
      },
      contents: {
        label: "Primjeri dijaloških okvira za potvrdu",
        title: "Na ovoj stranici",
      },
      destructive: {
        action: "Zatraži brisanje",
        cancel: "Zadrži projekt",
        cancelled: "Projekt je zadržan.",
        confirm: "Izbriši projekt",
        confirmed: "Brisanje projekta je potvrđeno.",
        description:
          "Označite nepovratne odluke kao destruktivne kako bi pružatelj naglasio opasnu radnju i fokusirao sigurniji odabir.",
        dialogTitle: "Izbrisati ovaj projekt?",
        idle: "Još nema odluke.",
        message: "Brisanje ovog projekta nije moguće poništiti.",
        title: "Destruktivna radnja",
      },
      standard: {
        action: "Zatraži potvrdu objave",
        cancel: "Nastavi uređivati",
        cancelled: "Promjene nisu objavljene.",
        confirm: "Objavi promjene",
        confirmed: "Objava je potvrđena.",
        description: "Zatražite jednu izričitu odluku prije značajne radnje, a zatim obradite diskriminirani rezultat.",
        dialogTitle: "Objaviti ove promjene?",
        idle: "Još nema odluke.",
        message: "Objava čini najnovije promjene dostupnima svima.",
        title: "Standardna potvrda",
      },
    },
    examples: {
      action: {
        action: "Prikaži obavijest s radnjom",
        description:
          "Ponudite jednu kratku radnju oporavka. Obavijesti s radnjama ostaju otvorene dok se ne obrade ili zatvore.",
        message: "Primjer stavke je arhiviran.",
        title: "Obavijest s radnjom",
        undo: "Poništi",
        undoneMessage: "Primjer stavke je vraćen.",
      },
      contents: {
        label: "Primjeri skočnih obavijesti",
        title: "Na ovoj stranici",
      },
      error: {
        action: "Prikaži pogrešku",
        description: "Prijavite neuspjelu dovršenu radnju kada ne postoji prikladnije lokalno mjesto za oporavak.",
        message: "Primjer radnje nije moguće dovršiti.",
        title: "Obavijest o pogrešci",
      },
      persistent: {
        action: "Prikaži trajno upozorenje",
        description: "Zadržite važne informacije vidljivima dok ih korisnik ne potvrdi ili ih aplikacija ne zatvori.",
        dismiss: "Zatvori upozorenje",
        message: "Planirano održavanje uskoro počinje.",
        title: "Trajno upozorenje",
      },
      position: {
        action: "Prikaži pozicioniranu obavijest",
        bottomCenter: "Dolje u sredini",
        bottomLeft: "Dolje lijevo",
        bottomRight: "Dolje desno",
        description:
          "Postavite mjesto obavijesti na aplikacijskom pružatelju povratnih informacija kako biste odabrali gdje se prikazuju sve obavijesti.",
        label: "Položaj obavijesti",
        message: "Ova obavijest koristi odabrani položaj.",
        title: "Položaj obavijesti",
        topCenter: "Gore u sredini",
        topLeft: "Gore lijevo",
        topRight: "Gore desno",
      },
      replacement: {
        description:
          "Ponovno upotrijebite identifikator pozivatelja kako biste ažurirali vidljivu obavijest umjesto gomilanja duplikata.",
        initialAction: "Pokreni sinkronizaciju",
        initialMessage: "Sinkronizacija je pokrenuta.",
        title: "Zamjena stabilnim identifikatorom",
        updatedAction: "Dovrši sinkronizaciju",
        updatedMessage: "Sinkronizacija je dovršena.",
      },
      success: {
        action: "Prikaži uspjeh",
        description:
          "Potvrdite da je radnja na razini aplikacije uspješno dovršena. Automatski se zatvara nakon pet sekundi.",
        message: "Primjer radnje je dovršen.",
        title: "Obavijest o uspjehu",
      },
    },
  },
  overlayExamples: {
    close: "Zatvori sloj",
    complete: "Gotovo",
    error: "Sloj nije moguće otvoriti.",
    lifecycle: {
      busy: {
        action: "Otvori uređivač sa spremanjem",
        description:
          "Označite okvir zauzetim tijekom rada kako biste onemogućili uobičajeno zatvaranje i spriječili zamjenu.",
        idleMessage: "Pokrenite simulirano spremanje i pregledajte onemogućenu radnju zatvaranja.",
        overlayTitle: "Uredi projekt",
        save: "Simuliraj spremanje",
        savedMessage: "Spremanje je završilo. Sloj se ponovno može zatvoriti.",
        saving: "Spremanje…",
        savingMessage: "Spremanje je u tijeku. Zatvaranje je privremeno blokirano.",
        title: "Blokiranje zatvaranja tijekom rada",
      },
      closeAll: {
        approved: "Svi slojevi su zatvoreni. Navigacija se može nastaviti.",
        description: "Zatražite od vlasnika slojeva stranice da zatvori sve korijenske slojeve prije promjene rute.",
        idle: "Otvorite panel prije zahtjeva za napuštanje stranice.",
        leaveAction: "Zatraži napuštanje stranice",
        message: "Ovaj panel stranice zatvara se kao dio koordiniranog zahtjeva za napuštanje.",
        openAction: "Otvori panel stranice",
        overlayTitle: "Kontekst projekta",
        title: "Zatvaranje slojeva prije napuštanja stranice",
      },
      contents: {
        label: "Primjeri zaštite i životnog ciklusa slojeva",
        title: "Na ovoj stranici",
      },
      guard: {
        action: "Otvori zaštićeni uređivač",
        confirmMessage: "Odbaciti nespremljeni naziv projekta?",
        confirmTitle: "Odbaciti promjene?",
        description:
          "Upotrijebite zaštitu zatvaranja s prekinjivom potvrdom kada bi zatvaranje odbacilo nespremljeni rad.",
        discard: "Odbaci promjene",
        fieldLabel: "Naziv projekta",
        initialName: "Obnova luke",
        keepEditing: "Nastavi uređivati",
        overlayTitle: "Uredi projekt",
        save: "Spremi",
        title: "Potvrda nespremljenih promjena",
      },
      reasons: {
        description:
          "Obradite razloge otkazivanja kada daljnje ponašanje ovisi o zatvaranju, zamjeni ili životnom ciklusu rute.",
        firstMessage: "Zamijenite ovaj panel kako bi njegov upravljač vratio razlog zamjene.",
        firstTitle: "Izvorni detalji projekta",
        idle: "Još nema razloga otkazivanja.",
        openAction: "Otvori izvorni panel",
        replaceAction: "Zamijeni panel",
        replacementMessage: "Ovaj je panel zamijenio prethodni panel stranice.",
        replacementTitle: "Zamjenski detalji projekta",
        result: "Razlog otkazivanja: {{reason}}",
        title: "Obrada razloga otkazivanja",
      },
    },
    presentations: {
      contents: {
        label: "Primjeri prikaza slojeva",
        title: "Na ovoj stranici",
      },
      dialog: {
        action: "Otvori dijaloški okvir",
        description:
          "Na računalu središnji dijaloški okvir služi za usmjerenu odluku ili kratak zadatak. Na mobilnom uređaju otvara se kao donja ladica.",
        message: "Sloj usmjerava pažnju na jedan sažet zadatak i zadržava stranicu u pozadini.",
        overlayTitle: "Pregledaj promjene",
        title: "Središnji dijaloški okvir",
      },
      docked: {
        action: "Otvori usidreni panel",
        description:
          "Na računalu usidreni panel drži pomoćni rad uz stranicu. Na mobilnom uređaju otvara se kao donja ladica.",
        message:
          "Na računalu usidreni paneli zauzimaju širinu radnog prostora i mogu mijenjati veličinu bez blokiranja stranice.",
        overlayTitle: "Detalji projekta",
        title: "Usidreni panel",
      },
      modalPanel: {
        action: "Otvori modalni panel",
        description:
          "Na računalu modalni bočni panel služi za dulji zadatak. Na mobilnom uređaju otvara se kao donja ladica.",
        message: "Modalni slojevi moraju se zatvoriti prije nastavka rada na stranici.",
        overlayTitle: "Uredi filtre",
        title: "Modalni bočni panel",
      },
    },
    results: {
      contents: {
        label: "Primjeri rezultata i kompozicije slojeva",
        title: "Na ovoj stranici",
      },
      nested: {
        action: "Otvori uređivač projekta",
        childAction: "Odaberi kupca",
        childChoose: "Potvrdi kupca",
        childMessage: "Odaberite kupca povezanog s ovim projektom.",
        childTitle: "Odabir kupca",
        customer: "Northwind Shipping",
        description:
          "Otvorite podređeni sloj iz aktivnog nadređenog sloja i obradite njegov rezultat bez povezivanja komponenti sa stranicom.",
        message: "Uređivač projekta ostaje otvoren dok je odabir kupca prikazan iznad njega.",
        noneSelected: "Kupac nije odabran.",
        overlayTitle: "Uredi projekt",
        selectedLabel: "Odabrani kupac",
        title: "Ugniježđeni slojevi",
      },
      outcomes: {
        action: "Otvori uređivač skice",
        cancel: "Odustani",
        cancelled: "Otkazano: {{reason}}",
        complete: "Spremi skicu",
        completed: "Sloj je dovršen sa spremljenim rezultatom.",
        description:
          "Obradite diskriminirani rezultat kako bi uspješno dovršenje i uobičajeno otkazivanje ostali izričiti.",
        idle: "Još nema rezultata.",
        message: "Spremite kako biste dovršili sloj ili odustanite kako biste pregledali rezultat otkazivanja.",
        overlayTitle: "Uredi skicu",
        title: "Dovršenje i otkazivanje",
      },
      typed: {
        action: "Odaberi projekt",
        cancelled: "Odabir projekta je otkazan.",
        choose: "Potvrdi projekt",
        completed: "Odabrano: {{name}} ({{id}}).",
        description:
          "Proslijedite tipizirana svojstva sadržaju sloja i primite njegovu tipiziranu dovršenu vrijednost kroz vraćeni upravljač.",
        idle: "Još nema dovršenog odabira.",
        message: "Projekt koji je proslijedila stranica: {{project}}.",
        overlayTitle: "Odabir projekta",
        projectName: "Obnova luke",
        title: "Tipizirani ulaz i rezultat",
      },
      updates: {
        description:
          "Zadržite upravljač kada stranica mora osvježiti svoja svojstva bez zatvaranja i ponovnog otvaranja aktivnog sloja.",
        message: "Stranica upravlja vrijednošću revizije i može je ažurirati dok je ovaj panel otvoren.",
        openAction: "Otvori detalje projekta",
        overlayTitle: "Detalji projekta",
        revisionLabel: "Revizija",
        title: "Ažuriranje aktivnog sloja",
        updateAction: "Pošalji sljedeću reviziju",
      },
    },
    resize: "Promijeni veličinu sloja",
  },
  navigation: {
    architecture: "Arhitektura",
    developmentGuide: "Vodič za razvoj",
    frontend: "Frontend",
    backend: "Backend",
    examplePages: "Primjeri stranica",
    contactsCrud: "Kontakti CRUD",
    i18n: "i18n",
    contactsDashboard: "Nadzorna ploča kontakata",
    formsAsyncLookups: "Asinkrono dohvaćanje opcija",
    formsRepeatedAndNestedFields: "Ponavljajuća i ugniježđena polja",
    serverDataOptimisticUpdatesAndRollback: "Optimistične izmjene i povrat stanja",

    stateCategory: "Aplikacijsko stanje",
    applicationState: "Signals",
    applicationStateEffectsAndCleanup: "Efekti i čišćenje",
    applicationStatePersistentState: "Trajno stanje",
    applicationStateSharingBetweenRoutes: "Dijeljeno stanje ruta",
    applicationStateSourceAndComputedSignals: "Izvorne i izračunate vrijednosti",
    serverData: "Poslužiteljski podaci",
    serverDataMutationsAndRefresh: "Mutacije i osvježavanje",
    serverDataPaginationAndFiltering: "Straničenje i filtri",
    serverDataQueryStates: "Stanja upita",
    serverDataRequestCancellation: "Prekid zahtjeva",
    routingAndUrlState: "Usmjeravanje i URL-ovi",
    routingNestedRoutes: "Ugniježđene rute",
    routingRouteParametersAndBreadcrumbs: "Parametri ruta i navigacijski put",
    routingRouteRecovery: "Oporavak rute",
    routingSearchParameters: "Parametri pretraživanja",
    routingProject: "Projekt {{projectId}}",
    breadcrumbs: "Navigacijski put",
    onThisPage: "Na ovoj stranici",
    closeNavigation: "Zatvori navigaciju",
    collapseCategory: "Sažmi {{category}}",
    confirmationDialogs: "Dijaloški okviri za potvrdu",
    contacts: "Kontakti",
    examples: "Obrasci",
    expandCategory: "Proširi {{category}}",
    feedback: "Povratne informacije",
    forms: "Obrasci unosa",
    formsAsyncSubmissionAndServerErrors: "Slanje i pogreške poslužitelja",
    formsDependentFields: "Ovisna polja",
    formsDirtyStateAndNavigationGuard: "Nespremljene promjene",
    formsValidationAndErrorPresentation: "Validacija i pogreške",
    tablesAndCollections: "Tablice i kolekcije",
    tablesLoadingEmptyAndErrorPresentation: "Učitavanje, prazno stanje i pogreške",
    tablesRowSelectionAndBulkActions: "Odabir i skupne radnje",
    tablesSortingAndPagination: "Sortiranje i straničenje",
    tablesUrlBackedFilters: "URL filtri",
    goToContent: "Preskoči na sadržaj",
    goHome: "Idi na početnu stranicu",
    home: "Početna",
    menu: "Otvori navigaciju",
    moreNavigation: "Više navigacije",
    notFound: "Stranica nije pronađena",
    overlayGuardsAndLifecycle: "Zaštita i životni ciklus",
    overlayPresentations: "Načini prikaza",
    overlayResultsAndComposition: "Rezultati i kompozicija",
    overlays: "Slojevi",
    localizationAndFormatting: "i18n",
    localizationDatesAndTimes: "Datumi i vremena",
    localizationInterpolationAndPlurals: "Interpolacija i množina",
    localizationNumbersPercentagesAndCurrencies: "Formati brojeva",
    localizedMuiControls: "Lokalizirane MUI kontrole",
    primary: "Glavna navigacija",
    retry: "Pokušaj ponovno",
    routeError: "Ovaj dio aplikacije nije moguće prikazati.",
    scrollToTop: "Pomakni se na vrh",
    settings: "Postavke",
    toastNotifications: "Skočne obavijesti",
    shellDescription: "Lokalizirana i pristupačna ljuska aplikacije.",
    shellTitle: "RGO aplikacija",
    loading: "Učitavanje stranice…",
    switchToDarkMode: "Prebaci na tamni način prikaza",
    switchToLightMode: "Prebaci na svijetli način prikaza",
  },
  contacts: {
    actions: {
      delete: "Izbriši {{name}}",
      edit: "Uredi {{name}}",
      more: "Više radnji za kontakt {{name}}",
    },
    create: "Dodaj kontakt",
    dashboard: {
      description: "Pregledajte strukturu imenika kontakata i odmah nastavite s radom koji zahtijeva pažnju.",
      directory: {
        description: "Brzi pregled osoba koje se trenutačno nalaze u imeniku.",
        title: "Pregled imenika",
      },
      empty: {
        action: "Dodaj prvi kontakt",
        description: "Stvorite prvi kontakt kako biste ispunili ovu nadzornu ploču korisnim podacima o imeniku.",
        title: "Vaš imenik kontakata je spreman",
      },
      eyebrow: "Pregled radnog prostora",
      loadFailed: "Nadzornu ploču kontakata nije moguće učitati.",
      loading: "Učitavanje nadzorne ploče kontakata…",
      metrics: {
        active: "Aktivni kontakti",
        inactive: "Neaktivni kontakti",
        organizations: "Organizacije",
        total: "Ukupno kontakata",
      },
      open: "Otvori kontakte",
      organizations: {
        count_one: "{{count}} kontakt",
        count_few: "{{count}} kontakta",
        count_other: "{{count}} kontakata",
        description: "Raspodjela kontakata po organizacijama.",
        title: "Pregled organizacija",
      },
      retry: "Pokušaj ponovno",
      status: {
        description: "Trenutačni omjer statusa u vašem imeniku.",
        title: "Raspodjela statusa",
        value: "{{count}} · {{percentage}}%",
      },
      title: "Vaši kontakti na jednom mjestu",
    },
    bulk: {
      actions: "Radnje",
      changeStatus: "Promijeni status",
      clearSelection: "Poništi",
      delete: {
        action: "Izbriši",
        cancel: "Zadrži kontakte",
        confirm: "Izbriši kontakte: {{count}}",
        failed: "Odabrane kontakte nije moguće izbrisati.",
        message: "Izbrisati {{count}} odabranih kontakata? Ovu radnju nije moguće poništiti.",
        success: "Izbrisano je kontakata: {{count}}.",
        title: "Izbrisati odabrane kontakte?",
      },
      selected: "Odabrano: {{count}}",
      setActive: "Postavi aktivnima",
      setInactive: "Postavi neaktivnima",
      statusFailed: "Odabrane kontakte nije moguće ažurirati.",
      statusSuccess: "Ažurirano je kontakata: {{count}}. Novi status: {{status}}.",
    },
    delete: {
      cancel: "Zadrži kontakt",
      confirm: "Izbriši kontakt",
      failed: "Kontakt {{name}} nije moguće izbrisati.",
      message: "Izbrisati kontakt {{name}}? Ovu radnju nije moguće poništiti.",
      success: "Kontakt {{name}} je izbrisan.",
      title: "Izbrisati kontakt?",
    },
    details: {
      edit: "Uredi kontakt",
      loadFailed: "Detalje kontakta nije moguće učitati.",
      loading: "Učitavanje detalja kontakta…",
      open: "Otvori detalje kontakta {{name}}",
      retry: "Pokušaj ponovno",
      title: "Detalji kontakta",
      unavailable: "Ovaj kontakt više nije dostupan.",
    },
    fields: {
      email: "E-pošta",
      name: "Ime i prezime",
      organization: "Organizacija",
      role: "Uloga",
      status: "Status",
    },
    form: {
      createAction: "Stvori kontakt",
      createTitle: "Novi kontakt",
      editTitle: "Uredi kontakt",
      updateAction: "Spremi promjene",
    },
    filters: {
      action: "Filtri",
      clear: "Očisti filtre",
      clearSearch: "Očisti pretraživanje",
      search: "Pretraži kontakte",
      searchPlaceholder: "Ime, e-pošta, organizacija ili uloga",
      status: {
        ACTIVE: "Samo aktivni",
        all: "Svi statusi",
        INACTIVE: "Samo neaktivni",
      },
      title: "Filtri",
    },
    overlay: {
      close: "Zatvori ploču kontakata",
      discard: "Odbaci promjene",
      discardTitle: "Odbaciti nespremljene promjene kontakta?",
      discardMessage: "Nespremljene promjene kontakta bit će izgubljene.",
      error: "Ploču kontakata nije moguće otvoriti.",
      keepEditing: "Nastavi uređivati",
      resize: "Promijeni veličinu ploče kontakata",
    },
    pagination: {
      displayed: "{{from}}–{{to}} od {{count}}",
      first: "Idi na prvu stranicu",
      last: "Idi na zadnju stranicu",
      next: "Idi na sljedeću stranicu",
      previous: "Idi na prethodnu stranicu",
      rowsPerPage: "Kontakata po stranici",
    },
    save: {
      conflict:
        "Ovaj kontakt promijenjen je dok ste ga uređivali. Kopirajte svoje izmjene, zatvorite uređivač pa ponovno otvorite kontakt kako biste ih primijenili na najnoviju verziju.",
      created: "Kontakt je stvoren.",
      failed: "Kontakt nije moguće spremiti.",
      updated: "Kontakt je ažuriran.",
    },
    selection: {
      select: "Odaberi kontakt {{name}}",
      selectAll: "Odaberi sve filtrirane kontakte",
    },
    status: {
      ACTIVE: "Aktivan",
      INACTIVE: "Neaktivan",
    },
    table: {
      createFirst: "Stvori prvi kontakt",
      actions: "Radnje",
      count: "Kontakata: {{count}}",
      empty: "Još nema kontakata. Dodajte prvi kontakt za početak.",
      filteredCount: "Kontakata: {{count}} od {{total}}",
      label: "Kontakti",
      loadFailed: "Kontakte nije moguće učitati.",
      loading: "Učitavanje kontakata…",
      noMatches: "Nijedan kontakt ne odgovara trenutačnim filtrima.",
      retry: "Pokušaj ponovno",
      scrollHint: "Prijeđite prstom za više stupaca",
    },
    validation: {
      emailInvalid: "Unesite valjanu adresu e-pošte.",
      emailRequired: "E-pošta je obavezna.",
      nameMax: "Ime smije imati najviše {{max}} znakova.",
      nameRequired: "Ime je obavezno.",
      organizationMax: "Organizacija smije imati najviše {{max}} znakova.",
      organizationRequired: "Organizacija je obavezna.",
      roleMax: "Uloga smije imati najviše {{max}} znakova.",
      roleRequired: "Uloga je obavezna.",
    },
  },
  projects: {
    collection: {
      empty: "Još nema projekata.",
      loadFailed: "Projekte nije moguće učitati.",
      loading: "Učitavanje projekata…",
    },
    create: "Stvori projekt",
    createFailed: "Projekt nije moguće stvoriti.",
    detail: {
      label: "Trenutačni projekt: {{name}}",
      loadFailed: "Projekt nije moguće učitati.",
      loading: "Učitavanje projekta…",
      retry: "Pokušaj ponovno",
    },
    name: "Naziv projekta",
    update: "Ažuriraj projekt",
    updateFailed: "Projekt nije moguće ažurirati.",
    validation: {
      nameMax: "Naziv projekta smije imati najviše {{max}} znakova.",
      nameRequired: "Naziv projekta je obavezan.",
    },
  },
  formatting: {
    dateTime: "Datum i vrijeme",
    price: "Cijena",
    timezone: "Vremenska zona: {{timezone}}",
  },
  locale: {
    active: "Aktivni jezik: {{locale}}",
    choose: "Odaberite jezik",
    configurationTitle: "Konfiguracija jezika",
    document: "Jezik i smjer dokumenta prate aktivni jezik.",
    fallback: "Zadani jezik: {{locale}}",
    resolved: "Odabrani jezik: {{locale}}",
    resolutionDescription: "Izričita postavka u lokalnoj pohrani, podržana postavka preglednika, zatim engleski jezik.",
  },
  formsExamples: {
    repeated: {
      contents: {
        label: "Primjeri ponavljanih i ugniježđenih polja",
        title: "Ponavljana i ugniježđena polja",
      },
      lineItems: {
        title: "Uređivanje stavki",
        description:
          "Dodajte i uklonite retke sa stabilnim identitetima i indeksiranim putanjama polja. Ugniježđena validacija ostaje uz pripadajući redak, a prihvaćanje cijelog obrasca postavlja polazište za vraćanje. Uklonite sve retke kako biste vidjeli pravilo o najmanje jednoj stavci.",
      },
      defaultItem: "Pregled dizajna",
      row: "Stavka {{number}}",
      fields: {
        description: "Opis",
        quantity: "Količina",
        unitPrice: "Jedinična cijena (EUR)",
      },
      errors: {
        descriptionRequired: "Unesite opis stavke.",
        quantityInvalid: "Unesite cijelu količinu veću od nule.",
        priceInvalid: "Unesite cijenu koja je nula ili veća.",
        itemRequired: "Dodajte barem jednu stavku prije prihvaćanja.",
      },
      removeRow: "Ukloni stavku {{number}}",
      remove: "Ukloni stavku",
      add: "Dodaj stavku",
      total: "Ukupno: {{total}}",
      reset: "Vrati na prihvaćeno stanje",
      submit: "Prihvati stavke",
      accepted: "Prihvaćene stavke",
      acceptedItem: "{{description}}: {{quantity}} × {{price}}",
    },
    asyncLookups: {
      contents: {
        label: "Primjeri asinkronog pretraživanja",
        title: "Na ovoj stranici",
      },
      search: {
        title: "Automatsko dovršavanje uz pretraživanje",
        description:
          "Tekst pretraživanja odvojen je od odabrane osobe. Upit prikazuje učitavanje, rezultate i prazno stanje; unesite ime ili izraz poput zzz. Odabrana osoba ostaje valjana i kada je novo pretraživanje ne pronađe.",
      },
      dependent: {
        title: "Ovisno pretraživanje zaduženih osoba",
        description:
          "Promjena odjela odmah briše nevažeću zaduženu osobu. Odjel i tekst pretraživanja određuju upit, a zastarjeli se zahtjevi prekidaju. Pretraživanje unutar istog odjela zadržava odabir. Slanje provjerava cijelo zaduženje.",
      },
      error: {
        title: "Neuspjelo pretraživanje i ponovni pokušaj",
        description:
          "Prvi dovršeni zahtjev namjerno ne uspijeva. Ponovni pokušaj učitava isti upit, a ponovno učitavanje primjera vraća početnu pogrešku. Promjena pretraživanja ili napuštanje primjera prekida zastarjele zahtjeve.",
      },
      person: "Pretraživanje osoba",
      assignee: "Pretraživanje zaduženih osoba",
      department: "Odjel",
      clear: "Očisti odabir",
      open: "Otvori prijedloge",
      close: "Zatvori prijedloge",
      loading: "Učitavanje osoba…",
      empty: "Nijedna osoba ne odgovara pretraživanju.",
      results_one: "{{count}} pronađena osoba",
      results_few: "{{count}} pronađene osobe",
      results_other: "{{count}} pronađenih osoba",
      failed: "Pretraživanje nije uspjelo. Pokušajte ponovno učitati osobe.",
      retry: "Ponovi pretraživanje",
      selection: "Odabrana osoba: {{name}}",
      none: "Nema odabira",
      submit: "Provjeri zaduženje",
      accepted: "Prihvaćena zadužena osoba: {{id}}",
      invalidAssignee: "Odaberite zaduženu osobu iz odabranog odjela.",
    },
    async: {
      contents: {
        label: "Primjeri asinkronog slanja obrazaca",
        title: "Na ovoj stranici",
      },
      defaults: {
        existingName: "Postojeći radni prostor",
        newName: "Novi radni prostor",
      },
      errors: {
        nameRequired: "Naziv radnog prostora je obvezan.",
        slugFormat: "Koristite mala slova, brojeve i crtice.",
        slugRequired: "Oznaka radnog prostora je obvezna.",
      },
      fields: {
        name: "Naziv radnog prostora",
        slug: "Oznaka radnog prostora",
      },
      pending: {
        description:
          "Pričekajte mutaciju unutar onSubmit kako bi obrazac onemogućio dvostruko slanje i izložio jedan životni ciklus čekanja.",
        title: "Slanje u tijeku",
      },
      reset: {
        description:
          "Nakon uspješne mutacije vratite obrazac na izričitu prihvaćenu početnu vrijednost umjesto brisanja polja prije odgovora poslužitelja.",
        title: "Vraćanje nakon uspjeha",
      },
      saved: "Radni prostor je spremljen.",
      serverErrors: {
        conflict: "Ta oznaka radnog prostora već se koristi.",
        description:
          "Poznate pogreške API-ja prevedite izričito i zadržite poslane vrijednosti dostupnima za ispravak.",
        hint: "Upotrijebite „existing” za sukob ili „offline” za nedostupnu uslugu.",
        title: "Tipizirane pogreške poslužitelja",
        unavailable: "Usluga radnog prostora nije dostupna. Pokušajte ponovno.",
      },
      submit: "Spremi radni prostor",
    },
    dependent: {
      conditional: {
        description:
          "Prikažite detalje iznimke samo kada su potrebni i izbrišite zastarjelu vrijednost kada zahtjev ponovno postane standardan.",
        standardHint: "Standardni zahtjevi ne trebaju razlog iznimke.",
        submit: "Provjeri zahtjev",
        title: "Uvjetno polje",
        valid: "Zahtjev je valjan.",
      },
      contents: {
        label: "Primjeri ovisnih polja",
        title: "Na ovoj stranici",
      },
      department: {
        description: "Sinkrono uklonite izvršitelja kada promjena odjela učini taj odabir nevažećim.",
        hint: "Odaberite izvršitelja, zatim promijenite odjel kako biste vidjeli brisanje zastarjele vrijednosti.",
        title: "Ovisne mogućnosti",
      },
      departments: {
        engineering: "Inženjering",
        operations: "Operacije",
      },
      errors: {
        assigneeInvalid: "Odaberite izvršitelja iz odabranog odjela.",
        assigneeRequired: "Odaberite izvršitelja.",
        departmentRequired: "Odaberite odjel.",
        reasonRequired: "Objasnite zašto ovaj zahtjev treba iznimku.",
      },
      fields: {
        assignee: "Izvršitelj",
        chooseAssignee: "Odaberite izvršitelja",
        department: "Odjel",
        reason: "Razlog iznimke",
        requestType: "Vrsta zahtjeva",
      },
      requestTypes: {
        exception: "Iznimka",
        standard: "Standardni",
      },
      summary: {
        description:
          "Izvedite sučelje samo za čitanje iz potpune vrijednosti obrasca i iste sheme koja se koristi pri slanju.",
        incomplete: "Dovršite obvezne odabire.",
        ready: "Dodjela je valjana i spremna za slanje.",
        submit: "Pošalji dodjelu",
        submitted: "Dodjela je poslana.",
        title: "Izvedeni valjani sažetak",
      },
    },
    dirty: {
      actions: {
        description: "Zanemarite radnje na istoj putanji i zaštitite stvarni prijelaz na susjednu rutu Obrazaca.",
        samePage: "Osvježi ovaj prikaz",
        sibling: "Otvori ovisna polja",
        title: "Zaštita stvarne navigacije",
      },
      contents: {
        label: "Primjeri nespremljenih obrazaca i zaštite navigacije",
        title: "Na ovoj stranici",
      },
      defaultTitle: "Tromjesečno izvješće",
      errors: {
        titleRequired: "Naslov nacrta je obvezan.",
      },
      fields: {
        title: "Naslov nacrta",
      },
      guard: {
        description:
          "Blokirajte prijelaze ruta dok obrazac ima nespremljene promjene i razriješite jednu prekinjivu potvrdu prije nastavka ili vraćanja.",
        dialogTitle: "Odbaciti nespremljene promjene?",
        instructions: "Promijenite naslov, zatim otvorite susjednu rutu kako biste pokrenuli zaštitu navigacije.",
        keepEditing: "Nastavi uređivati",
        leave: "Odbaci i napusti",
        message: "Nespremljene promjene nacrta bit će izgubljene.",
        title: "Zaštita navigacije",
      },
      reset: {
        action: "Vrati promjene",
        description:
          "Vraćanje obnavlja prihvaćenu početnu vrijednost; uspješno spremanje zamjenjuje je provjerenom vrijednošću.",
        save: "Prihvati kao početnu vrijednost",
        saved: "Spremljena vrijednost sada je početna vrijednost za vraćanje.",
        title: "Vraćanje na prihvaćene vrijednosti",
      },
    },
    validation: {
      contents: {
        label: "Primjeri validacije i prikaza pogrešaka",
        title: "Na ovoj stranici",
      },
      crossField: {
        description:
          "Postavite pogrešku više polja na polje koje korisnik mora ispraviti kako bi se prikazala uz potvrdu.",
        title: "Pogreška između polja",
      },
      errors: {
        emailInvalid: "Unesite valjanu adresu e-pošte.",
        emailMismatch: "Adrese e-pošte moraju se podudarati.",
        emailRequired: "Adresa e-pošte je obvezna.",
        nameRequired: "Ime je obvezno.",
      },
      fields: {
        confirmEmail: "Potvrda e-pošte",
        email: "Poslovna e-pošta",
        name: "Ime",
      },
      localized: {
        description:
          "Izradite Zod shemu iz funkcije za prijevod kako bi svaka poruka validacije pratila aktivni jezik.",
        title: "Lokalizirana Zod shema",
      },
      submit: "Provjeri profil",
      success: "Vrijednosti profila su valjane.",
      timing: {
        description:
          "Validirajte pri prvom slanju, a zatim ponovno validirajte promijenjena polja dok ih korisnik ispravlja.",
        title: "Validacija prvo pri slanju",
      },
    },
  },
  tablesExamples: {
    selection: {
      activation: {
        active: "Aktivan redak: {{name}}",
        description:
          "Koristite kontroliranu aktivaciju za jedan glavni zapis, odvojeno od odabira potvrdnim okvirima i unutarnjih radnji.",
        label: "Otvori {{name}}",
        none: "Nema aktivnog retka.",
        title: "Aktivacija retka",
      },
      bulk: {
        action: "Arhiviraj odabrano ({{count}})",
        description:
          "Razriješite odabrane zapise u aplikaciji, onemogućite nedostupne naredbe i očistite odabir nakon uspjeha.",
        title: "Skupna radnja",
      },
      contents: {
        label: "Primjeri odabira redaka i skupnih radnji",
        title: "Na ovoj stranici",
      },
      multi: {
        column: "Odaberi retke",
        count: "Odabrano redaka: {{count}}",
        description:
          "Čuvajte odabir potvrdnim okvirima u stanju aplikacije kako bi ostao odvojen od aktivacije retka i upravljao skupnim naredbama.",
        select: "Odaberi {{name}}",
        selectAll: "Odaberi sve vidljive retke",
        title: "Višestruki odabir",
      },
    },
    shared: {
      columns: {
        name: "Projekt",
        owner: "Vlasnik",
        status: "Status",
      },
      empty: "Nijedan projekt ne odgovara trenutačnom prikazu.",
      loading: "Učitavanje projekata…",
      loadingLabel: "Učitavanje projekata",
      pagination: {
        displayed: "{{from}}–{{to}} od {{count}}",
        first: "Idi na prvu stranicu",
        last: "Idi na zadnju stranicu",
        next: "Idi na sljedeću stranicu",
        previous: "Idi na prethodnu stranicu",
        rowsPerPage: "Projekata po stranici",
      },
      status: {
        active: "Aktivan",
        all: "Svi statusi",
        paused: "Pauziran",
        review: "Na pregledu",
      },
      tableLabel: "Kolekcija projekata",
    },
    sorting: {
      contents: {
        label: "Primjeri sortiranja i straničenja",
        title: "Na ovoj stranici",
      },
      local: {
        description: "Navedite lokalne usporednike kada je cijela kolekcija već dostupna u pregledniku.",
        title: "Lokalno sortiranje",
      },
      pagination: {
        description:
          "Uključite lokalno straničenje za ograničenu kolekciju i lokalizirajte svaku vidljivu i pristupačnu oznaku.",
        title: "Lokalno straničenje",
      },
      server: {
        description:
          "Kontrolirajte cijelo stanje tablice i povežite stupce za sortiranje s dopuštenim poljima poslužitelja.",
        title: "Kontrolirano stanje poslužitelja",
      },
    },
    states: {
      contents: {
        label: "Primjeri stanja tabličnih upita",
        title: "Na ovoj stranici",
      },
      empty: {
        create: "Stvori prvi projekt",
        message: "Još nema projekata. Stvorite prvi projekt za početak.",
        description:
          "Centrirajte prazan rezultat u tijelu tablice i ponudite primarnu radnju za stvaranje prvog zapisa.",
        title: "Uspješan prazan rezultat",
      },
      error: {
        description:
          "Upravljajte oporavljivim pogreškama zahtjeva izvan tablice i ponudite ponovni pokušaj uz zadržavanje prethodnih redaka.",
        message: "Osvježavanje nije uspjelo; prikazani su zadnji podaci.",
        retry: "Pokušaj ponovno",
        title: "Oporavljiva pogreška",
      },
      initial: {
        description: "Koristite redak učitavanja tablice dok još nema uspješno dohvaćene kolekcije.",
        title: "Početno učitavanje",
      },
      refresh: {
        description:
          "Zadržite posljednje uspješne retke tijekom pozadinskog osvježavanja kako kolekcija ne bi nestala.",
        title: "Osvježavanje uz zadržane retke",
      },
    },
    url: {
      contents: {
        label: "Primjeri tablica sa stanjem u URL-u",
        title: "Na ovoj stranici",
      },
      filters: {
        description:
          "Raščlanite samo dopuštene vrijednosti, izostavite zadane vrijednosti pri serijalizaciji i vratite stranicu pri promjeni filtra.",
        empty: "Nijedan projekt ne odgovara ovim filtrima.",
        query: "Pretraži projekte",
        status: "Status",
        title: "Kanonski filtri URL-a",
      },
      table: {
        description:
          "Pretvorite stranicu URL-a s bazom jedan u stanje tablice s bazom nula te omogućite dijeljenje sortiranja i straničenja.",
        title: "Kontrolirano stanje tablice u URL-u",
      },
    },
  },
  localizationExamples: {
    dates: {
      contents: {
        label: "Primjeri oblikovanja datuma i vremena",
        title: "Na ovoj stranici",
      },
      date: {
        description: "Oblikujte kalendarski datum aktivnim jezikom aplikacije i izričitom vremenskom zonom.",
        title: "Lokalizirani datum",
      },
      dateTime: {
        description: "Zadržite isti trenutak i odaberite vremensku zonu koja određuje prikazani datum i vrijeme.",
        timeZoneLabel: "Vremenska zona",
        title: "Datum i vrijeme u vremenskoj zoni",
      },
      fixedInstant: "Fiksni trenutak: 24. rujna 2026. u 14:30 UTC",
      time: {
        description: "Oblikujte vrijeme prema lokalnom ciklusu sata i interpunkciji umjesto ručnog sastavljanja.",
        title: "Lokalizirano vrijeme",
      },
      applicationTimeZone: "{{timeZone}}",
    },
    interpolation: {
      contents: {
        label: "Primjeri interpolacije i množine",
        title: "Na ovoj stranici",
      },
      multiple: {
        actor: "Marta",
        description:
          "Proslijedite svaku dinamičku vrijednost po nazivu kako bi prevoditelji mogli sigurno promijeniti redoslijed rečenice.",
        message: "{{actor}} je dodala bilješku projektu {{project}}.",
        project: "Obnova luke",
        title: "Više imenovanih vrijednosti",
      },
      named: {
        description:
          "Umetnite imenovanu vrijednost kroz poziv prijevoda i zadržite strukturu rečenice u jezičnom resursu.",
        fallbackName: "korisniče",
        initialName: "Marta",
        message: "Dobro došli, {{name}}!",
        nameLabel: "Ime",
        title: "Imenovana interpolacija",
      },
      plural: {
        decrease: "Smanji broj stavki",
        description:
          "Proslijedite broj kao count i prepustite i18nextu odabir odgovarajućeg oblika množine za aktivni jezik.",
        increase: "Povećaj broj stavki",
        message_one: "Odabrana je {{count}} stavka",
        message_few: "Odabrane su {{count}} stavke",
        message_other: "Odabrano je {{count}} stavki",
        reset: "Vrati",
        title: "Kardinalna množina",
      },
    },
    mui: {
      autocomplete: {
        description:
          "Upišite vrijednost koje nema na popisu kako biste vidjeli tekst praznog stanja iz teme na aktivnom jeziku.",
        firstProject: "Obnova luke",
        label: "Projekt",
        secondProject: "Modernizacija kolodvora",
        thirdProject: "Riječni nasip",
        title: "Prazno stanje automatskog dovršavanja",
      },
      bridge: {
        active: "Aktivni MUI jezik: {{locale}}",
        description:
          "Ugradite MUI jezične postavke u jedinu aplikacijsku temu kako bi sve osnovne kontrole pratile aktivni jezik.",
        title: "Povezivanje jezika s temom aplikacije",
      },
      contents: {
        label: "Primjeri lokaliziranih MUI kontrola",
        title: "Na ovoj stranici",
      },
      pagination: {
        description:
          "Straničenje iz aplikacijske teme dobiva lokalizirane pristupačne oznake za prvu, prethodnu, sljedeću i posljednju kontrolu.",
        title: "Navigacija kroz stranice",
      },
      table: {
        description: "Straničenje tablice koristi aktivni MUI jezik za oznake redaka, raspone i navigacijske radnje.",
        title: "Straničenje tablice",
      },
    },
    numbers: {
      contents: {
        label: "Primjeri oblikovanja brojeva",
        title: "Na ovoj stranici",
      },
      currency: {
        description:
          "Proslijedite izričitu ISO oznaku valute kako bi jezik odredio simbol, razmake i decimalne razdjelnike.",
        label: "Valuta",
        title: "ISO valuta",
      },
      decimal: {
        description:
          "Primijenite lokalne grupne i decimalne razdjelnike, a brojčanu vrijednost zadržite neovisnom o prikazu.",
        label: "Jedinice proračuna projekta",
        title: "Grupirani decimalni broj",
      },
      percentage: {
        description:
          "Proslijedite omjer između nule i jedan i prepustite oblikovatelju primjenu lokaliziranog postotka.",
        label: "Postotak dovršenosti",
        title: "Postotak iz omjera",
      },
    },
  },
  pagination: {
    heading: "Lokalizirani tekst MUI komponente",
  },
  tasks: {
    addTask: "Dodaj zadatak",
    greeting: "Pozdrav, {{name}}!",
    taskCount_one: "Preostao je {{count}} zadatak",
    taskCount_few: "Preostala su {{count}} zadatka",
    taskCount_other: "Preostalo je {{count}} zadataka",
  },
} satisfies DevelopmentGuideTranslationShape;
