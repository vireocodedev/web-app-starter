# Razlikujte red, prihvaćanje i dovršenu sinkronizaciju

HTTP prihvaćanje nije dovršen poslovni posao. UI sinkronizacije mora razlikovati lokalno zadržavanje, slanje, poslužiteljsko prihvaćanje, asinkronu obradu i poznat ishod. Inače prazan lokalni red može izgledati kao dovršen rad, a izgubljen heartbeat zauvijek blokirati stranicu.

Ovo je **referentni protokol nadahnut LMS-om**, a ne ugrađeni starter sinkronizator. Pregledani orkestrator sprječava paralelna slanja, šalje snimak i uklanja njegove naredbe nakon uspješnog sync API poziva. Komentari opisuju HTTP 202. Backend napredak prati se zasebnim heartbeat stanjem. Trajna potvrda pojedine naredbe i oporavak nakon pada dodatni su zahtjevi, a ne jamstva ovog frontenda.

## Okidač i vlasništvo

Stroj stanja koristite kada se naredbe obrađuju asinkrono ili mrežna i preglednička pogreška mogu odvojiti upload i konačnu potvrdu. Vlasnik reda drži trajnu lokalnu namjeru. Transportni orkestrator upravlja jednim pokušajem slanja. Poslužitelj upravlja prihvaćanjem i potvrdama izvršenja. UI prikazuje ta stanja bez izmišljanja dovršetka iz povezanosti.

LMS promatra online stanje, dopuštenu ulogu proizvoda i red. Modulna oznaka `flushing` sprječava istodobna slanja u istoj JavaScript instanci. Snima predane naredbe, uključuje freeze signal i šalje snimak. To nije zaključavanje među karticama ni distribuirani lease; novi proizvod treba koordinaciju svojeg stvarnog modela konkurentnosti.

Pregledani API vraća `Promise<void>`, a ne provjeren popis pojedinačno prihvaćenih ID-eva. Nakon uspjeha orkestrator briše ID-eve poslanog snimka i samo njih uklanja iz signala. Kasnije dodane naredbe izvan su tog skupa. To nemojte opisivati kao protokol djelomičnog prihvaćanja bez stvarne podrške backenda.

## Izričito modelirajte trajnu potvrdu

Ovo je **predloženi jači ugovor stanja**, a ne ugrađeni LMS API:

```ts
type CommandStatus =
  | { state: "queued" }
  | { state: "sending"; attemptId: string }
  | { state: "accepted"; receiptId: string }
  | { state: "processing"; receiptId: string }
  | { state: "succeeded"; resultId: string }
  | { state: "failed"; code: string; retryable: boolean }
  | { state: "unknown"; receiptId?: string };

// Prihvaćanje i konačno izvršenje imaju odvojene trajne dokaze.
// Restart razrješava potvrde prije stvaranja nove logičke naredbe.
```

Poslužitelj može atomski prihvatiti cijeli batch, prihvatiti dio ili odbiti slanje. Odaberite jedan ugovor. Ako je dio moguć, parsirajte prihvaćene ID-eve, a ostale zadržite sa stvarnim pogreškama. Nemojte isprazniti cijeli red zbog uspješnog statusa jednog zahtjeva. Uz prihvaćanje sve-ili-ništa dokumentirajte granicu i potvrdu koja ga dokazuje.

Za pouzdan oporavak čuvajte prihvaćenu oznaku ili trajnu referencu potvrde dok se ishod ne može obnoviti. Brisanje jedine lokalne naredbe odmah nakon 202 valjano je samo uz namjerni poslužiteljski oporavak. Reload između prihvaćanja i završnog heartbeata ne smije stvarni posao pretvoriti u prazan prikaz rada.

## Napredak, oporavak i blokiranje UI-ja

LMS razlikuje frontend slanje i backend `syncInProgress`. Heartbeat effecti traže osvježavanje predmemorije kada obrada prijeđe iz aktivne u neaktivnu. To je korisno razdvajanje, ali globalni boolean ne dokazuje konačni ishod svake naredbe. Novi protokol treba identitet naredbe ili batcha te endpoint ili događaj ishoda kada su pojedine pogreške bitne.

