# Odgovornosti usmjerivača i ljuske

Usmjerivač posjeduje **što je dostupno**. Ljuska posjeduje **kako se prikazuju
dobivena navigacija i sadržaj rute**.

## Registar i pravila ruta

`src/app/router/routeRegistry.tsx` autoritet je ruta. Definicija spaja putanju,
pristup, komponentu ili odgođeni modul, naslov, mrvice, navigaciju, raspored i
pomicanje. `routes.tsx` pretvara omogućene zapise u React Router objekte i dodaje
zaštite i rasporede. Hijerarhija najprije provjerava sve zapise, a zatim slaže
ugniježđene omogućene rute bez ograničenja dubine.

`parentId` opisuje hijerarhiju. Djeca zadržavaju potpune aplikacijske putanje
ispod roditeljske; kompozicija izvodi relativne React Router putanje. Dijete
koristi isti pristup kao roditelj. Razvojno isključenje, kada ga potrošač treba,
nasljeđuje se kroz sve pretke.

Predložak registrira Početnu, Postavke i auth/error granice. Ni u jednom buildu
nema razvojnog vodiča ni kompatibilnih preusmjerenja. Ukinuti `/dev-guide` URL-ovi
završavaju kroz uobičajeni Not Found i tijekom razvoja. Svi čitači i primjeri
žive pod `docs/storybook/`.

Širina sadržaja podatak je rute: lokalne mrvice i sadržaj dijele spremnik ljuske.
Odlučuje najdublja izričito zadana širina; potomci bez iznimke nasljeđuju pretka.

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
rute i proširuje kontekst zaglavlja dinamičkim sadržajem. Izolirane upute za kartice zaglavlja pokazuju parametrizirani primjer. Kontekst
prvog retka semantički je naslov jednostavnih stranica; dublje produktne stranice
mogu dati lokalne mrvice i naslove sadržaja.

Podudarna ruta s `headerBreadcrumb: true` dodaje svoj prevedeni naslov u prvi
redak iza glavne rute. Preci povezuju na podudarne putanje. Izričito uključivanje zadržava naslove
pojedinih kartica i detalja izvan tog retka; najdublji `HeaderContext` i dalje
ga proširuje dinamičkim sadržajem rute.

Glavna ladica u predlošku prikazuje Početnu; aplikacije mogu dodati glavna odredišta. Na računalu je zadano privremena ladica koja prekriva sadržaj,
a ispod 1024 px uvijek je privremena. Korisnik na računalu može odabrati
stalnu ladicu. Stalna ladica zauzima cijelu visinu
preglednika i pomiče cijeli stupac sa zaglavljem. Donji
gumb sažima ladicu u traku ikona ili je proširuje uz prijelaz prozirnosti
naziva. Gumb u zaglavlju skriva je ili vraća; oba se stanja spremaju.
Zadano se pri pomicanju zadržava prvi redak zaglavlja na računalu; postavka
može zadržati oba retka ili nijedan. Na mobilnim uređajima zadržava se samo
prvi redak. Neobavezna bočna navigacija stranice odvojena je od glavne
ladice; na užim zaslonima postaje izbornik „Na ovoj stranici”. Obje bočne
navigacije mogu biti vidljive na širokom zaslonu. Širinu sadržaja određuju
podaci rute, a ne način ladice.

Brze radnje u zaglavlju računala mijenjaju način boja Sustav/Svijetla/Tamna i jezik.
Na mobilnim uređajima te su postavke dostupne u Postavkama, a radnje koje
aplikacija preda kroz `headerActions` prikazuju se izravno, bez gumba Više.
Aplikacija ih treba zadržati kompaktnima. Avatar korisnika otvara izbornik s prikazanim imenom, Postavkama i Odjavom.
Kontrole koriste postojeće vlasnike postavki i politiku fiksnih vrijednosti.
Izbornik računa koristi istu modalnu interakciju: klik izvan njega zatvara ga
bez aktiviranja stranice ispod. Strelice pomiču fokus među radnjama, a
zatvaranje vraća fokus na gumb računa. Uobičajeni odabir rute oslobađa izbornik
prije navigacije. Fiksna vrijednost uklanja odgovarajuću
promjenjivu kontrolu iz zaglavlja i Postavki.

