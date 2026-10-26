# Tretirajte CSV kao ograničen jezik za razmjenu

**Podrška: referentni recept.** `BankStatementV1` iz Client Discoveryja namjerno je uzak parser. Nije instalirani helper startera ni opći alat za uvoz proračunskih tablica. Primijenite obrazac kada strojno proizvedena datoteka treba postati zapis koji se može pregledati, bez promjene značenja zbog previše popustljivog parsiranja.

## Odvojite ugovor bajtova, gramatike i semantike

Parser u navedenoj reviziji prvo odbija ulaz veći od 10 MiB. UTF-8 dekoder prijavljuje neispravan ili nepreslikiv ulaz umjesto da ga zamijeni znakom zamjene. Zamjena bi prikrila koje je bajtove pošiljatelj dostavio. Zatim se zahtijeva točno zaglavlje s dvanaest stupaca u zadanom redoslijedu. Promijenjeni naziv, redoslijed ili dodatni stupac ne postaju prešutno nova verzija formata. UTF-8 BOM ne uklanja se posebno pa mijenja prvu ćeliju zaglavlja i usporedba ne prolazi.

CSV automat podržava zarez, ćelije u navodnicima, udvostručene navodnike unutar takve ćelije, prijelom retka unutar navodnika te CR, LF i CRLF završetke zapisa. Odbija nezatvorene navodnike, navodnik nakon već prikupljenog teksta izvan navodnika i tekst nakon zatvorenog navodnika. Razmak nakon zatvorenog navodnika također je tekst; parser ne provodi opće podrezivanje. Prazan završni zapis bez navodnika ne mora postati dodatni redak, dok stvarni prazan zapis unutar datoteke kasnije pada na provjeri dvanaest polja. Dokumentirajte ovu gramatiku umjesto opće tvrdnje o CSV kompatibilnosti.

Ograničenja su slojevita:

| Sloj                | Uočena politika izvora                       | Što ne dokazuje                                       |
| ------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Izvorni ulaz        | Najviše 10 MiB                               | Streaming ili ograničenje HTTP tijela prije alokacije |
| Zapisi              | Najviše 5.000 podatkovnih zapisa i zaglavlje | Da je svaki zapis kvalificirana činjenica             |
| Prikupljanje ćelije | Najviše 4.096 Java znakova                   | Najviše 4.096 UTF-8 bajtova                           |
| Parsirano polje     | Najviše 4.096 UTF-8 bajtova                  | Da semantika svakog polja dopušta tu duljinu          |
| Podatkovni zapis    | Točno dvanaest polja                         | Autentično podrijetlo ili ispravan poslovni učinak    |

Brojke su politika referentnog projekta. Consumer određuje svoje granice i ograničava upload prije pozivanja parsera; pogledajte [ograničene uploadove i zajedničke kvote](./bounded-uploads-and-shared-quotas.md).

## Nakon parsiranja provjerite značenje

Svaka podatkovna ćelija provjerava se na NUL i odabrane početne znakove (`=`, `+`, `@`). Prazna ćelija postaje null. Identitet računa mora točno odgovarati računu odabranom naredbom, a identitet transakcije mora biti jedinstven unutar ovog uvoza. Datumi prolaze strogi parser kalendarskog datuma, smjer i status allowlistu, iznosi parser pozitivnog točnog decimalnog stringa, a valuta i opcionalni tekst dodatne provjere.

Skup transakcijskih identiteta vrijedi samo unutar datoteke. Ne dokazuje deduplikaciju među uvozima, da transakcija nikad nije iskorištena ni pravo na prepisivanje starog opažanja. To pripada vlasniku trajno zadržanog uvoza i usklađenja. Sintaksa iznosa također ne potvrđuje pregledani broj decimalnih mjesta valute; to provjerava kasnija kvalifikacija. Slijedite [točne decimale i politiku zaokruživanja](../data/exact-decimals-and-rounding-policy.md).

Odbijanje prefiksa formula ograničeno je pravilo ulaza. Ne obuhvaća svaki okidač proračunske tablice, početne razmake, sve kontrolne prefikse, početni minus ni ponašanje svih programa. Datoteka prihvaćena za softversku razmjenu zato nije automatski sigurna za otvaranje u svakoj tablici. Spreadsheet izvoz treba zaseban izričit ugovor. Mijenjanje izvornih bajtova radi neutraliziranja formula ujedno bi promijenilo identitet dokaza.

## Primjer implementacije u consumeru

Sljedeće je **pseudokod**, ne instalirani API. Nedostaju vlasnici ograničenog čitanja bajtova, registra formata, strogog dekodera, parsera, autorizacije računa i pohrane izvornog artefakta.

```text
authorizeImport(actor, selectedSource)
original = retainBoundedOriginal(upload, configuredByteCeiling)
text = decodeReportingUtf8(original.bytes)
rows = parserFor(exactFormatVersion).parse(text, grammarBudget)
requireExactHeader(rows.header)
entries = validateRows(rows, selectedSource.accountKey)
retainParsedObservation(original.id, parserVersion, entries)
return observationId // još nije kvalificirani poslovni učinak
```

Zadržite izvorni artefakt i identitet parsera da bi se naknadna korekcija mogla objasniti. Nemojte preskočiti neispravne zapise pa prijaviti da je cijela datoteka uspješno uvezena. Ako proizvod zahtijeva djelomičan prihvat, uvedite izričite ishode po zapisu i ugovor identiteta/digesta umjesto usputnog slabljenja parsera.

## Pogreške, oporavak i slučajevi prihvata

Odbijeno zaglavlje ili neispravna ćelija ne stvaraju kvalificirani učinak. Ispravite exporter ili odaberite izričito podržanu verziju pa ponovite kroz vlasnika uvoza. Odbijanje zbog broja bajtova ne smije ispisati sadržaj u log. Duplikat je smislena validacijska pogreška, a ne razlog da ostane prvi redak.

Definirajte slučajeve s višebajtnim tekstom koji prijeđe granicu bajtova prije granice znakova, escapeanim navodnicima, prijelomom retka u navodnicima, tekstom nakon zatvorenog navodnika, različitim završecima retka, BOM-om, pogrešnim brojem polja, duplikatom i tuđim računom. Odvojeno dokažite da prihvaćena datoteka ostaje nekvalificirana do dovršetka provjere podrijetla. To su zahtjevi prihvata, ne tvrdnja da ih starter već instalira ili izvršava.

## Izvor

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankStatementV1.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingData.java`
