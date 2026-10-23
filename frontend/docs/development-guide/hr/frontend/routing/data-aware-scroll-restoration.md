# Neka potvrđena završna stranica objavi spremnost za pomicanje

Router može znati da je navigacija završila prije nego što stranica ovisna o podacima ima dovoljnu visinu ili ciljni naslov postoji. Prerano vraćanje položaja ograniči viewport na kratki prikaz učitavanja; ponovno pomicanje pri svakom osvježavanju zatim odvlači korisnika od čitanja. Ulazno pomicanje uskladite sa spremnošću rasporeda potvrđene završne stranice.

Ovo je **referentno proširenje uz usporedbu startera**. Starter već ima `RouteScrollRestoration` i `RouteScrollContentReady` za potvrđeni sadržaj grane ruta. CDA dodaje namjerni `useRouteScrollReady` ugovor završne stranice koji odgađa vraćanje dok podaci i raspored nisu upotrebljivi. Taj hook i privatni koordinacijski kontekst nisu ugrađeni starter API-ji.

## Okidač i vlasništvo

Spremnost ovisnu o podacima koristite kada je ulazni sadržaj asinkron, sidro nastaje nakon dohvata ili povratni zadatak ima provjeren položaj. Router upravlja vrstom navigacije, identitetom history zapisa, spremljenim položajem i ulaznom politikom. Završna stranica određuje je li sadržaj trenutačne lokacije spreman i što treba dobiti fokus nakon smještanja.

Spremnost ne znači nužno da su svi queryji završili. Prikaz pogreške može biti spremno odredište. Stranica sa zadržanim podacima može se čitati tijekom pozadinskog osvježavanja. Definirajte malo stanje koje govori da postoji raspored potreban za ovu ulaznu radnju. Čekanje nepovezanog periodičnog queryja može zauvijek odgoditi vraćanje.

CDA hook stvara stabilan simbol vlasnika i preuzima trenutačnu lokaciju u layout effectu. Cleanup oslobađa samo zahtjev tog vlasnika. Router ponovno uspoređuje tokene lokacije i zapisa, trenutačnog vlasnika i spremnost pri izvođenju zakazanog animation framea. Stara završna stranica ne može smjestiti novu rutu samo zato što je njezin zahtjev kasno završio.

## Odvojite ulaznu politiku od kasnijih ažuriranja

Ovaj **pseudokod** opisuje referentni ugovor; nije starter import:

```ts
const ready = initialReadSucceeded || initialReadFailed;

claimEntryScroll({
  ready,
  onSettled: context => {
    if (!context?.restoredPosition) {
      focusAppropriateEntryHeading();
    }
  },
});

// Pozadinska osvježavanja ažuriraju sadržaj bez ponavljanja ulaznog pomicanja.
```

Pregledani router jednom smješta history zapis. Zamjenska završna stranica, primjerice rezultat ponovnog pokušaja, može dobiti vlastiti callback bez ponavljanja ulaznog pomicanja. Callback zato nije dopuštenje za novi `scrollTo(0, 0)`. Fokus treba odabrati prema informaciji o vraćenom položaju i stvarnom zadatku.

CDA neobvezno prihvaća izričit konačan nenegativan povratni položaj za provjeren ne-POP ulaz čija bi zadana radnja bila vrh. POP zadržava spremljeni history položaj routera. To je usko nadjačavanje, a ne dopuštenje da bilo koji URL parametar upravlja proizvoljnim pomicanjem. Povratni kontekst provjerite u vlasniku toka prije predavanja router koordinaciji.

## Odaberite pravu radnju