Fiksna donja traka prikazuje Početnu i Postavke. Ruta može postaviti
`mobileBottomNavigation: false` kako bi sakrila traku. Izostavljena
vrijednost ili `true` prikazuju je; odlučuje najdublja podudarna ruta.
Ljuska rezervira donji prostor, uključujući sigurno područje uređaja, samo
dok je traka vidljiva.
Ikone imaju stalno mjesto po visini. Nazivi se pri nedostatku prostora smanjuju
do zadane najmanje veličine, a zatim koriste najviše dva retka bez pomicanja
ikona. Svaka poveznica zadržava puni pristupačni naziv.

Ruta može postaviti `mobileSurface: "flush"` kako bi ispod 1024 px uklonila
samo vodoravne vanjske odmake ljuske; izostavljena vrijednost ili `"inset"`
zadržava zadane odmake. Odlučuje najdublja podudarna ruta. Postavke koriste taj prikaz uz očuvanje unutarnjih razmaka i prikaza na
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
Postavki dostupni su u svakom buildu; odredišta vodiča nisu u aplikacijskom
pretraživanju.

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

Za interaktivne upute pokrenite `npm run storybook` iz mape `frontend` i otvorite
**Development Guide → Routing → Pages with header tabs → Docs**. Engleske
[Storybookove upute](../../storybook/routing/HeaderTabs/HeaderTabs.mdx) pokazuju stvarnu
ljusku, zadanu podrutu, izravan ulazak u podrutu, odabir na potomku i mobilni
izbornik odjeljaka. Izolirani memorijski usmjerivač prikazuje trenutni URL primjera;
ponovno učitavanje dubokih poveznica provjerava se u aplikaciji. Referentne rute izolirane su Storybook pripreme, a ne ugrađena aplikacijska
odredišta.

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

Navigacija prethodnog/sljedećeg članka pripada Storybook čitaču i ostaje unutar
odabrane teme ili sekcije. Navigacija potrošačkih stranica pripada njihovu
rasporedu rute. Vizualne grupe ne registriraju aplikacijska odredišta.

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

Postavke koriste `AppPageNavigation` s dobivenim poveznicama i prevedenim nazivima.
Komponenta upravlja odabirom, mobilnom ladicom, vraćanjem fokusa i odgođenom
promjenom rute. `SettingsPageNavigation` prilagođava nazive Postavki. Iznad širine
spremnika od 900 px raspored prikazuje bočnu navigaciju širine 240 px, a ispod nje
birač stranice. Galerije i bočni sadržaj članaka žive pod `docs/storybook/`;
ne uvode aplikacijski API dokumentacijskih grupa.

Za potpunu implementaciju otvorite **Development Guide → Routing → Pages with
left navigation → Docs** u Storybooku ili pročitajte engleski
[izvor uputa](../../storybook/routing/LeftNavigation/LeftNavigation.mdx). Tri stranice
Project koriste raspored Postavki: bočnu navigaciju pri širini sadržaja od
najmanje 900 px, birač stranice ispod te širine i odabir na potomku.

`AppCategoryList` prihvaća uređeni niz običnih poveznica i imenovanih grupa
(`id`, `label`, neobavezni `description` i `items` s poveznicama), u bilo kojoj
kombinaciji. Upute za birač odredišta daju izolirani primjer miješanog popisa.
Indeks s istim naslovom kao neposredni roditelj prikazuje taj naslov samo jednom.

Za birač odredišta preko cijelog sadržaja otvorite **Development Guide → Routing →
Navigation chooser pages → Docs** u Storybooku ili pročitajte engleski
[izvor uputa](../../storybook/routing/NavigationChooser/NavigationChooser.mdx). Koristi
`AppCategoryList` za obične i grupirane retke te indeksnu rutu koju zamjenjuje
odabrano odredište. Vizualne grupe popisa ne stvaraju roditeljske rute.
