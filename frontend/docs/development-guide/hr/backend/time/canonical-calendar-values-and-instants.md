# Kalendarske vrijednosti odvojite od trenutka događaja

**Status podrške: Vireo temporal referenca, nije ugrađen field API RGO predloška.** Form field koristi kanonski calendar string bez zone, History offset timestamp ili konačan broj. Paketi su zasebna odluka projekta. Timezone, DST i business scheduling ostaju aplikacijska politika.

Obrazac koristite za picker, ponavljajući raspored i audit preko API granice. Datum, wall time i jedinstveni instant nisu ista vrijednost; browser `Date` može izmisliti značenje koje korisnik nije dao.

## Sačuvajte vrstu vrijednosti

Parser provjerava shape i round-trip format, odbijajući nemoguć datum koji biblioteka normalizira. Podržava year, neovisan month, year-month, date, time i local date-time. Minute precision i dalje šalje nula sekundi.

| Vrsta           | Primjer                | Značenje                         |
| --------------- | ---------------------- | -------------------------------- |
| Year            | `2027`                 | Godina                           |
| Month           | `04`                   | Mjesec bez godine                |
| Year-month      | `2027-04`              | Kalendarski mjesec               |
| Date            | `2027-04-17`           | Datum bez zone                   |
| Time            | `09:30:00`             | Vrijeme bez datuma/zone          |
| Local date-time | `2027-04-17T09:30:00`  | Calendar polja bez zone          |
| Instant         | `2027-04-17T07:30:00Z` | Točan događaj na vremenskoj crti |

Interni parser koristi UTC calendar reprezentaciju, ali output nema `Z`/offset. To ne znači da poslovna vrijednost jest UTC. Lokalizacija je prikaz, ne pretvorba zone.

## Pretvorite tek nakon domenske odluke

Termin treba relevantnu zonu prije instanta. Rođendan/izvještajni datum možda nikad ne treba pretvorbu. Recurring local time treba zonu/recurrence, ne današnji browser offset.

**Pseudokod recepta:** projekt implementira parsing, trusted zonu, gap/overlap politiku, pohranu i UX. Helperi nisu ugrađeni API-ji.

```java
var local = LocalDateTime.parse(command.localStart());
var zone = scheduling.requireConfiguredZone(command.workspaceId());
var decision = scheduling.resolve(local, zone, policy.dstGap(), policy.dstOverlap());
if (decision.requiresUserChoice()) return ambiguity(decision.allowedChoices());
return schedules.retain(local, zone, decision.instant(), policy.version());
```

Nema univerzalnog DST pravila: aplikacija može odbiti nepostojeći ili tražiti izbor dvosmislenog vremena. Tiho pridruživanje browser zone ili `Z` nije pretvorba.

## Wire validacija pripada objema stranama

Field provodi širine, sekunde, kalendarsku valjanost i min/max/step. UI nije backend authority granica; API validira vrstu i business range te daje siguran field failure.

History schema prihvaća konačan broj ili ISO date-time s offsetom. „Finite” ne određuje epoch jedinicu/raspon; numeric API to izričito bira. Generator timestamp mapira na `Instant` i offset ISO, a date na `LocalDate` i calendar. Local field ne ide u `Instant` bez domenskog koraka.

Offset nije named zone. Daje odnos instanta tog zapisa, ne buduća pravila i recurrence. Odredite što čuvate za raspored, a što za immutable event.

## Kvar i oporavak

Nemoguć datum odbijte, ne prebacujte u drugi dan. Calendar nacrt čuvajte kad zona traži izbor. Locale mijenja prikaz, ne canonical submit.

Nova zone politika razlikuje fiksni event instant i buduću local namjeru. Recalculation treba eksplicitnu verziju, ne formatiranje. Empty/invalid nije now, wall clock nije elapsed timer, a workstation zona nije domenska politika.

## Prilagodba i kriteriji

- Svako polje ima calendar/instant vrstu i wire oblik.
- Locale i timezone imaju odvojene vlasnike.
- Datum, precision i range validiraju se.
- Numeric timestamp ima jedinicu i raspon.
- DST/recurrence su aplikacijske odluke s UX-om.
- Backend ne pretpostavlja browser zonu ili lažni offset.
- Intent, zona i instant čuvaju značenje domene.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/ui/src/capabilities/forms/components/forms/VireoFormTemporalField/internal/temporalValue.ts` — parser/formatter/precision.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/ui/src/integrations/localization/providers/VireoTemporalLocalizationProvider/VireoTemporalLocalizationProvider.tsx` — locale.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/history/src/records/historyRecord.ts` — finite/offset schema.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-renderer.ts` — LocalDate/Instant wire.
