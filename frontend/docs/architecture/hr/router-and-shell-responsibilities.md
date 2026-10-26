# Odgovornosti usmjerivača i ljuske

Usmjerivač posjeduje **što je dostupno**. Ljuska posjeduje **kako se prikazuju
dobivena navigacija i sadržaj rute**.

## Registar i pravila ruta

`src/app/router/routeRegistry.tsx` autoritet je ruta. Definicija povezuje
putanju, pristup, komponentu stranice, naslov, mrvice, navigacijske metapodatke,
grupu dokumentacije, raspored sadržaja i ponašanje pomicanja. Routerova tvornica
`handbookRoutes.tsx` izvodi konkretne zapise iz javnog manifesta sadržaja i
spaja ih u taj registar; ne uvodi drugi mehanizam podudaranja ruta. `routes.tsx`
pretvara omogućene zapise u React Router objekte te dodaje zaštite i rasporede.
Modul hijerarhije najprije provjerava sve deklarirane zapise, a zatim rekurzivno
slaže omogućene ugniježđene rute bez ograničenja dubine.

`parentId` opisuje hijerarhiju neovisno o dokumentacijskom `groupId`-u. Putanja
djeteta ostaje potpuna aplikacijska putanja i mora biti ispod roditeljske;
kompozicija iz nje izvodi relativnu putanju React Routera. Dijete koristi isti
pristup kao roditelj. Razvojno isključenje nasljeđuje se kroz sve pretke pa
isključeni raspored ne može u produkciji ostaviti potomka, navigaciju ni cilj
preusmjerenja.

Razvojne cjeline Patterns i Architecture omogućene su samo u razvoju. U
produkciji nestaju iz navigacije, a njihovi URL-ovi završavaju kroz uobičajeni
Not Found. Nije dovoljno sakriti stavku navigacije i ostaviti rutu.

`/dev-guide` je početna stranica s kategorijama, bez kartica zaglavlja. Frontend
pod `/dev-guide/frontend` sadrži Primjere stranica, Obrasce, Obrasce radnih tokova
i Arhitekturu.
Primjeri stranica nude Nadzornu ploču kontakata i Kontakte CRUD. Obrasci nude
i18n, Signals, Poslužiteljske podatke, Usmjeravanje i URL-ove, Slojeve, Tablice
i kolekcije, Obrasce unosa te Povratne informacije. Svaka kategorija otvara prvi
primjer i prikazuje vlastitu navigaciju. Obrasci radnih tokova koriste Handbook
kolekciju pod `/dev-guide/frontend/workflow-patterns`, dok izvorne datoteke
zadržavaju prenosive putanje `frontend/<tema>/<članak>.md`. Backend, Kontinuirana
integracija, Isporuka i operacije, Razvojni tijek rada te Tijek rada AI agenata
otvaraju stvarne indekse tema; teme nude indekse članaka i zajedničku bočnu
navigaciju. Ugniježđeni frontend obrasci zadržavaju identitet prvog retka Vodič
za razvoj > Frontend. Prethodni URL-ovi za Početnu i Kontakte preusmjeravaju na
odgovarajući Primjer stranice, a stari Obrasci i Arhitektura pod Frontend.
Parametri upita i fragmenti ostaju sačuvani. Cijeli vodič ostaje samo razvojni.

Rute vodiča nasljeđuju `contentMaxWidth: "xl"`. Ljuska smješta lokalne mrvice i
sadržaj u isti spremnik. Odlučuje najdublja izričito zadana širina; potomci bez
vlastite postavke zadržavaju širinu pretka.

## Ljuska prima navigaciju

Usmjerivač izvodi glavna odredišta, kontekst rute i neobaveznu navigaciju po
odjeljcima te ih predaje `AuthenticatedAppShell`-u. Ljuska prikazuje prvi
redak zaglavlja u stupcu sadržaja s gumbom izbornika, oznakom RGO na računalu, nazivom
glavne rute, brzim radnjama i računom. Smije čitati handleove podudarnih ruta,
ali ne uvozi registar, stranice ni auth implementaciju.

