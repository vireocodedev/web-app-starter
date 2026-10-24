# Offline namjeru trajno spremite kao naredbu s vlasnikom

Pokazatelj offline uspjeha mora značiti više od promijenjenog ekrana. Ako promjena kasnije mora stići poslužitelju, prije tvrdnje o zadržanom radu trajno spremite stabilnu naredbu s vlasnikom i ovisnostima. Lokalne modele čitanja i namjere u redu držite odvojeno kako osvježavanje predmemorije ne bi obrisalo neposlanu radnju.

Ovo je **referentni protokol nadahnut povijesnim LMS kodom**, a ne ugrađeni starter outbox. LMS sprema sync naredbe s UUID ključem u IndexedDB, dodjeljuje metapodatke poretka i prati privremene identitete entiteta. Pregledani offline adapteri entitet i red upisuju odvojenim pozivima. To **ne** dokazuje atomsku trajnost oba zapisa; produkcijska prilagodba treba izričitu transakciju ili oporavljivi dnevnik.

## Okidač i vlasnik

Trajni red koristite za izričito podržane offline naredbe sa stvarnim kasnijim učincima. Feature definira shemu naredbe i lokalnu projekciju. Vlasnik reda upravlja pohranom, podjelom vlasnika, poretkom, ponavljanjem i usklađivanjem. Poslužitelj definira deduplikaciju, autorizaciju, razrješavanje privremenih identiteta i potvrde ishoda.

LMS naredba sadrži UUID, entitet i radnju, ciljni i rezultatni ID, sadržaj, neobvezni poslovni ključ, klijentsko vrijeme i sekvencu. Store je ključan UUID-om pa ponovni lokalni upis iste naredbe zamjenjuje taj ključ. Lokalna zamjena ne dokazuje sigurnost dvostrukog slanja poslužitelju.

Izvor prikazuje red prema vremenu. Zaseban servis sekvence daje dopunski poredak dokumentiran za backend. Zidni sat nije graf ovisnosti, a sekvenca iz local storagea nije zaključavanje alokacije među karticama. Novi proizvod treba definirati jamstva konkurentnosti i poretka svojeg okruženja.

## Zajedno potvrdite lokalno stanje i namjeru

Ovo je **predložena neutralna omotnica**, a ne ugrađeni API:

```ts
type QueuedCommand = {
  commandId: string;
  owner: { viewerId: string; workspaceId: string };
  kind: "create-document" | "rename-document";
  localEntityId: string;
  dependsOn: string[];
  payloadVersion: 1;
  payload: unknown;
  state: "queued" | "sending" | "needs-reconciliation";
};

// Jedna lokalna transakcija: projekcija + naredba + metapodaci ovisnosti.
// Tek nakon commita: status lokalnog zadržavanja i osvježavanje prikaza reda.
```

Pregledani LMS adapter komentara prvo poziva `put(stored)`, a zatim `enqueueSyncCommand`. Pad procesa ili pogreška drugog upisa između njih može ostaviti vidljiv entitet bez odgovarajuće namjere u redu. Nemojte kopirati slijed i nazvati ga atomskim. Potrebne storeove uključite u jednu IndexedDB transakciju ili dizajnirajte dnevnik čija se nepotpuna stanja mogu prepoznati i popraviti nakon restarta. Točno rješenje pripada vlasniku pohrane.

Nemojte ažurirati signal reda prije trajnog commita i koristiti ga kao dokaz zadržavanja. Nakon restarta signal rekonstruirajte iz trajnih zapisa; prazan signal nije dokaz praznog reda. Pogreške kvote, nadogradnje sheme i pristupa obradite bez odbacivanja sigurnog unosa.

## Sačuvajte identitet i ovisnosti

LMS koristi negativne privremene ID-eve i trajno spremljen opadajući brojač. Negativni ID-evi jedan su protokol proizvoda, ne zahtjev novih featurea. Stabilni klijentski UUID-i druga su mogućnost ako backend pristane. Razlikujte identitet naredbe i lokalnog entiteta: više naredbi može ciljati isti entitet, a stvaranje može proizvesti identitet potreban kasnijoj izmjeni.

