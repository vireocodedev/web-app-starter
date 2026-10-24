# Validirajte događaje prije usklađivanja predmemorije određenog opsega

Sadržaj događaja nepouzdan je ulaz i kada je transport autentificiran. Provjerite omotnicu i projekciju entiteta, usmjerite ih vlasniku tog modela čitanja i odlučite je li sigurna izravna zamjena ili ponovni dohvat. Dolazak poruke sam nije dovoljan dokaz za promjenu svih predmemoriranih popisa.

Ovo je **referentni recept** iz LMS-a i FRED-a. LMS prije ažuriranja IndexedDB-a i invalidacije queryja provjerava vrste događaja i sadržaj entiteta. FRED pokazuje pretvorbu DTO-a u prikazni model, ali se oslanja na neprovjereno dekodiranje providera. Nijedan izvor ne dokazuje cjelovit protokol poretka, ponavljanja, uklanjanja duplikata i oporavka rupa. Nova integracija za to treba dodatni backend/frontend ugovor.

## Okidač i vlasništvo

Usklađivanje koristite kada događaji mijenjaju entitet prikazan u više pogleda ili zadržan za offline čitanje. Granica događaja upravlja dekodiranjem i runtime shemom. Vlasnik podataka featurea poznaje shemu entiteta, query ključeve, spremljenu reprezentaciju i zahvaćene sažetke. Vlasnik transporta upravlja vezom; ne treba poznavati članstvo svih filtara tablica.

LMS prvo provjerava posebne oblike događaja, zatim parsira opću omotnicu ažuriranja s tipiziranim ciljem i nepoznatim sadržajem. Sadržaj provjerava registriranom Zod shemom cilja. Tek zatim pokušava IndexedDB upis i invalidira queryje entiteta. Dvostruka granica sprječava da valjan naziv događaja proizvoljni JSON pretvori u pouzdan zapis.

Pregledani handler ignorira pogrešku IndexedDB upisa jer svaki entitet nema store. To je povijesna prilagodba, a ne jamstvo trajne primjene događaja. Novi offline feature mora razlikovati namjerno nepohranjivani entitet od neuspjelog obveznog lokalnog upisa.

## Prije primjene definirajte ugovor događaja

Ovo je **predložena omotnica**, a ne ugrađeni oblik poruke izvora:

```ts
type DocumentEvent = {
  schemaVersion: 1;
  eventId: string;
  workspaceId: string;
  entityId: string;
  revision: number;
  kind: "document-changed" | "document-removed";
};

// Sigurno dekodiranje -> validacija -> vlasnik -> provjera poretka/kursora.
// Primijenite autoritativnu kompatibilnu projekciju ili invalidirajte dohvate opsega.
// Pri nepoznatoj rupi dohvatite autoritativan snimak prije tvrdnje o svježini.
```

Izvorne omotnice imaju type, target, payload i nullable source. Nemojte tvrditi da već osiguravaju predloženi ID događaja, reviziju, kursor ili verziju sheme. Ako backend nema te podatke, konzervativna politika može događaj smatrati signalom invalidacije i dohvatiti aktualno stanje umjesto pokušaja uređenog ponavljanja patcheva.

Potpuna projekcija entiteta ponekad može zamijeniti točan detalj. Djelomični patch ne može ga sigurno zamijeniti bez dokumentiranog ugovora spajanja. Sortirani, filtrirani i paginirani popisi složeniji su: promjena može dodati ili ukloniti članstvo, promijeniti stranicu ili ukupan broj. Invalidirajte obitelj odgovarajućeg opsega umjesto nagađanja izmjena svake varijante.

## Odluke o poretku i pogreškama