Roditeljska ruta uključuje drugi redak zaglavlja s `headerNavigation: true`.
Usmjerivač izvodi kartice neposredne djece u
`AppRouteHandle.sectionNavigation`; aktivni odjeljak ostaje označen i na
dubljim rutama. Kada više ugniježđenih skupina ruta definira odjeljke zaglavlja,
redak prikazuje najbližu podudarnu skupinu. Potomci bez vlastitih odjeljaka
nasljeđuju odjeljke najbližeg pretka. Višak kartica na računalu ulazi u izbornik Više, dok aktivna
ostaje vidljiva. Oznaka aktivne kartice prekriva donji rub zajedničke razdjelne
crte i dvostruko je deblja. Na mobilnim uređajima drugi redak zadržava aktivni odjeljak vidljivim i prikazuje još jednu karticu na širim mobilnim prikazima. Zaseban gumb Više sekcija otvara donju ladicu sa svim neposrednim odjeljcima, pa za veće skupine ruta nije potrebno vodoravno pomicanje. Prvi redak nema gumb Više za brze radnje.
Najdublja ruta može dati komponentu `HeaderContext` koja prima parametre
rute i proširuje kontekst zaglavlja dinamičkim sadržajem. Postojeća ruta
vodiča s parametrom projekta pokazuje taj obrazac. Kontekst u prvom retku
služi kao semantički naslov jednostavnih stranica; duboke stranice vodiča
zadržavaju lokalne mrvice i naslove članaka.

Podudarna ruta s `headerBreadcrumb: true` dodaje svoj prevedeni naslov u prvi
redak iza glavne rute. Kategorije tako prikazuju Vodič za razvoj → Frontend ili
Vodič za razvoj → Backend. Preci povezuju na svoje podudarne putanje, pa naslov
vodiča vraća na popis kategorija. Izričito uključivanje zadržava naslove
pojedinih kartica i članaka izvan tog retka; najdublji `HeaderContext` i dalje
ga proširuje dinamičkim sadržajem rute.

Glavna ladica u predlošku prikazuje Početnu; aplikacije mogu dodati glavna odredišta. Na računalu je zadano privremena ladica koja prekriva sadržaj,
a ispod 1024 px uvijek je privremena. Korisnik na računalu može odabrati
stalnu ladicu. Stalna ladica zauzima cijelu visinu
preglednika i pomiče cijeli stupac sa zaglavljem. Donji
gumb sažima ladicu u traku ikona ili je proširuje uz prijelaz prozirnosti
naziva. Gumb u zaglavlju skriva je ili vraća; oba se stanja spremaju.
Zadano se pri pomicanju zadržava prvi redak zaglavlja na računalu; postavka
može zadržati oba retka ili nijedan. Na mobilnim uređajima zadržava se samo
prvi redak. Neobavezna bočna navigacija razvojnog vodiča odvojena je od glavne
ladice; na užim zaslonima postaje izbornik „Na ovoj stranici”. Obje bočne
navigacije mogu biti vidljive na širokom zaslonu. Širinu sadržaja određuju
podaci rute, a ne način ladice.

Brze radnje u zaglavlju računala mijenjaju način boja Sustav/Svijetla/Tamna i jezik.
Na mobilnim uređajima te su postavke dostupne u Postavkama, a radnje koje
aplikacija preda kroz `headerActions` prikazuju se izravno, bez gumba Više.
Aplikacija ih treba zadržati kompaktnima. Avatar korisnika otvara izbornik s prikazanim imenom, Postavkama, Vodičem za razvoj u razvojnoj verziji i Odjavom.
Kontrole koriste postojeće vlasnike postavki i politiku fiksnih vrijednosti.
Izbornik računa koristi istu modalnu interakciju: klik izvan njega zatvara ga
bez aktiviranja stranice ispod. Strelice pomiču fokus među radnjama, a
zatvaranje vraća fokus na gumb računa. Uobičajeni odabir rute oslobađa izbornik
prije navigacije. Fiksna vrijednost uklanja odgovarajuću
promjenjivu kontrolu iz zaglavlja i Postavki.

Fiksna donja traka prikazuje Početnu i Postavke te nadzornu ploču kontakata
samo u razvojnoj verziji. Ta poveznica otvara `/dev-guide/frontend/example-pages/contacts-dashboard`; cijeli
Vodič za razvoj dostupan je u izborniku računa. Ruta može postaviti
`mobileBottomNavigation: false` kako bi sakrila traku. Izostavljena
vrijednost ili `true` prikazuju je; odlučuje najdublja podudarna ruta.
Ljuska rezervira donji prostor, uključujući sigurno područje uređaja, samo
dok je traka vidljiva.
Ikone imaju stalno mjesto po visini. Nazivi se pri nedostatku prostora smanjuju
do zadane najmanje veličine, a zatim koriste najviše dva retka bez pomicanja
ikona. Svaka poveznica zadržava puni pristupačni naziv.

Ruta može postaviti `mobileSurface: "flush"` kako bi ispod 1024 px uklonila
samo vodoravne vanjske odmake ljuske; izostavljena vrijednost ili `"inset"`
zadržava zadane odmake. Odlučuje najdublja podudarna ruta. Postavke i
Kontakti koriste taj prikaz uz očuvanje unutarnjih razmaka i prikaza na
računalu.