Stvaranje pa izmjena ili brisanje ne smiju se izvršiti proizvoljnim redom. Spremite ovisnosti ili dogovoreni potpuni poredak i sačuvajte mapiranje lokalnog u server identitet kroz potvrdu i restart. Pregledani komentari razlikuju se u opisu uloge poslovnog ključa u mapiranju; nemojte iz frontend komentara zaključiti potpuni backend resolver. Ugovor potvrdite kod stvarnog poslužiteljskog vlasnika.

Red podijelite prema korisniku i prostoru te odredite učinak odjave, opoziva i uklanjanja prostora na privatni čekajući rad. Naredbu ne izvršavajte vjerodajnicama sljedećeg korisnika samo zato što je ostala u pregledniku. Ponavljanje čuva izvorni ID i sadržaj; promjena namjere nova je naredba uz usklađivanje neizvjesnog prethodnika.

## Odluke o pogreškama i oporavku

| Mjesto pogreške                           | Trajna činjenica                 | Potreban oporavak                                  |
| ----------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Lokalna transakcija ne uspije             | Nema obećanja zadržane naredbe   | Sačuvajte unos i objasnite pohranu                 |
| Proces stane nakon lokalnog commita       | Naredba je u redu                | Obnovite iz pohrane                                |
| Odgovor izgubljen nakon slanja            | Udaljeni ishod neizvjestan       | Ponovite isti identitet ili dohvatite potvrdu      |
| Stvaranje prihvaćeno, ovisna izmjena čeka | Mapiranje i poredak još vrijede  | Razriješite identitet prije ovisnog izvršenja      |
| Korisnik promijenjen                      | Stari red ima drugog vlasnika    | Pauzirajte ili razdvojite; ne preimenujte vlasnika |
| Shema sadržaja se promijeni               | Stare naredbe i dalje su namjera | Namjerno migrirajte ili ponudite ručni oporavak    |
| Osvježavanje snimka predmemorije          | Red ostaje odvojen               | Sačuvajte outbox i uskladite projekcije            |

Uklanjanje naredbe također je vidljiva odluka. Otkazivanje neposlane naredbe može zahtijevati poništavanje lokalne projekcije i ovisnih naredbi. Već poslana ili prihvaćena naredba ne otkazuje se brisanjem lokalnog retka; udaljeni ishod treba uskladiti. Sigurnu dijagnostiku ograničite na ID-eve i stanje, bez ispisa cijelog privatnog sadržaja.

## Scenariji prihvaćanja

Odbijte upis reda dok bi projekcija entiteta uspjela: UI ne smije tvrditi zadržanu naredbu bez oporavljivog dnevnika. Restartajte nakon commita: isti ID-evi i ovisnosti vraćaju se. Pošaljite dvaput nakon gubitka odgovora: dogovorena server potvrda sprječava duplikat. Stvorite lokalno pa izmijenite: izmjena cilja razriješeni entitet pravim redom. Promijenite korisnika: naredbe ne prelaze podjelu. Nadogradite shemu: stara namjera ne odbacuje se tiho ni izvršava s novim značenjem.

Prikažite lokalizirana stanja reda, neizvjesnosti, pogreške i dovršetka s točnim opsegom i oporavkom. „Spremljeno lokalno; čeka sinkronizaciju” razlikuje se od potvrđenog dovršetka na poslužitelju.

## Izbjegnite ove prečace

Nemojte outbox držati samo u memoriji, mijenjati ID-eve pri ponavljanju, resetirati brojače uz stare reference, izvršavati ovisnosti krivim redom, dijeliti red bez vlasnika ni dva neovisna upisa nazvati atomskim. Trajnost je protokol pohrane i poslužitelja, ne zelena oznaka.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncQueueService.ts` — UUID IndexedDB red i vremenski poredak.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/utils/enqueueSyncCommand.ts` — omotnica i trajni upis prije signala.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/models/LmsSyncCommand.ts` — shema, identiteti i dokumentirana namjera poretka i mapiranja.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncIdService.ts` — povijesni trajni brojač privremenih ID-eva i granice opsega.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncSequenceService.ts` — povijesni trajni brojač sekvence.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shiftComment/api/shiftComment.offline.ts` — odvojeni upisi entiteta i reda bez pokazane atomske transakcije.
