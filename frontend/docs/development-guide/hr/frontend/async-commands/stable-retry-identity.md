# Zadržite jedan identitet zahtjeva za naredbu nepoznatog ishoda

Zahtjev se može potvrditi na poslužitelju, a njegov se odgovor izgubiti. Ponovno slanje s novim UUID-om može stvoriti drugu registraciju ili ponoviti odluku. Jednoj logičkoj naredbi dodijelite stabilan identitet zahtjeva i zadržite ga dok je potvrda ishoda neizvjesna.

Ovo je **referentni fullstack protokol**, a ne ugrađeno ponašanje starter mutacija. client-discovery-app povezuje frontend omotnicu ponovnog pokušaja s transakcijskim backend potvrdama zahtjeva. Sam frontend UUID ne osigurava idempotentnost. Prije uključivanja ponavljanja u drugom featureu odredite poslužiteljski opseg potvrde, usporedbu sadržaja, autorizaciju, zaključavanje i pravilo zadržavanja.

## Okidač i vlasnik

Protokol koristite za naredbe kod kojih su ponovljeni učinci problem, a gubitak odgovora nije dokaz poništenja. Primjeri su registracija verzije dokumenta, slanje točne odluke ili stvaranje resursa preko nepouzdane veze. Ponavljanje dohvata i idempotentna zamjena imaju drukčije zahtjeve; nemojte slijepo primijeniti generičnu politiku ponavljanja zapisivanja.

Sesija nacrta ili uređivača posjeduje `{payload, id}`. Identitet sadržaja obuhvaća sve činjenice koje određuju naredbu: očekivanu reviziju, očekivani token i tijelo naredbe. Korisnik, radni prostor i ciljni zapis određuju okolnog vlasnika. Pregledani uređivač za isti serijalizirani sadržaj ponovno koristi isti UUID. Promijenjeni sadržaj dobiva novi UUID. Dugovječnija sesija registracije zadržava taj identitet kroz svoje prijelaze između ruta, a uklanja ga pri promjeni vlasnika, uočenom opozivu, izričitom odbacivanju i potvrđenom dovršetku.

To je ograničeno zadržavanje u memoriji. Ne jamči preživljavanje zatvaranja kartice ni ponovnog pokretanja preglednika. Trajni ponovni pokušaji zahtijevaju namjerno osiguran outbox i ugovor poslužiteljskog usklađivanja; spremanje osjetljivih naredbi u local storage nije automatski nastavak ovog obrasca.

## Zabilježite jednu nepromjenjivu naredbu

Neutralni primjer je **pseudokod**, a ne helper koji se uvozi iz startera:

```ts
type Attempt = { payload: string; id: string };
let attempt: Attempt | undefined;

function requestId(payload: string): string {
  if (attempt?.payload !== payload) {
    attempt = { payload, id: crypto.randomUUID() };
  }
  return attempt.id;
}

const payload = JSON.stringify({ expectedRevision, expectedToken, command });
const id = requestId(payload);
// Pošaljite upravo zabilježeni sadržaj s id-em; ponovno koristite oboje pri neizvjesnom ishodu.
```

`JSON.stringify` ovdje uspoređuje lokalnu naredbu koja se dosljedno konstruira. Nije kriptografska potvrda ni univerzalna specifikacija kanonskog JSON-a. Referentni backend računa hash svoje kanonske serijalizacije. Drugi klijent može drukčije poredati svojstva, pa poslužiteljska ekvivalentnost mora biti definirana neovisno o usporedbi stringova u pregledniku.

Zadržite osnovu uređivanja. Osvježavanje ne smije prešutno zamijeniti reviziju u neizvjesnom ponovnom pokušaju. Ako korisnik promijeni unos ili izričito prihvati drugu osnovu, to je drugi identitet naredbe. Prije slanja druge naredbe nakon neizvjesnog ishoda, prema potrebi razriješite prethodni ishod; novi ID ne uklanja prethodni učinak.

## Backend polovica obvezna je

