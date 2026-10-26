# Generirani app kod i mehanički indeksi imaju različit lifetime

Odvoji kod koji developer preuzima od artefakta koji generator može reproducirati. Marker je provenance, ne dozvola za prepisivanje custom koda ili primijenjene migracije.

**Vireo reference recept, nije instalirani RGO generator.** Vireo ownership vodič i `entity-generator.ts` provode pravilo. Primjena ovdje traži zaseban dizajn; `.vireo` i naredbe nisu postojeće starter sposobnosti.

## Okidač, vlasnik i ugovor

Koristi pri generator dizajnu, adopciji slicea ili procjeni regeneracije. App posjeduje poslovni kod i forward shemu. Generator upravlja mehaničkim indeksima/ugovorima i manifestom.

Ugovor je ownership s drift provjerom. Identičan input nema write. Custom/unmanaged kod ne prepisuje se tiho. Generacija ne vraća primijenjenu migraciju na novi schema source.

| Vireo klasa      | Odgovornost                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `generated-once` | Migration, vertical slice, jezici, story/test/docs postaju app kod. |
| `regenerated`    | Schema, contract, manifest/index je mehanika bez business logike.   |

To nije ista os kao projection managed/application-owned/optional. Jedna oznaka ne zamjenjuje drugi ugovor.

Manifest bilježi path/ownership/role/SHA-256 i schema/wire digest. Prije writea klasificira stvarne fileove i obsolete putanje. Komentar ne dokazuje nepromijenjene bajtove.

```text
schema + stari manifest + trenutačni fileovi
                    |
             render i klasifikacija
                    |
 create/update/unchanged/customized/obsolete
                    |
       refusal ili pregledani write plan
```

## Refusal je dokaz

Izvor odbija unmanaged collision (`VIR-GEN-003`), schema/removal bez forcea (`VIR-GEN-004`) i customized sadržaj bez kombinirane overwrite odluke (`VIR-GEN-005`). Path provjere odbijaju escape/symlink.

Dry-run/diff i zaseban output služe pregledu. Force/accept-overwrite destruktivni je put za neadoptiranu lokalnu generaciju, ne normalni production upgrade. Ne stavljaj ga u rutinski fix recept.

Adoptirani feature mijenja app kod i dodaje forward Flyway migraciju. Kad generation contract više ne opisuje capability, ejection zadržava generated-once kod, uklanja generator registraciju/manifest i mijenja marker.

Ejection ne briše ponašanje ni vraća podatke. App preuzima route/persistence/acceptance nakon izlaska generatora.

## Upgrade nije regeneracija

Podržani Vireo edge može prihvatiti deklarirani stari manifest bez regeneracije pa čuva kod i migracije. Kasnija generacija je nova review promjena prema aktualnim pravilima.

To nije podrška svim starim manifestima. Allowlist, critical hash i schema/wire digest provodi konkretan alat. Starter ne dobiva jamstvo čitanjem vodiča.

## Pogreške i odluke

| Opažanje                                  | Odluka                                 |
| ----------------------------------------- | -------------------------------------- |
| Business u generated indexu               | Premjesti u app owner.                 |
| Generated-once customized                 | Sačuvaj i odaberi adaptation/ejection. |
| Applied migration i nova schema           | Forward migration, ne rewrite.         |
| Isti rerun mijenja file                   | Istraži determinism/input.             |
| Unmanaged collision                       | Refuse i pregledaj output.             |
| Svi povijesni generatori navodno podržani | Traži declared-edge dokaz.             |

## Prihvat

Zapiši schema/contract, putanje, hashove, write/delete plan i app prilagodbe. Bez business logike u mehanici i bez prepisivanja migracija. Članak ne generira, ejecta ni upgradea.

Plan mora obuhvatiti i obsolete putanje. Uklanjanje više nepotrebnog generiranog filea nije bezazlen cleanup ako sadrži lokalne izmjene. Manifest je osnova usporedbe, ali trenutačni hash potvrđuje stanje. Prije adopcije generatora u novi stack treba zasebno odrediti format markera, atomic write/recovery i pravila za registracije, umjesto kopiranja samo happy-path render funkcije. Bez tih dijelova nema istog jamstva očuvanja.

## Izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/architecture/generated-code-ownership.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-generator.ts`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/project-upgrade.ts`
