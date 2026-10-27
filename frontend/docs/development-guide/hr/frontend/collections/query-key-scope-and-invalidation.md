# Identitet rezultata i opseg invalidacije stavite pod jednog vlasnika ključeva

Query predmemorija ponovno koristi rezultat prema ključu, a ne URL-u koji korisnik vidi ili zaglavljima na mreži. Ako ključ izostavi korisnika, radni prostor, filtar, stranicu ili drugi ulaz koji određuje rezultat, aplikacija može koristiti pogrešnu projekciju. Svaki feature treba namjernu tvornicu ključeva, a mutacije invalidiraju projekcije koje stvarno mogu promijeniti.

Ovo je **Storybook referentni obrazac s proširenjima potkrijepljenim izvorima**, uz ugrađenu Query infrastrukturu. Contacts živi pod `docs/storybook/examples/Contacts/`, izvan produkcijskog registra. Contacts posjeduje `ContactQueryKey`, stvara Query opcije kroz injektirani API i nakon zapisivanja invalidira kolekciju. CDA pokazuje privatni opseg korisnika i projekta. LMS povijesno uključuje stranicu i filtre u ključ. Njegova zasebna dodjela signalu u jednom queryju ograničenje je za razmatranje, a ne preporuka drugog izvora udaljene istine.

## Okidač i vlasništvo

API/query feature upravlja svim cache identitetima svog resursa. Aplikacijska runtime kompozicija injektira API i QueryClient u tvornice queryja i mutacija. Stranica bira ulaze i promatra rezultat; ne treba izmišljati konkurentski zapis ključa iste kolekcije.

Korijen ključa Contacts reference je `['contacts']`, a kolekcija dodaje `'collection'`. To je dovoljno za njegovu stvarnu neparametriziranu lokalnu kolekciju Contacts. Nije dokaz da svaka buduća udaljena kolekcija može izostaviti korisnika, radni prostor, filtre ili paginaciju. Ključ proširite kada ti ulazi stvarno određuju rezultat.

Referentna query tvornica prosljeđuje signal Queryja u `api.findAll({ signal })`. Tvornica mutacija nakon operacija koje mijenjaju kolekciju invalidira `ContactQueryKey.collection()`. API ovisnosti su izričite, pa query opcija opisuje rad bez stvaranja nepovezanog globalnog klijenta.

## Definirajte cijeli identitet rezultata

Ovaj neutralni primjer je **predloženi recept featurea**, a ne ugrađeni Documents API:

```ts
const DocumentKey = {
  scope: (workspaceId: string, viewerId: string) => ["documents", workspaceId, viewerId] as const,
  page: (
    workspaceId: string,
    viewerId: string,
    request: {
      page: number;
      pageSize: number;
      search: string;
      sort: "title:asc" | "updatedAt:desc";
    },
  ) => ["documents", workspaceId, viewerId, "page", request] as const,
};
```

Korisnik pripada identitetu kada dva korisnika mogu dobiti različite podatke istog radnog prostora. To nije vjerodajnica autorizacije i ne zamjenjuje backend provjere. Lozinke, session tokene, privatne bajtove datoteka i nepotreban osjetljiv sadržaj nikad nemojte stavljati u ključ; dijagnostika predmemorije i razvojni alati mogu ga otkriti.

Normalizirajte semantiku zahtjeva prije uporabe. Ekvivalentne vrijednosti odsutnog pretraživanja ne trebaju stvarati različite identitete, a nepodržane vrijednosti sortiranja ili stranice ne smiju neprovjereno stići do endpointa. Birajte stabilne serijalizabilne vrijednosti. Funkcija, promjenjiva instanca klase ili prolazni slučajni nonce u ključu obično zamagljuju namjeravani identitet.

CDA ključ specifikacije uključuje projekt i, kada je predan, korisnika. LMS ključ kolekcije uključuje objekte paginacije i filtra. To su dvije različite dimenzije; nova privatna paginirana kolekcija može trebati obje. Nemojte kopirati minimalni ključ bilo kojeg izvora bez pregleda cijelog ugovora ulaza novog API-ja.

## Invalidirajte zahvaćene projekcije

