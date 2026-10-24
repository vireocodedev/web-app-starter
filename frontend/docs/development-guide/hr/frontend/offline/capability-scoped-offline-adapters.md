# Definirajte offline mogućnost kao izričit ugovor operacije

Nedostupna mreža ne čini svaku poslužiteljsku operaciju sigurnom za lokalno izvršenje. Offline čitanje treba dopušten zadržani skup podataka, a zapisivanje trajne naredbe, semantiku ponavljanja i oporavak sukoba. Prije odabira adaptera odlučite koje operacije podržavaju ta jamstva.

Ovo je **povijesna referentna mogućnost** LMS-a, a ne ugrađeni starter način. LMS zajedničko API sučelje usmjerava na online ili offline implementaciju prema politici operacije, ulozi i dokazima veze. Njegova offline uloga specifična je proizvodu. Starter ne nasljeđuje tu ulogu, predmemoriju ni dopuštenje stavljanja zapisivanja u red nakon pogreške.

## Okidač i vlasništvo

Offline adaptere koristite kada proizvod mora podržati određene zadatke uz povremenu vezu i prihvaća posljedice privatnosti, trajnosti i usklađivanja. API featurea upravlja semantikom operacije. Vlasnik offline politike definira korisnike, operacije, opseg podataka, valjanost i ponašanje nedostupnosti. Poslužitelj upravlja autorizacijom ponavljanja i svakim izričitim ugovorom offline ovlasti.

LMS nabraja API module i članove kroz `ApiSchema`, daje online/offline implementacije i pravila pristupa pojedinih operacija. Neke uloge uvijek koriste poslužitelj, a jedna smije fallback. Metoda bez dopuštene offline implementacije baca pogrešku nepodržanog rada umjesto prijave uspjeha.

Resolver veze koristi heartbeat koji uvažava ulogu i klasifikator prepoznatih pogrešaka. Status 0 ili 503 i određene transportne pogreške bez odgovora mogu uključiti fallback za dopuštenu ulogu. Drugi izričiti statusi ne mogu. Validacija 400, neuspjela sesija 401, zabrana 403 ili sukob 409 osobito ne smiju prešutno postati uspješno zapisivanje u redu.

## Politiku definirajte prije implementacije

Ovo je **predloženi model politike**, a ne ugrađeni helper:

```ts
type OperationPolicy =
  | { mode: "online-only" }
  | { mode: "cached-read"; scope: "viewer-workspace"; maxAgeMs: number }
  | {
      mode: "durable-offline-command";
      scope: "viewer-workspace";
      requiresReceiptProtocol: true;
    };

// Prije fallbacka klasificirajte stvarnu pogrešku.
// Provjerite vlasnika, dostupnost predmemorije i politiku operacije.
// Sigurno pohranite prije tvrdnje da je rad lokalno zadržan.
```

Adapter kompatibilnog sučelja treba sačuvati dokumentirano značenje operacije. Vraćanje entiteta nakon lokalnog upisa ne smije izgledati kao poslužiteljska potvrda. Ako pozivatelji trebaju razlikovati online dovršetak od lokalnog reda, na granici featurea dodajte izričit ugovor ishoda umjesto iste poruke uspjeha.

Povijesni LMS dinamički graditelj spaja module uz castove i ignorirane tipne pogreške. Prenesite granicu sučelja i politike, a ne tu implementaciju kao zadanu apstrakciju. Za ograničen feature mali izričit par injektiranih adaptera često je jasniji. Runtime sheme ostaju nužne za spremljene i dolazne podatke i kada oba adaptera zadovoljavaju TypeScript sučelje.

## Namjerno odaberite fallback