| Opaženo stanje    | Poznata činjenica                              | Sigurna sljedeća radnja                                |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------ |
| Lokalni red       | Namjera trajno zadržana prema lokalnom ugovoru | Pošaljite stabilne identitete kada je dopušteno        |
| Slanje            | Zahtjev je u tijeku                            | Spriječite paralelni duplikat                          |
| Izgubljen odgovor | Prihvaćanje ili izvršenje neizvjesno           | Dohvatite potvrdu ili ponovite isti podržani identitet |
| 202 prihvaćeno    | Poslužitelj preuzeo odgovornost za obradu      | Prikažite prihvaćanje ili obradu, ne konačan uspjeh    |
| Heartbeat obrade  | Backend prijavljuje aktivnost opsega           | Nastavite praćenje uz ograničen oporavak               |
| Konačan ishod     | Točan rezultat naredbe poznat                  | Uskladite projekciju i uklonite potvrdu                |
| Heartbeat nestane | Praćenje napretka nedostupno                   | Prikažite neizvjesnost i siguran oporavak              |

Blokada cijelog ekrana može odgovarati kratkom prijelazu bitnom za dosljednost, ali treba ograničen izlaz ili oporavak. Izgubljen završni heartbeat ne smije trajno zarobiti korisnika. Nemojte ni osloboditi ekran u lažno svježoj predmemoriji; zadržite izričitu zastarjelost ili usklađivanje i onemogućite samo radnje s nepoznatim preduvjetima.

## Granice pogrešaka

Ako upload ne uspije prije poznatog prihvaćanja, sačuvajte naredbe za sigurno ponavljanje. Ako je prihvaćanje moguće, sačuvajte neizvjesnost i identitet. Ako lokalno brisanje zakaže nakon prihvaćanja, neki retci možda su već obrisani: pojedinačni pozivi brisanja ne dokazuju atomsko uklanjanje reda. Oporavite se potvrdom i trajnim stanjem, ne pretpostavkom da je catch vratio sve retke.

Nove naredbe tijekom slanja ostaju zasebne. Nakon pokušaja raspoređivanje mora pouzdano primijetiti preostali dopušteni rad; promjena opažena dok je single-flight oznaka postavljena ne smije biti jedini okidač. Pri prilagodbi reaktivnog koda potvrdite ugovor raspoređivanja umjesto pretpostavke da oznaka u memoriji daje potpunu petlju.

Odbijanje, domenski sukob i gubitak ovlasti traže različit oporavak. Nedopuštenu naredbu nemojte beskonačno ponavljati. Zadržite koristan siguran sadržaj za usklađivanje gdje je dopušteno, a privatne podatke podijelite prema izvornom vlasniku.

## Scenariji prihvaćanja

Dodajte naredbu tijekom uploada: uklanja se samo poslani snimak, preostali rad se zakazuje. Vratite 202 uz odgođenu obradu: UI kaže prihvaćeno, ne dovršeno. Reload nakon prihvaćanja: potvrda i dalje omogućuje ishod. Izgubite završni heartbeat: aplikacija nudi neizvjesnost i oporavak bez trajne blokade. Odbijte dio pod ugovorom podskupa: neprihvaćene naredbe ostaju. Odbijte lokalno uklanjanje nakon prihvaćanja: stabilne potvrde sprječavaju dvostruke poslovne učinke tijekom popravka.

Lokalizirajte red, slanje, prihvaćanje, obradu, dovršetak, pogrešku i neizvjesnost. Ponudite točne sljedeće radnje umjesto spinnera bez završnog uvjeta.

## Izbjegnite ove prečace

Nemojte 202, heartbeat ni prazan red proglasiti konačnim uspjehom, brisati izvan poslanog snimka, mijenjati identitete ponavljanja ni pretpostaviti koordinaciju kartica modulnom oznakom. Sinkronizacija je potvrđen stroj stanja kroz dva trajna sustava.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncOrchestrator.ts` — jedan aktivan snimak, uklanjanje njegovih ID-eva, signal slanja i granice dokaza uklanjanja i raspoređivanja.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/api/sync.online.ts` — void upload bez parsiranih pojedinačnih potvrda prihvaćanja.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/heartbeat/signals/sigHeartbeat.ts` — zasebna obrada backenda i kasnije osvježavanje predmemorije.
