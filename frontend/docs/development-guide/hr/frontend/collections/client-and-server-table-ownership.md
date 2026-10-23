# Odvojite prikaz tablice od vlasništva kolekcije

Tablica može dijeliti stupce, gustoću, nazive, proširenja i radnje redaka bez upravljanja udaljenom kolekcijom. Dohvat i stanje koje određuje rezultat zadržite u featureu. Namjerno odaberite klijentsku ili poslužiteljsku obradu kako jedna udaljena stranica ne bi izgledala kao cijeli skup podataka.

Ovo je **referentni recept prikaza**. CDA `SalesTable` omata trenutačno `RgoDesktopTable` sučelje i neobvezno prima kontrolirano poslužiteljsko stanje. LMS i FRED pokazuju povijesne granice server tablica. Njihov `@rgo/front-ui` i ručno građene tablice nisu starter API-ji za uvoz ili vraćanje. Pri implementaciji koristite trenutačnu biblioteku i ugrađene primjere tablica.

## Okidač i vlasništvo

Tanak zajednički prikaz koristite kada više stranica featurea treba ista pravila tablice. Tablica upravlja dostupnim iscrtavanjem i callbackovima interakcija. Vlasnik kolekcije drži filtre, stranicu, veličinu stranice, sortiranje, opseg odabira, query identitet, čekanje i pogreške te udaljeni ukupni broj. API vlasnik prevodi podržano poslužiteljsko sortiranje i paginaciju u stvarni ugovor zahtjeva.

Pregledani CDA omotač prima retke, stupce, stabilan identitet retka, naziv tablice, prazan prikaz i neobvezno proširenje. Bez server propa postavlja lokalnu zadanu paginaciju. Sa server propom prosljeđuje `mode: "server"`, ukupan broj, kontrolirano stanje i callback promjene. Dijeli lokalizirane nazive paginacije i gustoću postavki prikaza, ali ne stvara query niti kopira udaljeno stanje u drugu pohranu.

LMS tablica slično prima podatke, paginaciju, filtre i callbackove od roditelja. Povijesna FRED server tablica mijenja kontrolirana polja sortiranja i iscrtava dobivene retke; ne pretvara sortiranje jedne stranice u cjelovit globalni poredak. To su prenosive granice vlasništva, a ne preporuka za svaki povijesni markup ili način stanja.

## Izričito odaberite način obrade

Ovo je **konceptualni ugovor vlasnika**, a ne definicija propova trenutačne biblioteke za kopiranje:

```ts
type CollectionRequest = {
  page: number;
  pageSize: number;
  sort: { field: "title" | "updatedAt"; direction: "asc" | "desc" };
  search: string;
};
type CollectionPage<Row> = {
  rows: Row[];
  totalCount: number;
};

// Vlasnik: zahtjev -> query ključ -> API -> stranica.
// Server tablica: prikazuje page.rows i objavljuje sljedeće stanje zahtjeva.
// Klijentska tablica: prima cijelu ograničenu kolekciju pa je obrađuje lokalno.
```

Klijentska obrada odgovara poznatoj cjelovitoj ograničenoj kolekciji. Poslužiteljska obrada odgovara udaljenom skupu u kojem backend bira i uređuje stranicu. Uz server paginaciju sortiranje i filtriranje u pravilu pripadaju istom backend ugovoru rezultata. Sortiranje samo vidljive stranice daje lažan globalni poredak; filtriranje samo te stranice može prikazati odsutnost rezultata iako drugdje postoje podudaranja.

Backend mora provjeriti dopuštena polja sortiranja i osigurati stabilan dodatni poredak kako jednaki zapisi ne bi nepredvidljivo mijenjali stranice. Promjena filtra ili sortiranja često vraća na prvu stranicu; promjena veličine treba dokumentirano pravilo. Referentni omotači prikaza ne daju automatski sva ta poslužiteljska jamstva.