| Uvjet                                                      | Dopušteno ponašanje                                 | Zabranjeni prečac                                 |
| ---------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| Dopuštena svježa predmemorija i podržano čitanje           | Prikažite projekciju uz svježinu                    | Pretvarati se da je to novi poslužiteljski dohvat |
| Podržano zapisivanje s trajnim redom                       | Zadržite naredbu i prikažite čekanje sinkronizacije | Tvrditi da je poslužitelj dovršio                 |
| Nema offline implementacije                                | Prikažite nepodržanu operaciju                      | Izmisliti prazan uspjeh                           |
| Poslužiteljski 403                                         | Primijenite zabranu i opoziv                        | Zaobići autorizaciju redom                        |
| Poslužiteljski 409                                         | Uskladite sukob                                     | Proglasiti ga offline stanjem                     |
| Prepoznat gubitak transporta, korisnik ne ispunjava uvjete | Prikažite neuspjeh i oporavak                       | Posuditi offline politiku druge uloge             |
| Predmemorija nedostaje ili je drugog vlasnika              | Blokirajte zaštićen zadatak                         | Koristiti tuđe zadržane zapise                    |

Heartbeat je ulaz politike, a ne univerzalan dokaz. LMS namjerno ne prebacuje u offline uloge koje nikad ne dobivaju heartbeat samo zato što poruka nema. Mrežna prisutnost preglednika također ne dokazuje dostupnost backenda, autentikaciju ni svježinu predmemorije. Ta stanja držite odvojeno.

## Pogreške i oporavak

Neuspjeh lokalnog upisa, kvote ili IndexedDB-a znači da operacija nije trajno zadržana. Sačuvajte siguran unos i prikažite oporavljivu pogrešku pohrane; potvrdu reda nemojte prikazati samo zato što se adapter pokrenuo. Neizvjestan online ishod treba idempotentnost ili usklađivanje prije stvaranja offline duplikata.

Pri povratku veze nemojte automatski zamijeniti izmijenjeni lokalni prikaz preuzetim poslužiteljskim snimkom. Odvojite lokalne namjere u redu od predmemorije čitanja i uskladite ih protokolom sinkronizacije. Pri odjavi ili promjeni korisnika podatke razdvojite i uklonite prema politici privatnosti i rada u tijeku. Naredbe jednog korisnika nemojte izvršavati kao sljedeći korisnik.

Offline ovlast može isteći ili biti opozvana tijekom prekida. Klijentska capability oznaka ne dokazuje trajno dopuštenje. Proizvod mora odlučiti smije li se pod neizvjesnošću pripremati nacrt, spremati u red ili blokirati rad, a backend ponovno autorizirati ponavljanje. To je poslovna odluka, ne generički mrežni catch.

## Scenariji prihvaćanja

Izvršite dopušteni cached read pravog vlasnika i prikažite starost. Pokušajte nepodržanu operaciju offline: ona izričito ne uspijeva. Vratite online 403 i 409: nijedan nije offline uspjeh. Izgubite transport dopuštene trajne operacije: status reda nastaje tek nakon uspješnog lokalnog commita. Promijenite korisnika: stari podaci i naredbe ne preuzimaju se. Vratite vezu nakon mogućeg online commita: usklađivanje sprječava automatski duplikat. Onemogućite lokalnu pohranu: unos ostaje, a stranica točno kaže da nema trajne naredbe.

Zasebno lokalizirajte offline, zastarjelost, red, nepodržanost, zabranu i usklađivanje. Objasnite koja radnja nije dostupna i što se još može; cijelu stranicu nemojte zamijeniti neobjašnjenom ikonom veze.

## Izbjegnite ove prečace

Nemojte svaki catch koristiti kao fallback, 403 poistovjetiti s prekidom, kopirati LMS uloge u starter, red sakriti porukom „spremljeno” ni uvoditi generički proxy prije jasnog ugovora. Offline rad namjerna je mogućnost s vlasnikom ponavljanja i zadržavanja.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/api/api.ts` — odabir adaptera, uvjeti, nepodržani fallback i klasifikacija transporta.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/api/apiAccessLookup.ts` — izričita politika operacija proizvoda, ne prenosive zadane uloge.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/heartbeat/signals/sigHeartbeat.ts` — dokaz veze prema ulozi i koordinacija osvježavanja.
