# Tri stanja PATCH-a i namjenski write DTO-i

**Status podrške: referentni recept uz usporedbu starije implementacije.** LMS koristi `JsonNullable`, validation grupe i MapStruct radi razlikovanja izostavljenih svojstava i eksplicitnih vrijednosti. Te biblioteke i Jackson konfiguracija nisu ugrađeni API-ji predloška. Boot 4 projekt prije primjene odabire kompatibilnu serijalizaciju, validaciju i mapiranje.

Koristite obrazac kad forma mijenja samo dotaknuta polja, nullable polje treba moći očistiti ili klijent ne smije pisati izvedene/audit podatke. Sam HTTP PATCH ne definira semantiku polja: endpoint treba dokumentiran absent/null/value ugovor koji preživi dekodiranje, validaciju, mapiranje i persistenciju.

## Ugrađeni POST i PUT default

Novi poslovni resursi dijele jedan `<Resource>Request` record za POST i puni PUT, s istim writable pravilima i zasebnim Responseom. Null briše opcionalno nullable polje na PUT-u; izostavljeno opcionalno JSON polje obično se dekodira u null pa ga također briše. Izostavljeno obvezno polje pada na validaciji. Metadata/verzija pripadaju backendu, a verzija se šalje kroz `X-Expected-Version`. Pogledajte [CRUD pravila](crud-foundation-and-class-conventions.md). LMS PATCH recept ispod ostaje zaseban neugrađeni partial-update dizajn; ne primjenjujte ga na ovaj PUT.

## Tri unosa znače tri različite naredbe

Zapis ima nullable bilješku i obvezan naziv za prikaz. Slijedi **recept wire ugovora**, ne postojeći endpoint predloška:

| JSON zahtjev          | Značenje za bilješku                                              |
| --------------------- | ----------------------------------------------------------------- |
| `{}`                  | Ostaviti spremljenu bilješku nepromijenjenom                      |
| `{"note":null}`       | Očistiti bilješku ako domena dopušta                              |
| `{"note":"New note"}` | Zamijeniti predanom vrijednošću                                   |
| `{"note":""}`         | Prisutna prazna vrijednost; namjerno validirati ili normalizirati |

Obično nullable Java polje najčešće spaja izostanak i explicit null, pa razlika nestaje prije servisa. Proizvoljno odabran `Optional` također nije automatski JSON tri-state ugovor. Decoder mora sačuvati prisutnost, validator provjeriti odgovarajuću sadržanu vrijednost, a mapper preskočiti samo izostanak.

Kolekcije traže jednako jasno pravilo: prazan niz može značiti zamjenu praznim, dok null znači čišćenje ili nevaljanost. Ne pretvarajte svaki collection PATCH tiho u merge. Zasebna radnja „dodaj člana” može biti jasnija kad je poslovni postupak precizniji od generičke zamjene polja.

## Što pokazuje LMS izvor

LMS DTO-i mnoga promjenjiva polja omataju u `JsonNullable`. `JsonNullableMapper` raspakira prisutne vrijednosti, a MapStruct `@Condition` provjerava postojanje wrappera i `isPresent()`. JSON konfiguracija eksplicitno registrira `JsonNullableModule`. Kontroler odabire `CreateGroup` ili `UpdateGroup`, umjesto izjednačavanja stvaranja i patchanja.

DTO convenience/audit svojstva označava `@Null` za obje grupe; ID se odbija na stvaranju, a base mapper ignorira identitet pri pretvorbi u domenu. `@Null` odbija predanu non-null vrijednost, ne samu tekstualnu prisutnost JSON svojstva s null. Zato sam ne daje strogi protokol odbijanja nepoznatih ili server-owned svojstava.

Required-name anotacija izvora stoji na wrapper vrijednosti. Pri prilagodbi provjerite kompatibilnu value extraction i group semantiku; sama anotacija ne dokazuje da svaki izostanak, explicit null i blank rade ispravno u drugoj Jackson/validation verziji. Starija konfiguracija koristi svoje JSON pakete i datumske postavke; kopiranje cijelog object mappera u predložak znatno je veća promjena ugovora.

## Write model zadržite užim od read modela

Odgovor može sadržavati labele, autora, reviziju, izračunate zbrojeve ili capability zastavice. To ih ne čini upisivima. Namjenski `CreateRecord` i `PatchRecord` često su jasniji od velikog zajedničkog DTO-a koji skriva različita pravila. Identitet, akter, audit vrijeme i izvedene vrijednosti pripadaju poslužitelju.

**Pseudokod recepta:** `PatchValue` je predloženi tip prisutnosti, ne klasa predloška. Zajedno implementirajte decoder, validaciju, DTO i mapper; kompatibilne ovisnosti dodajte samo ako ih odabrani dizajn traži.

```java
void apply(PatchRecord command, Record target) {
    if (command.displayName().isPresent()) {
        target.rename(requireNonblank(command.displayName().value()));
    }
    if (command.note().isPresent()) {
        target.replaceNote(validateNullableNote(command.note().value()));
    }
    // Identity, workspace, createdBy i audit vrijeme određuje poslužitelj.
}
```

Servis najprije razrješava trenutačne ovlasti i scoped cilj, zatim unutar transakcije provjerava stanje/reviziju i primjenjuje dopuštene promjene. Referencirani category ili owner ID treba vlastiti autorizirani dohvat. U legacy mapperu nedostupna veza može postati null; novi projekt treba odrediti kvar za nepostojeće, skrivene ili foreign-scope reference umjesto kopiranja tihog uklanjanja veze.

## Kvar i oporavak

Opasan kvar je prividno uspješan gubitak podataka: klijent šalje samo naziv, decoder izostavljenu bilješku pretvori u null, a mapper je obriše. Obrnuti kvar nastaje kad null-ignoring mapper spriječi namjerno čišćenje. Pratite primjer kroz cijeli pipeline umjesto zaključivanja samo iz potpisa kontrolera.

Sačuvajte poslani patch/nacrt kad validacija ili revizijski konflikt zakaže. Ponovno sastavljanje patcha iz osvježenog punog odgovora može prepisati nedotaknuta polja i poništiti svrhu presence semantike. Nakon promjene decodera ili mappera pregledajte sva patch polja; popravak stringa ne smije tiho promijeniti liste i relacije.

Izbjegnite generički map-to-entity, kopiranje read DTO-a u pisanja, povjerenje client audit poljima i tretiranje validation grupa kao autorizacije. Grupe odabiru constraintove; ne određuju tko smije mijenjati resurs.

## Kriteriji za buduću implementaciju

- Izostanak čuva nullable polje; explicit null čisti ga samo kad je dopušteno.
- Prisutna vrijednost zamjenjuje polje; prazni stringovi i nizovi slijede ugovor.
- Create required i patch optional polja razlikuju se uz ispravnu contained-value validaciju.
- Predani identitet, audit i izvedeni podaci ne mogu mijenjati server-owned stanje.
- Nevaljane i cross-scope relacije završavaju ugovorenom pogreškom, ne tihim nestankom.
- Serijalizacija, validacija i generirano/ručno mapiranje slažu se za sva tri stanja.
- Neuspješan patch čuva nacrt i ne mijenja nepovezana polja.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselDTO.java` — wrapperi, grupe i server-owned polja odgovora.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselController.java` — odabir grupa create/patch zahtjeva.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/JsonNullableMapper.java` — uvjet prisutnosti i raspakiranje.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/BaseMapper.java` — namjerno izostavljanje identiteta.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselMapper.java` — uvjeti mapiranja i usporedba relation lookupa.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/JsonConfig.java` — stariji nullable modul i mapper konfiguracija.
