# Izgradnju i parsiranje URL-a držite u čistom tipiziranom ugovoru

Ruta je javna adresa prikaza ili točnog zadatka. Rašireno spajanje stringova lako dovodi do neslaganja izbornika, breadcrumbova, potvrda i povratnih tokova o tom identitetu. Jednoj obitelji ruta dajte čist tipizirani ugovor koji gradi adrese i parsira nepouzdane lokacije bez dohvata podataka ili odlučivanja o ovlastima.

Ovo je **referentni obrazac potrošačke aplikacije** client-discovery-app. Njezin ugovor projektnih URL-ova koristi diskriminirane unije, izričite popise nastavaka ruta i zasebne module podskupina. Starterov registar ostaje ugrađeni vlasnik kompozicije ruta; CDA tipovi i graditelji projekata nisu starter eksporti i ne trebaju postati drugi konkurentski registar aplikacije.

## Okidač i vlasništvo

Ugovor ruta koristite kada feature ima više povezanih prikaza, stabilne identifikatore zapisa, zadatke određene verzijom ili povratne tokove čiji identitet mora preživjeti navigaciju. Ugovor upravlja sintaksom i semantičkim oblikom adrese. Kompozicija upravlja komponentama i hijerarhijom. Feature nakon parsiranja upravlja podacima, ovlastima i životnim ciklusom zadatka.

Pregledani `projectRoutes.ts` izričito navodi granicu: bez feature stanja, dopuštenja, queryja ili importa registra. Uvozi čiste helpere podskupina. Unija ciljeva izričito zahtijeva identitete: pregled verzije može trebati zapis, verziju, digest i dodjelu; popis ništa od toga. Stanje prikaza poput teme uređivača može se tretirati drukčije od točnog poslovnog identiteta zadatka.

Razliku zadržite malom i smislenom. Nemojte kopirati potrošački ugovor od dvije tisuće redaka u feature s dvije stranice. Rastuću obitelj dijelite prema stabilnom semantičkom vlasniku uz jedno dokumentirano ulazno sučelje.

## Gradite samo valjane adrese

Ovo je **neutralan konceptualni ugovor**, a ne starter API:

```ts
type DocumentTarget =
  | { kind: "list"; workspaceId: string }
  | { kind: "record"; workspaceId: string; documentId: string }
  | {
      kind: "review";
      workspaceId: string;
      documentId: string;
      versionId: string;
      digest: string;
    };

declare function documentPath(target: DocumentTarget): string;
declare function parseDocumentTarget(location: {
  pathname: string;
  search: string;
}): DocumentTarget | { kind: "invalid" } | null;
```

Unija na TypeScript granici sprječava pregled bez verzije. Runtime validacija i dalje je potrebna jer URL-ovi i JavaScript pozivatelji nisu pouzdani. Referentni graditelj provjerava identifikatore i kodira ih kao zasebne segmente. Vrijednosti upita koriste `URLSearchParams`. Nemojte cijelu putanju kodirati kao segment, dodavati sirove korisničke stringove ni promjenjiv naziv koristiti kao trajni identitet zapisa.

Parser dekodira segmente uz obradu pogrešaka, provjerava dopuštene oblike i vraća izričit nevaljan rezultat za neispravne adrese svoje obitelji. Lokacija izvan obitelji može vratiti `null`. Tako kompozicija bira ponašanje za nepostojeće stranice bez pretvaranja neispravnog točnog zadatka u zadanu stranicu obitelji.

## Namjerno definirajte semantiku upita

Parametri koji određuju točan zadatak zaslužuju strogu validaciju. Referenca provjerava dopuštene kombinacije i za mnoge podskupine točnih zadataka odbija ponovljene ili nepoznate parametre. Pravila kompatibilnosti i prikaza razlikuju se po obiteljima; nemojte tvrditi da su svi nepoznati parametri svugdje zabranjeni kada parser neke namjerno dopušta.

Odlučite kako filtri, teme, povratni kontekst, verzije i hash vrijednosti utječu na identitet. Promjena teme prikaza može zadržati nacrt; promjena digesta verzije ne smije. Referentni `sameProjectTask` računa semantički identitet prema izričitim pravilima podskupina umjesto usporedbe sirovih URL-ova. To nije opće dopuštenje za zanemarivanje svih parametara upita.

| Ulaz                               | Odluka ugovora                                                   | Posljedica za kompoziciju                            |
| ---------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| Valjan tipizirani cilj             | Kodirajte jednu kanonsku podržanu adresu                         | Prikažite povezanu stranicu                          |
| Valjana ekvivalentna stara adresa  | Parsirajte ili preusmjerite prema dokumentiranoj kompatibilnosti | Sačuvajte namjeravani zadatak                        |
| Neispravno percent kodiranje       | Vratite nevaljano stanje bez rušenja rendera                     | Prikažite sigurnu nepostojeću ili nevaljanu stranicu |
| Nedostaje obvezna verzija          | Odbijte točan zadatak                                            | Nemojte prešutno pregledati najnoviju verziju        |
| Ponovljen parametar točnog zadatka | Odbijte ondje gdje ugovor traži jedinstvenost                    | Izbjegnite dvosmislenu osnovu naredbe                |
| Valjana adresa bez ovlasti         | Adresa ostaje valjana                                            | Zasebno prikažite ishod autorizacije                 |

## Pogreške i razvoj

Dodavanje rute mijenja javni ugovor. Prema potrebi zajedno ažurirajte uniju ciljeva, graditelj, parser, popis obitelji, vezu registra, breadcrumbove i namjerno rukovanje starim adresama. Upit, fragment i stanje čuvajte prema značenju migracije; slijepo prenošenje zastarjelih parametara točnog zadatka u drugu radnju može biti nesigurno.

Parser ne treba pisati u predmemoriju, dohvaćati zapis, preusmjeravati prema promjenjivim dodjelama ni popravljati poslužiteljske identifikatore. Ti učinci čine tumačenje adrese nedeterminističkim i otežavaju korištenje izvan komponente. Nakon parsiranja mountani feature dohvaća točno adresirani resurs i obrađuje odsutnost ili zabranu kroz API ugovor.

## Scenariji prihvaćanja

Izgradite neutralni cilj s razmacima ili rezerviranim znakovima i parsirajte ga u namjeravani identitet. Predajte neispravno kodiranje i nepodržane oblike: tumačenje sigurno završava nevaljanim stanjem. Promijenite samo temu prikaza: dokumentirani identitet zadatka ostaje isti. Promijenite verziju ili digest: zadatak je drugi. Otvorite valjan nedopušten URL: sintaksa ostaje valjana, ovlast se odbija. Staru javnu poveznicu čuvajte samo izričitim kompatibilnim parserom ili preusmjeravanjem.

Oko stabilnih identifikatora koristite lokalizirane nazive i breadcrumbove; nemojte slučajno lokalizirati trajne ID-eve ruta. Nazivi točnih zadataka trebaju opisati radnju i cilj bez izlaganja privatnih podataka u javnom URL-u.

## Izbjegnite ove prečace

Nemojte spajati rute u svakoj komponenti, dekodirati dvaput, djelomičan identitet prihvatiti kao najnoviji, izvoditi ovlasti u graditeljima ni stvarati nuspojave tijekom parsiranja. Dobar ugovor dovoljno je malen za razumijevanje i dovoljno strog da pozivatelj slučajno ne adresira drugi zadatak.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/projectRoutes.ts` — čisti tipizirani ciljevi, kodiranje i parsiranje, popis obitelji, kompatibilnost i semantički identitet zadatka.
