# Ograničena paginacija i namjenski ugovor sortiranja

**Status podrške: referentni recept potkrijepljen izvorom.** Client Discovery pokazuje strogu offset/limit validaciju i determinističan poredak, a FRED stabilno repository sortiranje. Fleksibilni LMS pageable helper usporedba je sa starijim rizicima neograničenog unosa, ne sigurna zadana postavka za prijenos. Predložak nema univerzalni produkcijski list endpoint.

Koristite obrazac kad lista može prerasti fixture podatke, tablica nudi sortiranje ili se export/lookup zamjenjuje s običnim pagingom. Ugovor rada upita i redoslijeda odredite prije spajanja generičkog UI paginatora.

## Ugrađeni starter page ugovor

[PageResponse i JPA fetch planovi](jpa-repositories-fetch-plans-and-projections.md) definiraju novi default: `{items,page,size,totalItems}`, kopija items, zero-based page, default size 20 i maksimum 100 (minimum 1). Odbijte nevaljani unos i nepodržani sort/direction; koristite feature allowlist i UUID tie-breaker. Ne izlažite Spring Page ni neograničeni negative-size izlaz. Vanjski offset/limit recept zadržava izvorne defaulte.

## Eksplicitno ograničite wire vrijednosti

Discovery browse kontroler prima offset i limit kao stringove. Servis zahtijeva ASCII znamenke, parsira integer i odbija nevaljane ili overflowing vrijednosti. Offset je nenegativan; izvor dopušta limit 1–100, kontroler daje default 25 i ograničava pretragu na 1000 znakova. To su politike peer endpointa, ne univerzalne postavke predloška.

Strogo parsiranje razlikuje nevaljan zahtjev od valjane prazne stranice. Tiha pretvorba `-1`, `1.5`, whitespacea ili proizvoljnog teksta u default skriva client greške i mijenja potrošnju resursa. Projekt bira dokumentiran maximum page size, search granicu i razumnu offset politiku prema cijeni upita.

| Unos                                    | Preporučena odluka ugovora                             |
| --------------------------------------- | ------------------------------------------------------ |
| Limit nedostaje                         | Koristiti dokumentirani default endpointa              |
| Limit prelazi maksimum                  | Odbiti ili izričito skratiti; odabrati i dokumentirati |
| Decimalna/negativna/overflow vrijednost | Odbiti nevaljan unos                                   |
| Valjana stranica iza kraja              | Prazna stranica s dosljednim metapodacima              |
| Proizvoljno sort polje                  | Odbiti ako nema poznat server izbor                    |

Pregledani izvor odbija previsok limit; novi endpoint ne treba tvrditi da ga skraćuje zato što frontend kontrola ima maksimum.

## SQL vrijednosti i struktura traže različitu zaštitu

Search tekst, ID-jeve, offset i limit bindajte kao parametre. Caller SQL stupac ili smjer nisu siguran value placeholder. Fiksni izraz odaberite server allowlistom pa konkatenirajte samo taj pouzdani izraz.

Slijedi **fragment recepta**, ne ugrađeni query helper. Projekt implementira request DTO, validaciju, autoriziranu projekciju, repository metodu, indekse i javno mapiranje pogreške.

```java
String order = switch (request.sort()) {
    case UPDATED_NEWEST -> "updated_at desc, id asc";
    case NAME_ASCENDING -> "display_name asc, id asc";
};
var sql = permittedProjection
    + " select id,display_name,updated_at from visible_records"
    + " order by " + order + " offset ? limit ?";
return db.queryForList(sql, request.offset(), request.limit());
```

Samo enumerirani string čini strukturu. Ne zamjenjujte ga s `request.sortBy()` ili caller fragmentom. UI column ID prevedite u namjenski enum endpointa umjesto izlaganja persistence property naziva kao slučajnog javnog API-ja.

## Uvijek definirajte izjednačenja i null

Discovery koristi `updated_at desc, id asc`. Dva zapisa istog vremena i dalje imaju determinističan poredak. FRED repository metode pri odabiru zadnje sesije slično koriste `RequestedAtDescIdDesc`. Smjer ID-a ne mora biti isti svugdje; bitan je dokumentiran potpuni redoslijed koji dijele upit i eventualni cursor.

Odredite null ponašanje i text collation kad su sort polja nullable ili lokalizirana. Prikazni naziv kolidira i mijenja se; timestamp često ima jednake vrijednosti. Indekse procijenite prema dopuštenim filtrima i stvarnom redoslijedu, ne dodavanjem indeksa svakom UI stupcu. Stabilan redoslijed ne zamrzava podatke između stranica: konkurentne promjene i dalje pomiču offset stranice.

## Ograničenje rezultata nije ograničenje cijelog rada

`LIMIT` ograničava vraćene retke, ne nužno scan, preskakanje offseta, exact count ili facete. Duboki offset može biti skup. Prema rastu odaberite query-side keyset, manji query budžet ili drugi search dizajn; to su implementacijske promjene, ne jamstva paginatora.

Legacy LMS helper prihvaća proizvoljan sort property i negativan page size pretvara u `Integer.MAX_VALUE`; `/all` može tražiti unpaged kolekciju. To možda odražava stare pretpostavke aplikacije, ali nije produkcijski default rastućeg generiranog projekta. Namjerno malen lookup s cijelim rezultatom treba eksplicitni plafon i obrazloženu invarijantu. Export je odvojeni ograničeni/streamed job, ne `limit = unlimited` interaktivne liste.

## Kvar i oporavak

Promjena pretrage, filtra ili sortiranja resetira stranicu/cursor prema frontend URL-state ugovoru. Stari offset prema manjem skupu legitimno može dati prazno; UI može ponuditi prvu stranicu umjesto tihog prepisivanja povijesti. Ne ponavljajte nevaljane paging vrijednosti ili nepodržan sort kao mrežni kvar.

Ako upit prekorači budžet, razlikujte nedostupne/nepotpune podatke od stvarno prazne kolekcije. Manji page size ne popravlja automatski neograničen count ili neučinkovit permission join. Dijagnosticirajte query vlasnika i obećanje odgovora, ne samo tablicu.

## Kriteriji za buduću implementaciju

- Nedostajući paging koristi default; nevaljane, decimalne, negativne i overflowing vrijednosti imaju eksplicitno odbijanje.
- Posebna negativna vrijednost ne zaobilazi plafon obične liste.
- Sort ID/smjer su allowlistani, a caller vrijednosti bindane.
- Jednake sort vrijednosti daju determinističan ID redoslijed i na granici stranice.
- Ovlasti prethode countu i pagingu, bez naknadnog odbacivanja neovlaštenih redaka.
- Valjana prazna završna stranica razlikuje se od nedostupnog upita.
- Query/index pregled obuhvaća count, facete i duboki offset, ne samo broj vraćenih redaka.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseService.java` — stroge integer granice, search plafon, binding i timestamp/ID poredak.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseController.java` — wire defaulti i string paging.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionRepository.java` — stabilan latest-session tie-breaker.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/utils/RestUtils.java` — usporedba legacy proizvoljnog sorta i negativne veličine.