| Navigacija ili stanje               | Odluka pomicanja                        | Odgovornost završne stranice                               |
| ----------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| Nova putanja bez fragmenta          | Ulazna politika obično vodi na vrh      | Objavite upotrebljiv raspored                              |
| Poznati povratak kroz history       | Vratite spremljeni položaj              | Nemojte ga nadjačati pomicanjem zbog autofokusa            |
| Cilj fragmenta stiže nakon podataka | Primijenite fragment nakon spremnosti   | Iscrtajte stabilan ID i odmak zaglavlja                    |
| Promjena prikaza samo upitom        | Slijedite dokumentiranu router politiku | Bez bezuvjetnog pomicanja na vrh                           |
| Početni dohvat ne uspije            | Prikaz pogreške može biti spreman       | Po potrebi fokusirajte smislen problem ili ponovni pokušaj |
| Pozadinsko osvježavanje             | Sačuvajte mjesto čitanja                | Ažurirajte bez ponavljanja ulaza                           |
| Unmount tijekom čekanja             | Oslobodite zahtjev vlasnika             | Zanemarite zakašnjele učinke rezultata i rasporeda         |

Starterova postojeća politika već razlikuje putanju, fragment, promjenu samo upita i history položaje. Proširite tog vlasnika ako feature treba finiju spremnost; nemojte u svaku stranicu dodati drugi neovisan upravitelj pomicanja. Konkurentski effecti stvaraju vremenski ovisne skokove i kada svaki zasebno izgleda razumno.

## Pogreške i oporavak

Nedostajući fragment treba dokumentiran fallback. Pregledana osnovna politika može koristiti vrh kada nedostaje fragment na drugoj putanji; fragment iste stranice nije razlog za proizvoljno resetiranje. Neispravno kodiranje fragmenta treba sigurno završiti bez rušenja navigacije.

Prikaz učitavanja koji nikad ne objavi spremnost pogreške može zaglaviti ulaz. Prerana spremnost prije velike strukture sadržaja vraća problem ograničavanja položaja. Zahtjev vezan samo uz putanju može zamijeniti dva history zapisa s različitim upitom ili fragmentom. Koristite cjelovit identitet lokacije s router granice.

Fokus može pomaknuti viewport. Nakon povratka na povijesno mjesto čitanja nemojte fokusirati vršni naslov ako to nije namjeravano ponašanje zadatka. Ljepljiva zaglavlja trebaju dosljedan odmak cilja, primjerice postojeći scroll margin aplikacije, umjesto proizvoljnih brojki po stranicama. Korisnički pokrenut fokus nakon izričitog prijelaza zadatka razlikuje se od neželjenog fokusa pri svakom refetchu.

## Scenariji prihvaćanja

Vratite se gumbom Back na dug zapis čiji početni sadržaj sporo stiže: položaj se vraća nakon korisnog rasporeda i autofokus ga ne zamjenjuje vrhom. Otvorite duboki fragment čiji naslov stiže s podacima: dolazi do naslova nakon spremnosti. Odbijte početni dohvat: prikaz pogreške smješta se i dopušta ponovni pokušaj. Dovršite staru rutu nakon navigacije: ne može preuzeti novi ulaz. Osvježite već čitljivu stranicu: položaj ostaje. Ponovno pokušajte sa zamjenskom završnom stranicom: ulazno pomicanje ne ponavlja se bez potrebe.

## Izbjegnite ove prečace

Nemojte pomicati pri svakoj promjeni podataka, koristiti proizvoljni timeout kao spremnost, vraćati položaj prije sadržaja, dopustiti više outletova bez vlasništva ni izvoditi history identitet samo iz putanje. Zadržite jednu router politiku i jedan ugovor spremnosti trenutačne završne stranice.

## Izvori i podrijetlo

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/router/components/RouteScrollRestoration.tsx` — ugrađena ulazna politika, spremnost sadržaja grane, fragmenti i spremljeni položaji.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/hooks/useRouteScrollReady.ts` — potvrđeni zahtjev lokacije i vlasnika završne stranice te cleanup.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/routeScrollContext.ts` — namjerne opcije završne stranice i privatna router koordinacija.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/components/RouteScrollRestoration.tsx` — spremnost, jednokratno smještanje, obavijest zamjenskom vlasniku i prednost POP-a.