| Ulaz ili uvjet                            | Radnja                                     | Posljedica svježine                  |
| ----------------------------------------- | ------------------------------------------ | ------------------------------------ |
| Neispravan JSON ili omotnica              | Sigurno odbijte uz ograničenu dijagnostiku | Bez promjene podataka                |
| Valjana omotnica, nevaljan entitet        | Odbijte nekompatibilnu projekciju          | Označite tok ili model za oporavak   |
| Stari korisnik ili prostor                | Zanemarite prema politici vlasnika         | Bez miješanja privatnog stanja       |
| Duplikat s podržanim identitetom          | Primijenite idempotentno ili preskočite    | Bez dvostrukih redaka i učinaka      |
| Starija revizija uz podržani ugovor       | Ne prepisujte novije stanje                | Zadržite aktualnu projekciju         |
| Nedostaje raspon kursora ili postoji rupa | Dohvatite autoritativno stanje             | Još nema tvrdnje o potpunoj svježini |
| Neuspjeh obveznog IndexedDB upisa         | Zasebno prikažite problem pohrane          | Bez tvrdnje o offline trajnosti      |

Runtime validacija ne dokazuje poredak. Savršeno oblikovan stari događaj može prepisati noviju projekciju. Timestamp također nije nužno potpuni poredak: različiti satovi i jednaka vremena traže dogovoreni protokol. Dokumentirajte prenosi li događaj projekciju, patch ili samo signal promjene.

## Heartbeat i pretvorba modela

LMS parsira heartbeat prije ažuriranja signala i predavanja workeru. To je ograničen vlasnički put živosti, odvojen od ažuriranja entiteta. Heartbeat ne potvrđuje nepovezane naredbe ni primjenu nedostajućeg događaja entiteta.

FRED u handleru vozila pretvara vremenske stringove i koordinate u vrijednosti prikaznog modela. Prenosiva granica je izričit adapter nakon validacije. Novi kod treba provjeriti datume, konačne koordinate i podržane vrijednosti umjesto TypeScript casta ili propuštanja nevaljanih brojeva u kartu i tablicu.

## Oporavak i scenariji prihvaćanja

Pogreška sheme treba sigurnu dijagnostiku vrste i verzije bez bilježenja privatnog sadržaja. Ponavljana nekompatibilnost može tražiti puni dohvat ili vidljivo stanje nedostupnih ažuriranja. Nemojte tiho odbaciti sve pogreške i nastaviti prikazivati svježinu.

Pošaljite nevaljan entitet pod valjanim događajem: predmemorija se ne mijenja. Nakon promjene računa pošaljite događaj starog vlasnika: privatni podaci ne prelaze. Isti podržani događaj pošaljite dvaput: projekcija i brojevi ostaju dosljedni. Pošaljite stariju reviziju nakon novije: dogovoreni ugovor sprječava povratak. Prekinite vezu tijekom promjene pa se vratite: autoritativni dohvat ispravlja rupu. Odbijte obvezni lokalni upis: UI razlikuje žive podatke i trajnu offline dostupnost.

Oporavak zastarjelosti i neuspjelog ažuriranja lokalizirajte odvojeno od praznine. Objavite smislene promjene bez pomicanja fokusa pri svakom osvježavanju; čuvajte stabilne identitete redaka i kontrola.

## Izbjegnite ove prečace

Nemojte vjerovati `JSON.parse(...) as T`, heartbeat proglasiti uspjehom zapisivanja, ručno popravljati svaki popis, jamčiti replay na temelju parsera sheme ni prešutjeti obvezni neuspjeli upis. Događaji trebaju ulaziti kroz usku provjerenu granicu i izlaziti kroz vlasnika zahvaćenog modela čitanja.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/update/handler.ts` — posebni handleri, provjera omotnice i entiteta, neobvezni IndexedDB upis i invalidacija.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/update/type.ts` — opažena polja omotnice bez predloženih replay metapodataka.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/heartbeat/handler.ts` — provjeren signal živosti i predavanje workeru.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/sse/SseVehicleEventData.ts` — izričita pretvorba transportnog modela u prikazni uz ograničenja validacije.
