# Odvojeno dijagnosticiraj dostupnost, identitet i ponašanje

Mali health ugovor locira pad, ali namjeravani image par i korisničko ponašanje provjeravaju se zasebno. Proces s odgovorom 200 može biti pogrešno izdanje, okruženje ili nepotpuna aplikacija.

**Ugrađeni obrazac predloška.** Nginx, backend Actuator/security konfiguracija, image healthcheck i `infrastructure/release/runtime.py` upravljaju probeovima. Release README upravlja ciljanom privatnom dijagnostikom i zabranjuje secret dumpove.

## Okidač, vlasnik i ugovor

Koristi nakon deploya, kod pada javne rute, zdravih kontejnera s neispravnim featureom ili handoffa. Aplikacijski vlasnik odgovara za API i poslovni prihvat. Operater upravlja stvarnim container identitetom, proxyjem i privatnom dijagnostikom.

Ugovor su odvojene tvrdnje: process health, artefakt identitet, javne routing/auth granice i poslovno ponašanje. Izvijesti što je stvarno opaženo. Mali health odgovor ne dokazuje dovršen fullstack projekt.

## Stvarni probeovi

| Sloj                     | Dokaz                                              | Ne dokazuje                                    |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------- |
| Frontend `/healthz`      | Nginx mali 200 ugovor.                             | API proxy, par ili prijavljeni poslovni tok.   |
| Backend health           | Tijelo odgovora je `UP`.                           | Sve operacije ili kompatibilnost starog koda.  |
| Docker health            | Definirani image probe prolazi.                    | Digest/source ili javni identitet.             |
| Runtime image inspection | Točan UID, OCI source/revision i running image ID. | Poslovni prihvat.                              |
| Javni probeovi           | Status/body i `X-Vireo-Environment`.               | Ovlast pojedinog korisnika ili punu regresiju. |

Zadani backend izlaže samo Actuator health i skriva detalje. Server pogreške ne šalju message/stack trace. Health ne smije postati javni config/database debugger.

## Stvarni host prihvat

Runtime čita točne container ID-eve iz generiranog snapshota, pregledava health i running image ID te ih uspoređuje s očekivanim immutable parom. Image inspection traži očekivanog komponentnog korisnika i source/revision labele.

Zatim provjerava javni HTTPS bez prihvaćanja redirecta. Environment header sprječava slučajan zeleni rezultat drugog okruženja. Ugovori su health `UP`, anonimni session 401, CSRF oblik, built SPA na `/login` i missing release asset 404.

```text
container postoji
   -> očekivani image identitet + health
   -> javno okruženje + API/SPA granice
   -> zasebno ovlašten korisnički/poslovni prihvat
```

CSRF probe provjerava oblik; token nije za ispis. Anonimni 401 je uspješna auth granica, ne neuspjela prijava. Environment marker otkriva routing identitet; ne autentificira korisnika i ne potvrđuje sve operacije.

## Ciljana dijagnostika

Počni od prvog neuspjelog sloja i pregledaj samo potrebne netajne kategorije. Operater povezuje source/run/attempt, transaction, snapshot, image ID i javni status. Za usko routing pitanje nije potreban puni resolved Compose ili container env.

Runbook koristi project-specific journal kategorije i zabranjuje CMS plaintext, Docker login, DB sadržaj, secret-bearing config i neselektivne raw logove. Pristup dijagnostici nije dozvola za slanje tih podataka u chat ili workflow artefakt.

Neutralna bilješka može sadržavati:

```text
očekivano okruženje: <staging-ili-production>
očekivani izvor: <tocan-sha>
par: <referenca-privatnog-receipta>
container health: <opazeno>
javni status/marker: <status-i-okruzenje>
prvi neuspjeli sloj: <identitet-routing-ponasanje>
```

Privatni detalji ostaju izvan javnog vodiča. Točne ID-eve koristi za privatnu korelaciju, ne kao opće zadane vrijednosti.

## Platforma i aplikacija nisu isti uzrok

Ako ograničeni container ne može pokrenuti nijedan program, neovisna minimalna slika može ovlaštenom operateru razlikovati host politiku od aplikacije. Ne slabi globalni AppArmor/no-new-privileges radi prolaza. Platformsko ograničenje isto tako nije dokaz prolaza aplikacijske slike.

Zdravi backend i API HTML ukazuju na proxy/fallback. Ispravan routing i poslovni pad pripadaju aplikaciji. Izgubljeni GitHub status nakon provjerenog replacea traži reconciliation, ne trenutni redeploy.

## Pogreške i odluke

| Opažanje                                | Odluka                                       |
| --------------------------------------- | -------------------------------------------- |
| `/healthz` 200, API pada                | Pregledaj backend i proxy odvojeno.          |
| Zdrav container, drugi image ID         | Identitet pada unatoč dostupnosti.           |
| Header pokazuje drugo okruženje         | Popravi routing prije prihvata.              |
| Očekivani anonimni 401                  | Zabilježi auth uspjeh; ne otvaraj endpoint.  |
| Predložen puni env/log dump             | Traži ciljani privatni dokaz.                |
| Infrastruktura prolazi, poslovni tok ne | Odvoji release health od poslovnog prihvata. |

## Prihvat i inspekcija

Zabilježi source/pair, opažene slojeve, javno okruženje i nedostajući poslovni dokaz. Čuvaj netajne precizne pogreške. Screenshot ili zdrav proces nije live-release receipt.

Povezane teme su **Runtime smoke dokaz** i **Neizvjestan release**. Operator postupak ostaje u runbooku. Članak ne izvršava probe, log collect ili host promjenu.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/nginx.conf`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java`