| Mutacija                                                   | Vjerojatno zahvaćeni dohvati            | Namjerna odluka                                        |
| ---------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| Stvaranje dokumenta                                        | Pripadajući popisi i ukupni brojevi     | Invalidirajte kolekcijsku obitelj odgovarajućeg opsega |
| Promjena naslova koji utječe na sortiranje ili filtriranje | Detalj i zahvaćene stranice             | Uskladite detalj i ponovno dohvatite projekcije        |
| Nepovezana postavka prikaza                                | Nema poslovnih podataka dokumenata      | Bez invalidacije kolekcije                             |
| Arhiviranje ili brisanje                                   | Detalj, popisi, brojevi i ovisni sažeci | Uključite svakog stvarnog vlasnika projekcije          |
| Promjena vidljivosti                                       | Privatne projekcije određenog korisnika | Uz invalidaciju primijenite opoziv i uklanjanje        |
| Promjena korisnika                                         | Drugi identitet rezultata               | Nemojte koristiti privatni zapis prethodnog korisnika  |

Prefiksna invalidacija korisna je kada promjena utječe na članstvo kroz više stranica ili filtara. Točna invalidacija odgovara jednoj neovisnoj projekciji. Nemojte obećavati da invalidacija samo vidljive stranice ažurira sve predmemorirane prikaze promijenjenog zapisa. Invalidacija svega nakon svakog zapisivanja istodobno skriva pogreške vlasništva i stvara nepotrebne dohvate.

Predmemorija se može ažurirati autoritativnom vraćenom projekcijom kada oblik i opseg odgovaraju ključu. Nemojte djelomičan odgovor mutacije upisati kao potpuni detalj ni optimistično rekonstruirati privatne poslužiteljske ovlasti. Pozadinska invalidacija i potvrđena persistencija različiti su ishodi; neuspješno osvježavanje ne smije pozivati na dvostruko zapisivanje.

## Pogreške i oporavak

Pogrešan ključ može prikazati pogrešan rezultat bez mrežne pogreške. Zato problemi opsega zahtijevaju pregled izričitih scenarija, a ne samo uspješnog zahtjeva. Pri odjavi ili gubitku ovlasti zadržavanje i uklanjanje privatne predmemorije ima vlastiti životni ciklus; promjena ključa sama ne uklanja svaki stari privatni zapis.

Izbjegnite query funkciju koja isti udaljeni rezultat zapisuje i u nepovezan globalni signal. Pregledani LMS `findActive` to čini radi povijesnog ponašanja aplikacije. U novom featureu prvo odredite autoritativnog vlasnika i potrebu druge reprezentacije; inače invalidacija i signal neovisno odlaze u različita stanja.

## Scenariji prihvaćanja

Dohvatite isti prostor kao korisnici A i B s različitom vidljivošću: rezultati se ne miješaju. Neovisno promijenite filtar, sortiranje, stranicu i veličinu: svaki zahtjev ima pravi identitet. Pošaljite mutaciju koja mijenja sortirano članstvo: odgovarajuće stranice i ukupni brojevi osvježavaju se u dokumentiranom opsegu. Ažurirajte prikaznu postavku: poslovni queryji ostaju netaknuti. Prekinite zastarjeli query: signal stiže do API-ja, a vlasništvo aktualnog rezultata ostaje dosljedno. Opozovite pristup: privatni zapisi slijede politiku čišćenja featurea.

Zasebno lokalizirajte prazninu, osvježavanje uz zadržane podatke, pogrešku i zabranu. Korisniku nemojte izlagati internu strukturu query ključa kao dijagnostiku; prikažite učinak i radnju oporavka primjerenu featureu.

## Izbjegnite ove prečace

Nemojte izostaviti korisnika, filtre ili stranicu, ponavljati literale ključeva po stranicama, koristiti samo HTTP putanju dok zaglavlja mijenjaju projekciju, preslikavati rezultate bez ugovora drugog vlasnika ni invalidirati sve nakon svake naredbe. Tvornica ključeva sažet je ugovor identiteta rezultata i odgovornosti mutacija.

## Izvori i podrijetlo

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.querykeys.ts` — ugrađena tvornica ključeva featurea.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.query.ts` — injektirani API i prosljeđivanje query signala.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.mutation.ts` — ciljana invalidacija kolekcije nakon zapisivanja.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/api/specifications.api.http.ts` — query identitet projekta i korisnika te API granica.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shift/api/shift.query.ts` — identitet stranice i filtra te povijesno upozorenje paralelnog signala.
