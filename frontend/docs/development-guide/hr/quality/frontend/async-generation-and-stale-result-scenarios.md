# Kontrolirajte asinkroni poredak da otkrijete zastarjele rezultate

Race scenarij treba odrediti kada operacija počinje i koji rezultat stiže prvi. Čekanje da je mreža vjerojatno završila ne dokazuje poredak. Zadržite promise ili HTTP odgovor, promatrajte početak, promijenite vlasnika pa otpustite stari rezultat i provjerite što ne smije promijeniti.

Ovo je **ugrađeni starter obrazac s potrošačkim proširenjima**. Lookup test namjerno ignorira transportni abort. Auth runtime zadržava stare dohvate kroz promjenu identiteta. CDA editor zadržava zapisivanje kroz unmount i opoziv. To su tvrdnje izvora, ne prijava izvršenih testova.

## Okidač i vlasništvo

Kontrolirani poredak koristite za zamjenske pretrage, rute i uređivače, istek autentikacije, odgođenu potvrdu i kasnu potvrdu zapisivanja. Test posjeduje vrata otpuštanja, produkcijski vlasnik otkazivanje i prihvaćanje.

Starter lookup bilježi filtre, signal i resolver svakog zahtjeva. Mijenja pretragu i odjel, prvo razriješi aktualan pa stari odgovor. Provjerava abort i zadržavanje aktualnog rezultata. Transport može završiti i nakon aborta; `signal.aborted` sam ne dokazuje sigurnost.

## Izričito dizajnirajte utrku

Ovo je **neizvršeni konceptualni pseudokod**, a ne ugrađeni helper:

```ts
const oldRead = holdResponse();
startReadFor("owner-a", oldRead);
await oldRead.started;

switchTo("owner-b");
await showCurrentResult();
oldRead.release(oldProjection);

// Aktualni vlasnik i rezultat ostaju B; privatno staro stanje ne vraća se.
```

Odvojite početak i dovršetak. Prerano otpuštanje može promašiti utrku, a čekanje dovršetka prije promjene vlasnika provjerava običan slijed. React promjene otpuštajte u prikladnom `act` i vidljivom wait okviru.

| Utrka                                          | Pozitivan ishod                         | Zabranjeni ishod                |
| ---------------------------------------------- | --------------------------------------- | ------------------------------- |
| Stari lookup završi zadnji                     | Aktualni izbori ostaju                  | Stari roditelj prepisuje        |
| Sesija istekne prije odgovora                  | Anonimnost i privatni cache očišćeni    | Stara sesija vraća identitet    |
| Prijava završi prije starog anonimnog odgovora | Novi identitet ostaje                   | Kasni 401 poništava novu sesiju |
| Write potvrđen nakon unmounta                  | Valjan promatrač zna činjenicu          | Stari editor prihvaća stanje    |
| Opoziv tijekom zadržanog writea                | Privatni nacrt i cache ostaju uklonjeni | Kasni uspjeh vraća sadržaj      |
| Potvrda nadživi identitet zadatka              | Ponovna provjera vlasnika               | Kriva stara radnja šalje se     |

Prvih pet imaju konkretne varijante u izvorima. Posljednje je obvezan dizajnerski scenarij pri prilagodbi generacija, a ne tvrdnja da ga svaki suite već pokriva. Oko novog awaita dodajte točne provjere vlasnika.

## Odvojite potvrdu i lokalni učinak

CDA očekuje poziv promatrača potvrđenog rezultata nakon dovršetka zadržanog writea i unmounta, uz nepromijenjenu staru query projekciju. Drugi slučaj opoziva pristup prije rezultata: promatrač smije saznati činjenicu, ali sadržaj ostaje opozvan.

Nemojte to popraviti potiskivanjem svake kasne potvrde. Server činjenica i prihvaćanje trenutačnog UI vlasnika različiti su vijekovi. Promatrač se ne poziva zbog otkazane potvrde, lokalnih izmjena ni odbijene naredbe. Razliku provjerite izravno.

## Pogreške i čišćenje

Zadržani rad razriješite ili otkažite cleanupom sigurnim nakon pogreške. Očistite vlasnike i vratite mockove; nerazriješeni promise može utjecati na susjede. Nemojte koristiti proizvoljna čekanja ni slučajan retry poredak.

Pregledajte preostale grane: stari `finally` može ukloniti zauzetost novog vlasnika i kada je uspjeh zaštićen. Isti vlasnik ne treba gubiti koristan rad pri svakom osvježavanju. Simulacija aborta ne dokazuje browser transport; odaberite granicu prema tvrdnji.

## Scenariji prihvaćanja

Utrka treba otkriti uklonjen late-result guard i uz postojeći abort. Istek se ne vraća starim dohvatom. Prijava preživljava stari anonimni odgovor. Opoziv uklanja unos prije dovršetka i ostaje poslije. Otkazana potvrda šalje nula writeova. Cleanup završava svaki zadržani rad bez starog vlasnika.

## Izbjegnite ove prečace

Nemojte koristiti samo odmah razriješene promisee, abort bez kasnog odgovora, spavanje kao sinkronizaciju ni mounted kao ovlast. Kontrolirajte raspored i provjerite aktualne učinke i stare neučinke.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/features/development-guide/patterns/forms/components/AsyncLookupsPanel/useAsyncLookup.test.tsx` — transport koji ignorira abort i kasni stari odjel.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/createAppAuthRuntime.test.ts` — zadržani identitet i konkurentski ishodi sesije.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/tests/features/specifications/hooks/useSpecificationEditor.test.tsx` — write, unmount i opoziv te odvojeni promatrač i zabrana povratka.