## Odluke o stanju i odabiru

| Promjena                            | Vlasnik kolekcije                                          | Prikaz tablice                               |
| ----------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| Klik na stupac u server načinu      | Ažurira podržani zahtjev i query identitet                 | Prikazuje kontrolirano sortiranje            |
| Promjena filtra                     | Resetira ili ograničava stranicu prema pravilima i dohvaća | Prikazuje aktualni filtar i stanje rezultata |
| Promjena gustoće                    | Nema novog poslovnog queryja ako ugovor to ne traži        | Iscrtava odabranu gustoću                    |
| Pozadinsko osvježavanje             | Čuva valjane retke i označava zastarjelost                 | Čuva identitet i fokus                       |
| Brisanje posljednjeg retka stranice | Usklađuje stranicu s novim ukupnim brojem                  | Izbjegava nemoguću trenutačnu stranicu       |
| Skupni odabir kroz više stranica    | Definira ID-eve ili ugovor svih podudaranja                | Prikazuje točan opseg i broj                 |

Stabilni poslovni ili lokalni identifikatori nacrta pripadaju ključevima redaka. Indeksi polja razbijaju odabir, proširenje i fokus pri sortiranju ili osvježavanju. Nestanak ili gubitak pristupa odabranom retku zahtijeva usklađivanje featurea; omotač ne može zaključiti poslovni ishod.

## Pogreške i oporavak

Razlikujte potreban filtar, odsutnost podudaranja, početno učitavanje, početnu pogrešku i zadržane rezultate tijekom osvježavanja. Pregledana LMS stranica traži filtar prije rezultata; njezin povijesni fallback pokriva i nedostajuće podatke. Nova implementacija treba precizirati ta stanja umjesto kopiranja jedne poruke za svaku odsutnost.

Stvarnu pogrešku ostavite vidljivom i ponudite ponavljanje aktualnog zahtjeva. Nemojte stare retke prikazati kao svježe autoritativne ni isprazniti korisnu tablicu pri svakom osvježavanju. Radnje redaka moraju provjeriti trenutačne ovlasti i vlasnika naredbe; označeni redak nije autorizacija.

Koristite naziv tablice, kontrole sortiranja i proširenja dostupne tipkovnicom, lokaliziranu paginaciju i jasan broj odabranih zapisa. Nemojte cijeli redak pretvoriti u dvosmislen cilj klika kada sadrži poveznice, checkboxove i proširenja. Nakon udaljene promjene gdje je moguće čuvajte fokus stabilnim identitetom.

## Scenariji prihvaćanja

Sortirajte višestraničnu udaljenu kolekciju: API prima sortiranje i sve stranice imaju jedan poredak. Filtrirajte s kasnije stranice: vlasnik provodi dokumentirani reset. Promijenite gustoću: nema nepotrebnog zahtjeva. Osvježite nakon brisanja retka: odabir i stranica ostaju dosljedni. Odaberite zapise kroz stranice: skupna radnja imenuje točan opseg. Prekinite pozadinski dohvat: zadržani retci prikladno su označeni i pogreška dopušta oporavak.

## Izbjegnite ove prečace

Nemojte graditi generičku tablicu koja potajno dohvaća svaki feature, preslikavati query rezultate u paralelan signal, kombinirati server paginaciju s klijentskim globalnim sortiranjem, koristiti indekse kao ključeve ni gustoći dati udaljeno stanje. Dijelite pravila prikaza dok feature zadržava ugovor kolekcije.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/sales/components/SalesTable.tsx` — omotač trenutačne biblioteke s neobveznim kontroliranim server načinom.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shift/components/ShiftTable/ShiftTable.tsx` — roditeljska paginacija i filtri te prikaz potrebnog filtra.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/components/data-display/FredTable/components/FredServerTable/FredServerTable.tsx` — povijesna kontrolirana interakcija sortiranja i prikaz dobivenih redaka.
