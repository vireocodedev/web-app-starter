# Jedan snapshot za retke i metapodatke stranice

**Status podrške: referentni recept potkrijepljen izvorom.** Client Discovery browse metoda izričito spaja read-only transakciju i PostgreSQL REPEATABLE READ kako count, opcije, stranica i povezane permission projekcije koriste isti snapshot. Predložak ne ugrađuje tu izolaciju na sva čitanja niti ima opći snapshot-response helper.

Koristite obrazac kad odgovor obećava usklađen total, facet opcije i retke uz konkurentno uređivanje. Read-only anotacija opisuje namjeru pristupa; sama ne jamči da više SQL naredbi vidi isto potvrđeno stanje.

## Ograničenje ugrađenog PageResponsea

[Starter page DTO](jpa-repositories-fetch-plans-and-projections.md) definira oblik i granice. Referentni readOnly list ne obećava zajednički count/row snapshot pod READ COMMITTED. Feature koji obećava koherentne metapodatke mora izričito odabrati transaction/isolation politiku ispod; readOnly ili stabilan sort nisu dovoljni.

## Precizno odredite obećanu dosljednost

Uz uobičajeni PostgreSQL READ COMMITTED odvojene naredbe mogu vidjeti različita potvrđena stanja. Count završi, druga transakcija umetne ili arhivira red, a page upit vidi novo stanje. Svaki iskaz pojedinačno može biti točan dok je sastavljeni odgovor proturječan.

Discovery browse koristi `@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)`. Zatim count, option i row upite izvodi iz iste permission-aware baze, uz povezane deletion-eligibility upite unutar metode. Izvor izričito obećava isti PostgreSQL transakcijski snapshot i timestamp za te naredbe.

| Jamstvo                         | Značenje                                                 |
| ------------------------------- | -------------------------------------------------------- |
| Snapshot jednog odgovora        | Povezana čitanja opisuju jedno dosljedno vidljivo stanje |
| Read-only namjera               | Metoda nije mjesto poslovne promjene                     |
| Stabilan poredak                | Jednake vrijednosti imaju sekundarni ID redoslijed       |
| Snapshot kasnijih page zahtjeva | Zaseban ugovor; anotacija ga ne daje                     |

Jamstva se nadopunjuju, ne zamjenjuju. Fiksni snapshot ne popravlja nedostajuće ovlasti, nestabilan sort ili neograničen exact count.

## Cijeli odgovor držite unutar granice

Count iz izvora odabire i `current_timestamp`, vraćen kao `checkedAt`. To je database transaction vrijeme, ne tvrdnja svježine do browser rendera ili provjere svih vanjskih sustava. `coverage: COMPLETE` vrijedi za ograničenu dopuštenu browse projekciju, ne za nepovezane operativne domene.

**Pseudokod recepta:** `visible`, `metadata`, `rows` i `PageView` suradnici su projekta, ne importi predloška. Prije prilagodbe implementirajte scoped upite, DTO-e, binding i index/timeout politiku.

```java
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public PageView browse(BrowseRequest request, Authentication auth) {
    var projection = visible.forCurrentActor(auth, request);
    var summary = metadata.countAndCheckedAt(projection);
    var options = metadata.options(projection.withoutItsOwnFacetSelection());
    var page = rows.page(projection, request.offset(), request.limit());
    return new PageView(page, options, summary.total(), summary.checkedAt());
}
```

Facet iznimka namjerna je: dropdown može izostaviti vlastiti odabrani filtar uz ista pravila vidljivosti, pretrage i stanja. Jedan snapshot ne zahtijeva iste predikate, ali razlika mora pripadati javnom ugovoru, ne slučajnom count odstupanju.

Granica mora stvarno prolaziti Spring interceptionom ili transaction templateom. Self-invoked anotacija ne stvara neovisan snapshot. Metoda koja se pridruži postojećoj transakciji može naslijediti njezinu izolaciju; unutarnja anotacija ne nadograđuje je automatski. Pri kompoziciji pregledajte caller/transaction-manager ugovor.

## Odvojite database dosljednost i distribuiranu svježinu

Vanjski provider pozvan između counta i redaka ne dijeli PostgreSQL snapshot. Agregator sa zasebnom REPEATABLE READ transakcijom po contributoru ima dosljedna pojedinačna čitanja, ne globalni snapshot svih izvora. Kad je to dizajn, prikažite odvojenu coverage/freshness informaciju.

Dva HTTP page zahtjeva također obično imaju dvije transakcije. Stabilan offset poredak ipak se pomiče nakon inserta; potpisani cursor može otkriti promjenu projekcije ili tražiti stabilni ključ, ali to su dodatni protokoli. Timestamp odgovora nije snapshot token za ponovnu uporabu bez implementirane retained-snapshot semantike.

Read transakciju držite kratkom. Veliki scan, duga petlja ili mrežno čekanje dulje drže snapshot resurse i otežavaju održavanje baze. Najprije odaberite ograničen rad i upit; REPEATABLE READ nije performance popravak. Servis koji mora mijenjati stanje pri prikazu liste treba zasebnu naredbu, ne skrivene writeove pod read-only deklaracijom.

## Kvar i oporavak

Kad obvezni metadata upit zakaže, ne spajajte uspješne retke ranijeg pokušaja i count novog. Ponovite cijelo čitanje u novoj granici prema ograničenoj politici ili vratite nedostupnost. Za namjerno partial ugovor označite nedostajući dio umjesto COMPLETE tvrdnje.

Nepodudaranje broja i redaka zahtijeva pregled transaction ulaza, datasource/connection vlasništva, visibility predikata i namjernih facet razlika. Globalno povećanje izolacije ili cache starog totala nije ciljani popravak. Prazna stranica legitimna je kada metapodaci pripadaju istom ugovoru.

## Kriteriji za buduću implementaciju

- Konkurentni insert/archive između naredbi ne mijenja snapshot counta i stranice istog odgovora.
- Facete dijele dopuštenu projekciju uz dokumentirano izostavljanje vlastitog filtra.
- `checkedAt` pripada odabranom database/time vlasniku i ne prikazuje se kao vanjska svježina.
- Nested caller ne može neprimjetno poništiti ugovor izolacije.
- Kasniji HTTP page dokumentiran je kao novo čitanje bez zasebnog retained snapshot mehanizma.
- Neuspjeli dio ponavlja se u dosljednom čitanju ili označava nepotpunost/nedostupnost.
- Read granice ograničene su i ne skrivaju domenske writeove ili vanjski I/O.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseService.java` — read-only REPEATABLE READ, projekcija, count vrijeme, opcije/redci i coverage.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionService.java` — kontrast zasebnih contributor transakcija i globalnog snapshota.