`to` stavke navigacije uvijek je odredište poveznice. `activePath`
upotrijebite samo kada aktivno stanje treba određivati drugi React Router
uzorak. Uzorak se podudara u cijelosti: dodajte završni `/*` ako i
podređene putanje trebaju ostati aktivne. Parametri pretraživanja i
fragmenti ne utječu na aktivno stanje.

## Pretraživanje stranica

Postavite `commandPalette: true` na zapis registra kako bi stranica bila dostupna
u pretraživanju zaglavlja prijavljene aplikacije. Članstvo je neovisno o glavnoj,
sekcijskoj i donjoj navigaciji te se ne nasljeđuje. Uključite sadržajne stranice,
a ne zapise koji služe samo rasporedu ili prikazu pogreške. Početna i tri odjeljka
Postavki dostupni su u produkciji; odredišta vodiča ostaju samo razvojna.

Usmjerivač izvodi stavke iz omogućenih zaštićenih ruta, određuje konkretna
odredišta te predaje prevedene nazive i kontekst roditelja ljusci kroz
`AuthenticatedAppShell` i `headerActions`. Parametrizirana ruta treba konkretan
`navigation.to`; nerazriješeni parametri, opća ruta za nepoznate putanje i vanjska
odredišta nisu dostupni. Duplikati odredišta daju jedan rezultat u stabilnom
redoslijedu registra. Ljuska prikazuje dijalog i obrađuje pretraživanje i odabir
bez uvoza registra ili stranica. Nazivi rezultata nose glavni naglasak, a manji
prigušeni kontekst prikazuje njihovo mjesto u aplikaciji. Ograničeni popis
rezultata pomiče se odvojeno iznad uputa za tipkovnicu.

Gumb radi na računalu i mobitelu, uz prečac Ctrl+K/Cmd+K. Tekst pretraživanja
ostaje lokalno u dijalogu. Odabir trenutačne stranice čuva parametre upita i
fragment. Drugi odabiri koriste uobičajenu navigaciju nakon što paleta prepusti
modalni fokus, pa postojeće zaštite usmjerivača i dalje rade. Escape ili zatvaranje
vraćaju prethodni fokus; promjena putanje koristi uobičajeni fokus glavnog
sadržaja. Prečac poštuje aktivne modalne površine i sastavljanje teksta. Time se
ne uvodi zaštita navigacije za značajke koje štite samo zatvaranje vlastitog
panela ili promjenu njegova prikaza.

## Ugniježđeni aplikacijski rasporedi

Stranica rasporeda prikazuje `Outlet`, a djeca ostaju obični zapisi registra.
Primjer se može dodati bez izmjene graditelja ruta ili isporučenog izbornika:

```tsx
workspace: {
  Component: WorkspaceLayout,
  access: 'authenticated',
  defaultChildId: 'workspaceOverview',
  path: '/workspace',
  title: () => 'Workspace',
},
workspaceOverview: {
  Component: WorkspaceOverviewPage,
  access: 'authenticated',
  parentId: 'workspace',
  path: '/workspace/overview',
  title: () => 'Overview',
},
workspaceActivity: {
  Component: WorkspaceActivityPage,
  access: 'authenticated',
  parentId: 'workspace',
  path: '/workspace/activity',
  title: () => 'Activity',
},
```

`defaultChildId` stvara zamjensko indeksno preusmjerenje na omogućeno izravno
dijete. Druga je mogućnost jedno dijete s `index: true` bez `path`-a, koje se
prikazuje na `/workspace`:

```tsx
workspaceIndex: {
  Component: WorkspaceOverviewPage,
  access: 'authenticated',
  index: true,
  parentId: 'workspace',
  title: () => 'Overview',
},
```

Indeksno dijete i `defaultChildId` ne koriste se zajedno. Roditelj bez ijedne
od tih postavki prikazuje vlastiti raspored bez preusmjerenja. Najdublja ruta
određuje naslov, raspored i pomicanje, a mrvice sadrže sve pretke, izričite
mrvice i trenutačni naslov.
Odredišta predaka razrješavaju imenovane parametre trenutačnog podudaranja,
ispravno ih kodiraju, izostavljaju nedostajuće neobavezne segmente i čuvaju
kodirane segmente višedijelne putanje. Predak kojem nedostaje obavezan parametar
ostaje tekst umjesto obmanjujuće poveznice.

## Ugniježđena dokumentacija i adapteri stranica

Svaka ugniježđena dokumentacijska cjelina ima vlastiti redoslijed grupa. Zadano
dijete izvodi se iz prve zadržane stavke iste uređene navigacije.
Prethodno/Sljedeće ostaje unutar aktivne Patterns kategorije, Architecture
odjeljka ili Handbook teme. Izričito povezano čitanje smije prelaziti teme;
paginacija ne bira nepovezanu kategoriju ili preusmjerenje.

