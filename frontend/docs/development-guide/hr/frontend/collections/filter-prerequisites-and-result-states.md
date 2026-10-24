# Razlikujte nedostajući filtar i prazan rezultat

Tablica koja nije pokrenula query nema nula podudarnih zapisa. Još nema rezultat. Odvojeno modelirajte preduvjet, početni dohvat, osvježavanje sa zadržanim podacima, uspješnu prazninu, pogrešku i zabranu kako bi poruka govorila istinu i nudila pravu radnju.

Ovo je **referentno preciziranje** povijesne LMS tablice. Pregledani `ShiftTable` zahtijeva barem jedan aktivan filtar prije rezultata i inače traži prilagodbu filtara. Njegov fallback pokriva i nedostajuće podatke pa nije cjelovit stroj stanja. Nova implementacija treba izričita značenja umjesto jedne poruke za svaku odsutnost.

## Okidač i vlasnik

Stanje preduvjeta koristite kada bi neograničen query bio skup, zadatak zahtijeva prostor ili razdoblje, ili backend traži filtar. Vlasnik kolekcije definira preduvjet i identitet zahtjeva. Tablica prikazuje stanje. Poslužitelj provodi granice i autorizaciju; onemogućen klijentski query ne štiti endpoint.

Unesene filtre odvojite od normaliziranog prihvaćenog zahtjeva ako postoji radnja Primijeni. Odlučite pokreće li promjena odmah dohvat ili čeka slanje. Upozorenje treba imenovati točno nedostajući filtar, a ne tvrditi da poslovnih zapisa nema.

## Predstavite stvarni rezultat

Ovo je **konceptualni pseudokod**, a ne ugrađeni query API:

```ts
type ResultState<Row> =
  | { kind: "filter-required" }
  | { kind: "loading" }
  | { kind: "ready"; rows: Row[]; refreshing: boolean }
  | { kind: "failed"; retainedRows?: Row[] }
  | { kind: "denied" };

// ready + rows.length === 0 znači uspješan prazan rezultat.
// filter-required ne govori ništa o veličini kolekcije.
```

Zadržani retci trebaju poznat zahtjev i vlasnika. Nakon promjene filtra nemojte ih prešutno označiti novim rezultatom. Zadržite ih uz izričitu oznaku prethodnih rezultata ili prikažite novo početno učitavanje prema pravilima featurea.

| Stanje                            | Korisna poruka ili radnja                           |
| --------------------------------- | --------------------------------------------------- |
| Nedostaje preduvjet               | Imenujte potreban filtar i fokusirajte kontrolu     |
| Početni zahtjev traje             | Učitavanje bez tvrdnje o praznini                   |
| Uspješno nema podudaranja         | Objasnite i ponudite promjenu filtra                |
| Osvježavanje postojećeg rezultata | Zadržite kompatibilne retke i označite osvježavanje |
| Pogreška uz zadržane retke        | Označite zastarjelost i ponudite ponavljanje        |
| Zabrana pristupa                  | Politika ovlasti, ne odsutnost podudaranja          |

## Pogreške i oporavak

Timeout i 403 trebaju različitu obradu. Nemojte brisati koristan dopušten rezultat pri prolaznoj pogrešci ni čuvati zabranjene retke nakon opoziva zbog praktičnosti. Query opseg i privatna predmemorija ostaju zasebni vlasnici tih odluka.

Kada mutacija ukloni posljednji redak, utvrdite znači li to praznu stranicu ili cijelu filtriranu kolekciju. Prije opće praznine uskladite paginaciju. Nedostajući preduvjet također ne treba nepotrebno resetirati ostale valjane filtre.

## Scenariji prihvaćanja

Otvorite stranicu bez obveznog filtra: nema tvrdnje o nula zapisa. Primijenite valjan filtar bez podudaranja: uspješna praznina. Odbijte početni dohvat: ponovni pokušaj. Odbijte osvježavanje: dopušteni podaci jasno su zastarjeli. Promijenite filtar uz spor dohvat: stari rezultat ne može postati novi. Opozovite pristup: zabrana zamjenjuje prikaz i uklanja ograničene podatke.

Svako stanje lokalizirajte zasebno. Radnju preduvjeta učinite dostupnom tipkovnicom, povežite nazive s kontrolama i nemojte premještati fokus pri svakom pozadinskom stanju. Objave pomoćnim tehnologijama trebaju opisati smislene promjene bez stalnog čitanja cijele tablice.

## Izbjegnite ove prečace

Nemojte svim stanjima dodijeliti `null`, prikazati prazninu prije završetka queryja, sakriti pogrešku u savjet filtra ni prethodne retke prikazati kao svježe. Male izričite razlike sprječavaju pogrešne odluke korisnika.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shift/components/ShiftTable/ShiftTable.tsx` — preduvjet aktivnog filtra, roditeljski rezultat i ograničenje zajedničkog fallbacka.
