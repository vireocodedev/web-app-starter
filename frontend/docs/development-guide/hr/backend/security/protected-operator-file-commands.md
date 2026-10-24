# Privilegirani file command prima uski zaštićeni ulaz

Operator input odvoji od HTTP-a, shell evaluacije i normalnog startupa. File granica i aplikacijska ovlast zasebno se provjeravaju prije privilegirane naredbe.

**Source-backed reference recept.** Main, policy/service runner i `readProtected` Client Discoveryja pokazuju mehanizam. To nisu starter profili/API. Privatna datoteka nije kriptografsko odobrenje ni potpuni filesystem sandbox.

## Okidač, vlasnik i ugovor

Koristi za izričito ovlašten reviewed import ili one-shot akciju. Process owner upravlja profilom/argv/OS pristupom, app validira actor, schema, current policy i target.

Ugovor je eksplicitan mode i ograničeni podaci. File se parsira, nikad shell-sourcea. OS owner nije automatski app principal; privatnost ne potvrđuje tvrdnje.

## Jedan operator mode

Main odbija više modova, uključuje poseban profil, isključuje web app i zatvara context. Service traži flag bez vrijednosti i po jednu nepraznu user/application/file opciju. Policy admitira samo deklarirane operacije.

To ne znači globalno odbijanje svih unknown opcija. Consumer treba svoj potpuni allowlist/conflict ugovor. Shared konfiguracija ne smije slučajno uključiti runner.

```text
explicit mode/args
        |
protected bounded bytes
        |
JSON + actor/policy/target
        |
one-shot i pregledani output
```

## Stvarni file guard

| Granica   | Izvor                                                   |
| --------- | ------------------------------------------------------- |
| Type      | POSIX regular file, `NOFOLLOW_LINKS`.                   |
| Owner     | Calling OS user principal.                              |
| Mode      | Samo owner-read/write bitovi.                           |
| Size      | Početno i tijekom čitanja 256 KiB.                      |
| Open      | Read channel s `NOFOLLOW_LINKS`.                        |
| Stability | Jednaki file key/owner/mode/size/mtime prije i poslije. |

`0600` je razuman recept, ali source ne traži točan broj već dopuštene bitove. Incremental bound sprječava rast iznad početne provjere.

Ovo je Unix/POSIX leaf provjera. Ne štiti sve ancestore, ne uklanja svaki same-owner race i ne dokazuje immutable reviewed snapshot. Metadata nije potpis. Jači threat model traži directory/descriptor/content approval ugovor.

## Decode i autorizacija odvojeno

`ByteArrayOutputStream.toString(UTF_8)` nije reporting decoder koji odbija malformed ulaz. Za byte-exact ugovor dodaj strict decoder prije JSON-a. Ne tvrdi da source to već radi.

Command razrješava enabled ovlaštenog app actora, fieldove, policy i revision. Actor ID nije pouzdan jer je file privatan. Service sprječava outer transaction koji bi spojio neovisne faze.

Ne printaj payload, evidence bytes, reviewer identitete ili tajne. Service runner ispisuje rezultat; adaptation mora pregledati/sanitizirati njegovu shemu umjesto pretpostavke da je svaki budući rezultat log-safe.

## Pogreške i odluke

| Opažanje                        | Odluka                           |
| ------------------------------- | -------------------------------- |
| Symlink/nonregular              | Odbij.                           |
| Wrong owner ili group/other     | Odbij i pripremi privatni input. |
| Rast/promjena/bound             | Odbij bez djelomične naredbe.    |
| File privatan, actor neovlašten | App auth odbija.                 |
| Treba strict UTF-8              | Dodaj REPORT decoder.            |
| Maliciozni same-owner           | Zasebna jača zaštita.            |

## Prilagodba i prihvat

Treba one-shot lifecycle, platform ograničenja, argv/schema, private storage, byte/decode, actor/policy i uski output. Pregledaj konfliktne modove, owner/mode/type, promjenu i target auth.

Prije integracije potreban je neovisni security/source review. Članak ne čita stvarni operator input niti izvršava naredbu.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/BackendApplication.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CommercialPolicyOperatorRunner.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorRunner.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