Stranice su tanki adapteri: uvoze javna sučelja, slažu ih za rutu i ne
ponavljaju ponašanje značajke.

Za ponašanje prikaza tijekom tih prijelaza slijedite
[pravila pomicanja prozora](router-and-shell-responsibilities.md#pravila-pomicanja-prozora).

## Pravila pomicanja prozora

List rute s odgođenim sadržajem može pozvati `useRouteScrollReady(ready)` i zadržati postojeću radnju pomicanja svojeg cjelovitog ulaza dok se ne prikažu sadržaj ili lokalna pogreška. Svaka prijava pripada jednom ulazu i vlasniku; čišćenje ne može ukloniti tuđu prijavu. Bez prijava listova dovoljna je postojeća spremnost grane. Zakazani frame ponovno provjerava trenutačnu granu i sve listove prije potrošnje radnje, uključujući nativni prelazak fragmenata. Već izvršene radnje ne ponavljaju se pri novom pokušaju ili promjeni jezika.

Usmjerivač upravlja pomicanjem prozora kroz `RouteScrollRestoration`. Svaki
zapis povijesti usmjerivača određen je javnim ključem lokacije i cijelim URL-om
rute te, kada je dostupan, javnim ključem zapisa preglednikova Navigation
API-ja. Taj ključ razlikuje ponovljene posjete izvornim fragmentima bez
prepisivanja povijesti; u preglednicima bez tog API-ja dvosmislene izvorne
nizove i dalje obrađuje preglednik. Dva posjeta istom URL-u zato mogu sačuvati
različite položaje čitanja. Natrag i Naprijed vraćaju točno zabilježeni zapis.
Promjene samo parametara upita,
neovisno koriste li push ili replace, zadržavaju položaj; novi put započinje na
vrhu; a početni ili novoizabrani fragment pomiče do dekodiranog ID-a elementa
nakon što je sadržaj rute spreman. Zabilježeni položaj ima prednost pred
fragmentom.

Javne rute označavaju spremnost čim se njihova grana potvrdi. Autentificirane
rute to čine tek ispod `AppAuthGate`, nakon što je zaštićeni sadržaj dostupan;
lijeno učitani moduli rute već su razriješeni kada se njihova grana potvrdi.
Nedostajući ili neispravno kodirani fragmenti vraćaju na vrh samo pri promjeni
puta, a inače zadržavaju položaj. Novija navigacija otkazuje rad na čekanju, a
pomoćnik nikada ne premješta fokus.

Izvorne sidrene i preskočne poveznice zadržavaju ponašanje preglednika.
Usmjerivač ne sprječava njihovu zadanu radnju, ne prepisuje povijest i ne
dodjeljuje ključeve njihovim zapisima. `history.scrollRestoration` posjeduje samo
dok je montiran te vraća prethodnu postavku tijekom životnog ciklusa stranice i
čišćenja. Spremnici s vlastitim pomicanjem ostaju odgovornost pripadajuće
funkcionalnosti.

## Dodavanje rute

Pri dodavanju rute provjerite duboke poveznice, naslov dokumenta, sve mrvice
predaka, navigaciju, jednak pristup, razvojno isključenje i namjerno indeksno
ponašanje roditelja.

## Zajednička navigacija stranica

Postavke i kategorije Obrazaca koriste `AppPageNavigation` s dobivenim
poveznicama i prevedenim nazivima. Komponenta upravlja odabirom, mobilnom
ladicom, vraćanjem fokusa i odgođenom promjenom rute. `SettingsPageNavigation`
prilagođava nazive Postavki, a `PatternCategoryLayout` daje primjere jedne
kategorije. Iznad širine spremnika od 900 px prikazuju bočnu navigaciju širine
240 px, a ispod nje birač stranice. Popisi kategorija vodiča koriste
`AppCategoryList`. Sadržaj Obrasca nalazi se ispod poveznica u bočnoj navigaciji
ili mobilnom izborniku; navigacija na odjeljak čeka zatvaranje izbornika. Raspored
zadaje `DocumentationRailProvider`, a galerije šalju svoj sadržaj u njegov aktivni
cilj umjesto prikaza iznad primjera.

`AppCategoryList` prihvaća uređeni niz običnih poveznica i imenovanih grupa
(`id`, `label`, neobavezni `description` i `items` s poveznicama), u bilo kojoj
kombinaciji. Obrasci grupiraju Signale, Poslužiteljske podatke te Usmjeravanje i
URL-ove pod Aplikacijsko stanje. Prethodni/sljedeći primjer ostaje unutar aktivne kategorije.
Indeks s istim naslovom kao neposredni roditelj prikazuje taj naslov samo jednom.
