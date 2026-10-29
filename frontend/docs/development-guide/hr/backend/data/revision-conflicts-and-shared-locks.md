# Konflikti revizija i zajednička zaključavanja invarijanti

**Status podrške: ugrađeni JPA version ugovor s test-only shared-parent lock primjerom te vanjskim receptima.** Starter pruža BaseEntity version mehaniku i sigurne konflikte; svaki feature vodi vlastiti scope i lock protokol. Client Discovery zadržava zasebno opisani body revision dizajn.

Reviziju koristite kad uređivanje mora otkriti zastarjeli korisnički pogled. Zajednički lock koristite kad više naredbi može prekršiti jednu invarijantu i pri pisanju različitih redaka djece. Problemi su povezani, ali različiti: konflikt uređivanja štiti namjeru korisnika, a serializacija valjanost agregata.

## Ugrađeni JPA version protokol

Novi poslovni entiteti koriste BaseEntity `@Version Long`; Response izlaže `version`, PUT/DELETE traže `X-Expected-Version`. [Vlasnik pogrešaka](../foundation/validation-and-error-contracts.md) definira 400/404/409. Usporedite predanu vrijednost s managed entitetom pa JPA štiti concurrent UPDATE/DELETE race. No-op PUT koristi `EntityManager.lock(entity, OPTIMISTIC)` kako bi commit provjerio učitanu verziju i bez dirty UPDATE-a. Ne ponavljajte tiho s novijom verzijom.

Referentni contact write i HARD group delete dijele owned parent pessimistic lock prije provjere/promjene djece. Aktivna ili zadržana djeca blokiraju HARD delete; strani scope ostaje 404. Taj protokol štiti dependency invarijantu, ne zamjenjuje optimistic provjeru namjere. Vanjski expectedRevision recept ispod zadržava svoj body protokol.

## Slijedite stvarni protokol revizije

Discovery zahtjev nosi `expectedRevision`. Parser traži broj koji je nenegativan cijeli broj, umjesto prihvaćanja teksta, negativnih ili decimalnih vrijednosti. Servis ga uspoređuje sa spremljenom revizijom projekta i pri razlici vraća 409. Uspješna promjena metapodataka povećava reviziju unutar iste transakcije kao ažuriranja i audit.

Pregledani izvor provjerava reviziju nakon `FOR UPDATE OF p` zaključavanja projekta. Ne pokazuje generički JPA `@Version` modul ni atomski compare-and-swap helper `UPDATE ... WHERE revision = ?`. To mogu biti drugi dizajni, ali ne treba ih prikazivati kao ugrađeni mehanizam. Novi projekt treba integer DTO i namjeran numerički raspon kako serijalizacija ne bi tiho izgubila preciznost.

| Situacija                                      | Ispravan ishod                               |
| ---------------------------------------------- | -------------------------------------------- |
| Trenutačna revizija jednaka poslanoj           | Nastaviti ostale provjere i atomsku promjenu |
| Trenutačna revizija novija                     | Vratiti konflikt; sačuvati korisnički nacrt  |
| Revizija nedostaje, negativna je ili decimalna | Odbiti nevaljanu naredbu prije promjene      |
| Revizija jednaka, stanje zabranjuje radnju     | Vratiti dokumentirani konflikt stanja        |

Ako dva uređivača počnu na reviziji 7, prvo spremanje potvrđuje 8. Drugi zahtjev sa 7 ne smije se tiho prevezati na 8. UI treba sačuvati nacrt i ponuditi osvježavanje i usklađivanje. Automatski retry s najnovijom revizijom isključio bi zaštitu baš kad je korisniku potrebna.

## Zaključajte invarijantu koju dijele konkurentne naredbe

Upload kvotu ne štiti zaključavanje samo nove datoteke: njezin red još ne postoji. Discovery zaključava roditeljski projekt prije brojanja i zbrajanja bajtova. Isti protokol vrijedi za konkurentne uploadove, opoziv članstva i brisanje. Tako dva zahtjeva ne mogu svaki vidjeti isti slobodan kapacitet pa zajedno prekoračiti ukupan iznos.