Pregledani servis specifikacija zaključava red projekta odgovarajućeg opsega, provjerava oblik naredbe i trenutačnu autorizaciju pa traži postojeću potvrdu zahtjeva. Prepoznavanje prethodnog izvršenja dolazi prije odbijanja stare očekivane revizije: prvo uspješno izvršenje prirodno ju je povećalo. Helper potvrde provjerava istog aktera i jednak hash kanonskog sadržaja. Ponovna upotreba ID-a s drukčijim sadržajem predstavlja sukob; drugi akter ne može naslijediti potvrdu.

Promjena i zapis potvrde odvijaju se u istoj transakciji. Ponovljeni zahtjev vraća trenutačnu dopuštenu projekciju radnog prostora i `replayed: true`; to ne jamči bajt-po-bajt isti izvorni odgovor. Točnu semantiku ponavljanja dokumentirajte za svaki protokol. Bitni su i opseg i imenski prostor naredbe: UUID ne smije semantički zamijeniti nepovezanu operaciju istog vlasnika.

| Situacija                              | Odluka o identitetu                         | Oporavak                                                |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Odgovor izgubljen, sadržaj isti        | Isti ID i zabilježeni sadržaj               | Ponovite kroz poslužiteljski ugovor potvrde             |
| Korisnik izmijeni polje                | Novi logički sadržaj dobiva novi ID         | Prvo razriješite eventualni neizvjesni prethodni učinak |
| Izričito promijenjena očekivana osnova | Novi identitet naredbe                      | Uskladite i ponovno validirajte                         |
| Potvrda uspije                         | Očistite identitet čekajućeg pokušaja       | Prikažite trajni rezultat i osvježite projekcije        |
| Korisnik ili ovlast se promijeni       | Poništite pravo stare sesije na ponavljanje | Nemojte ponavljati pod drugim korisnikom                |

## Pogreške i oporavak

Timeout znači da ishod možda nije poznat; ne dokazuje neuspjeh. Lokaliziranom porukom razlikujte neizvjesnost od poznatog odbijanja. Sigurno ponavljanje ponudite samo ako poslužitelj podržava protokol. Bez potvrda zahtjeva dohvatite autoritativno stanje ili ponudite usklađivanje umjesto automatskog ponavljanja zapisivanja.

Sukob može značiti zastarjelu reviziju ili nepodudaranje sadržaja pod istim ID-em. Sačuvajte stvarni poslužiteljski ugovor kako bi UI odabrao pravi oporavak umjesto univerzalne poruke „pokušajte ponovno”. Gubitak ovlasti ne smije otkriti staru potvrdu ili privatni rezultat. Abort i odlazak s rute ne poništavaju potvrđenu poslužiteljsku transakciju.

## Scenariji prihvaćanja

Potvrdite naredbu na poslužitelju, izgubite odgovor i ponovno pošaljite istu omotnicu: postoji točno jedan poslovni učinak, a odgovor označava prethodno izvršenje prema ugovoru. Pošaljite isti ID s izmijenjenim sadržajem: poslužitelj ga odbija. Pokušajte kao drugi akter: pristup potvrdi nije dopušten. Izmijenite nacrt nakon neizvjesnog rezultata: UI ne šalje automatski novu dvostruku naredbu. Nakon potvrđenog uspjeha namjerno pokrenite drugu radnju: prethodni identitet ponavljanja je očišćen.

## Izbjegnite ove prečace

Nemojte stvarati UUID po transportnom pokušaju, koristiti jedan UUID za sve izmjene, globalno ponavljati proizvoljne POST zahtjeve ni poistovjećivati klijentski abort s rollbackom. Nemojte obećavati „točno jednom” na temelju klijentskog refa. Korisno jamstvo proizlazi iz autoriziranog, atomskog poslužiteljskog protokola potvrda ograničenog opsegom i stabilnog klijentskog identiteta naredbe.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — identitet revizije, tokena i naredbe te životni vijek omotnice ponavljanja.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationRegistrationSession.ts` — identitet zahtjeva u sesiji nacrta i čišćenje pri promjeni vlasnika ili opozivu.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/SpecificationService.java` — transakcija, zaključavanje, autorizacija, provjera potvrde prije revizije i odgovor s trenutačnom projekcijom.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/SalesService.java` — provjera aktera i hasha kanonskog sadržaja potvrde zahtjeva.