Redoslijed je specifičan izvoru: najprije aktivni akter; resource lookup može zaključati projekt; zatim članstvo skriva neovlašteni resurs s 404. Administratorske radnje mogu tražiti tu ovlast prije lookupa. Ne sažimajte to ni kao „sve ovlasti prije svakog locka” ni kao „lock daje ovlast”. Lock uređuje pristup stanju, a članstvo i dalje određuje pravo.

**Pseudokod recepta** zahtijeva scoped repozitorij, politiku aktera i kvote, reader sadržaja, audit writer i error mapping. Ti suradnici nisu importi predloška.

```java
@Transactional
public AssetView add(UUID workspaceId, Upload command, Authentication auth) {
    var actor = actors.requireEnabled(auth);
    var workspace = workspaces.lockAndRequireVisible(workspaceId, actor);
    workspace.requireMutable();
    var usage = assets.usage(workspace.id());
    quota.requireCapacity(usage, command.declaredLength());
    var bytes = content.readAtMost(command.stream(), quota.fileLimit() + 1);
    quota.requireActualCapacity(usage, bytes.length);
    var asset = assets.insert(workspace.id(), bytes);
    audit.append(actor.id(), asset.id(), "ASSET_ADDED");
    return views.asset(asset);
}
```

Stvarni upload izvor ponovno provjerava bajtove nakon ograničenog čitanja, pa ispravnost ne ovisi samo o multipart metapodacima. Lock ostaje tijekom tog ograničenog čitanja; to je opaženi kompromis malih datoteka, ne preporuka držanja locka tijekom proizvoljnog streaminga ili vanjskog poziva.

## Opseg locka neka bude razmjeran i dosljedan

Discovery ima i financijski mutex koji se unutar caller transakcije uzima nakon administrator autentikacije, a prije resource lockova. Taj globalni domenski lock serializira određenu invarijantu više resursa. Nije zadani lock za svaki endpoint. Prije njegova dodavanja dokumentirajte invarijantu i sve naredbe sudionike.

Novi zapisivač zahtijeva proširenje protokola, ne samo poziv praktične repository metode. Pozadinsko čišćenje, opoziv članstva ili brisanje koje zaobiđe roditeljski lock vraća utrku i kad je upload endpoint ispravan. Read-only transakcija sama ne daje takvu uzajamnu isključivost ni dokumentirano snapshot jamstvo.

## Kvar i oporavak

Pri zastarjelom spremanju s 409 držite korisnički prijedlog odvojen od osvježenog pogleda poslužitelja. Ako čekanje locka istekne ili baza prekine transakciju, vratite definirani kvar i ponavljajte samo prema zasebnoj ograničenoj retry politici. Ne koristite cache „slobodne kvote” izračunat prije stjecanja zaštitnog locka.

Izbjegnite dugi vanjski I/O pod lockovima, različit redoslijed zaključavanja i hvatanje database iznimke radi nastavka iste neuspjele transakcije. To su različiti kvarovi s različitim granicama. Zajednički lock pomaže samo kad su invarijanta i svi zapisivači eksplicitni.

## Kriteriji za buduću implementaciju

- Dva zastarjela uređivača daju jednu novu potvrđenu reviziju i jedan konflikt bez gubitka lokalnog nacrta.
- Nevaljani oblik revizije razlikuje se od stvarnog konflikta stanja.
- Konkurentni uploadovi koji prelaze kvotu ne mogu oba commitati.
- Opoziv članstva i brisanje sudjeluju u istom roditeljskom protokolu kao upload.
- Autorizacija vrijedi i kad se resource lock stječe prvi.
- Globalni mutex postoji samo uz utvrđenu međuresursnu invarijantu i redoslijed.
- Neuspjelo zaključavanje ili prekinuta transakcija ne ostavljaju djelomičan asset ili audit uspjeh.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — parser revizije, konflikt, redoslijed aktera/resursa/članstva i povećanje.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — zajednički roditeljski lock i provjera stvarnih bajtova.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationService.java` — revizije nacrta, pregleda i exporta pod istom granicom.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFinanceLock.java` — eksplicitno uređen domenski mutex.
