# Validacija i javni ugovori pogrešaka

**Status podrške: ugrađeni zajednički HTTP error i CRUD conflict ugovor.** MVC, autentikacija, Security filtri i servlet dispatch zadržavaju code/message/fieldErrors oblik. Correlation ID i ProblemDetail nisu ugrađeni.

Koristite ovaj obrazac pri definiranju request DTO-a, povezivanju forme s endpointom ili razlikovanju nevaljanog unosa, nedostajuće autentikacije i konflikta poslovnog stanja. HTTP status i stabilan strojni kod upravljaju ponašanjem, a ne proizvoljan tekst poslužitelja.

## CRUD pogreške i očekivana verzija

| Status | Code                 | Značenje                                                                                                               |
| ------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 404    | `RESOURCE_NOT_FOUND` | Nema retka, soft-obrisan je ili izvan dopuštenog actor/parent scopea.                                                  |
| 409    | `VERSION_CONFLICT`   | Zastarjeli expected version ili stvarni optimistic-lock race, uključujući commit.                                      |
| 409    | `RESOURCE_IN_USE`    | Poznata relacija/invarijanta blokira brisanje.                                                                         |
| 409    | `REQUEST_REJECTED`   | Točno poznati unique constraint pri duplicate POST/PUT, uključujući rezervirani soft-obrisani kod i concurrent insert. |

PUT/DELETE traže `X-Expected-Version`, nenegativni decimalni int64; missing/malformed/negative/overflow daju 400 `INVALID_REQUEST`. Verzija nije dio zajedničkog writable Requesta. Nepoznati integrity/persistence problem ostaje 500 `INTERNAL_ERROR`; ne prevodite svaki DataIntegrityViolationException u conflict i ne otkrivajte constraint/SQL/privatni unos. Poznati constraint prevodi se izvan service proxyja nakon rollbacka, bez nastavka u neuspjeloj transakciji. Auth značenja, field allowlist, bounded frontend parser, cancellation/originalni Axios objekt i unknown fallback ostaju očuvani. EN/HR prijevodi uključuju tri CRUD koda.

## Ugrađeni oblik odgovora i vlasnici

Svaki odgovor pogreške sadrži `code`, `message` i `fieldErrors`. Posljednje polje uvijek je niz, i kada je prazan:

```json
{
  "code": "AUTHENTICATION_FAILED",
  "message": "Invalid credentials or expired session",
  "fieldErrors": []
}
```

Trenutačni vlasnici u radnoj kopiji su [ApiErrors](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrors.java), [ApiExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiExceptionHandler.java), [ApiErrorController](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrorController.java), [AuthExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java) i [SecurityConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java). Ove poveznice opisuju ugrađenu implementaciju; izvori vezani uz reviziju na kraju opisuju podrijetlo, a ne trenutačni oblik odgovora.

| Status     | Kod                       | Okidač i sigurna javna poruka                                                                                                                                                     |
| ---------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400        | `VALIDATION_FAILED`       | Pogreška Bean Validationa: `Some fields need attention`.                                                                                                                          |
| 400        | `INVALID_REQUEST`         | Nevaljan JSON ili drugi nevaljan zahtjev: `The request is not valid`.                                                                                                             |
| 401        | `AUTHENTICATION_REQUIRED` | Nedostajuća autentikacija, uključujući Security entry point: `Authentication required`.                                                                                           |
| 401        | `AUTHENTICATION_FAILED`   | Odbijena autentikacija ograničena na `AuthController`, uključujući nedostupan račun sesije, ali bez pogrešaka autentikacijskog servisa: `Invalid credentials or expired session`. |
| 403        | `CSRF_INVALID`            | Security odbija nedostajući/nevaljani CSRF token: `Request not permitted`.                                                                                                        |
| 403        | `FORBIDDEN`               | Druga zabrana pristupa: `Request not permitted`.                                                                                                                                  |
| Ostali 4xx | `REQUEST_REJECTED`        | Zadržava status odbijanja: `The request was rejected`.                                                                                                                            |
| 5xx        | `INTERNAL_ERROR`          | Neočekivana/poslužiteljska pogreška, uključujući nedostupnost autentikacijskog servisa ili pohrane korisnika: `The request could not be completed`.                               |

`ApiExceptionHandler` obrađuje opće MVC pogreške s najnižim prioritetom; autentikacijski advice ograničen kontrolerom zadržava uže značenje. `AuthenticationServiceException`, uključujući `InternalAuthenticationServiceException`, označava pogrešku autentikacijskog backenda/pohrane korisnika, a ne odbijene podatke za prijavu; oba advice toka vraćaju 500 `INTERNAL_ERROR` bez otkrivanja uzroka. Postojeći framework statusi i zaglavlja, poput `Allow` pri odbijanju metode, ostaju sačuvani, a javno tijelo/content type postaju zajednički JSON ugovor. Servlet fallback čita atribut statusa pogreške, a ne tekst iznimke ili poslani unos. Nedostajući/nevaljani metapodaci statusa daju 500. Ugovor ne pretvara pogreške u odgovore 200.

## Detalji validacije eksplicitno su ograničeni

`AuthController.LoginRequest` validira se s `@Valid @RequestBody`: korisničko ime nije prazno i ima najviše 100 znakova; lozinka nije prazna i ima najviše 72 znaka. To se razlikuje od provisioninga, koji dodatno zahtijeva barem 12 znakova i provjerava BCrypt granicu od 72 UTF-8 bajta. Anotacije broja znakova ne jamče granicu bajtova za ne-ASCII unos.

Kao detalji polja objavljuju se samo login polja `username` i `password`, tim redoslijedom, s najviše jednim zapisom po polju. `NotBlank` postaje `REQUIRED`, a `Size` postaje `TOO_LONG`; obveznost ima prednost kada vrijede oba pravila. Primjer:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Some fields need attention",
  "fieldErrors": [{ "field": "username", "code": "REQUIRED" }]
}
```

Ostale pogreške validacije ulaza zadržavaju `VALIDATION_FAILED` s praznim nizom ako ne postoji eksplicitno podržano mapiranje. Validacija povratne vrijednosti pogreška je poslužitelja i zadržava 500 s `INTERNAL_ERROR`. Nikada ne serijalizirajte sirove putanje vezivanja, odbijene vrijednosti, poruke ograničenja, tajne, SQL ili stack trace. Valjano polje ili UUID također ne daje ovlast za korištenje resursa. Odgovor sesije ostaje zasebna projekcija `id`/`displayName`/`email`; ni entitet ni hash lozinke ne postaju javni.

## Frontend dekodiranje i oporavak

[appHttpError.ts](../../../../../../frontend/src/app/data/http/appHttpError.ts) čita izvornu Axios pogrešku bez omatanja ili mijenjanja. Poznati kod mora odgovarati HTTP statusu; `message` mora biti tekst do 512 znakova, a `fieldErrors` niz s najviše 32 zapisa. Tekst polja/koda u svakom zapisu ograničen je na 100 znakova. Nevaljani oblici odgovora, nepodržani kodovi najviše razine, nepodudaranje statusa, otkazivanje i pogreške bez odgovora ne daju prepoznate metapodatke.

Decoder zadržava detalje polja samo za `VALIDATION_FAILED`, poznate kodove `REQUIRED`/`TOO_LONG` i eksplicitno dopuštena polja tog pozivatelja. Zadržava prvi podržani detalj po polju te isključuje nazive povezane s prototipom čak i ako ih pozivatelj navede. Login odabire `username` i `password`; druga forma ne nasljeđuje to dopuštenje automatski.

Stabilni kodovi tijekom prikaza mapiraju se na lokalne prijevodne ključeve. Poslužiteljski `message` provjerava se prema obliku, ali se nikada ne prikazuje. Login čuva unesene vrijednosti, prikazuje lokaliziranu obavijest i podržani pomoćni tekst polja te briše zastarjele pogreške pri promjeni unosa; odjava koristi isto zajedničko mapiranje poruka. Nepoznate/nevaljane pogreške koriste lokalizirani fallback vlasničkog UI-ja.

[Spring-session adapter](../../../../../../frontend/src/app/auth/api/appAuth.api.springSession.ts) klasificira podatke za prijavu kao nevaljane samo kada je izvorni neuspjeli zahtjev `POST /auth/login` i dekodirani kod `AUTHENTICATION_FAILED`. Odgovor 401 CSRF preflighta nije neuspjeli login POST i ne smije postati poruka o nevaljanim podacima za prijavu. Istek sesije i obrada anonimne sesije zadržavaju zasebne odgovornosti.

## Domenska proširenja ostaju namjerna

[Upute za backend-connected feature](../../../../storybook/data/BackendConnectedFeature/BackendConnectedFeature.mdx) daju cjelovit referentni frontend primjer s ovim oblikom odgovora. Mapiranje statusa pojedinog endpointa i predložena objava domenskih polja izričiti su ugovori potrošača, a ne proširenje ugrađenog zajedničkog skupa kodova. Implementirajte i provjerite odgovarajući backend popis dopuštenih polja prije nego obrascu obećate te detalje.

Prethodno navedeni CRUD kodovi definiraju odobreni stale-version i deletion ugovor. Svaki dodatni domenski kod traži jasnu semantiku 409, sigurna polja, skrivanje resursa, očuvanje nacrta i usklađenu backend/frontend provjeru. Nemojte zaključiti domenski protokol iz generičkog fallbacka `REQUEST_REJECTED` niti dodavati nepregledana polja odgovora po endpointima.

LMS ostaje usporedba sa starijom implementacijom: njegov stariji `ErrorResponse` sadrži timestamp/status/path i opcionalni prijevodni ključ. To pokazuje seam prevođenja, a ne uputu za kopiranje payloada ili prosljeđivanje proizvoljnih poruka iznimki. Ovaj predložak ne šalje `requestId` niti obećava mehanizam korelacijskog identifikatora. Takav mehanizam uvedite samo kroz zaseban odobreni dizajn.

## Odgovornosti provjere

Odaberite odobrenu pokrivenost na stvarnim HTTP i UI seamovima; ovaj članak sam ne pokreće provjere:

- Provjerite da nevaljana login polja, nevaljan JSON, nedostajući/nevaljani CSRF, anonimni pristup i nevaljani podaci za prijavu vraćaju dokumentirani status/kod/niz.
- Provjerite da ostali 4xx i 5xx odgovori čuvaju status i framework zaglavlja, a skrivaju detalje iznimki/unosa, uključujući servlet obradu pogrešaka.
- Provjerite da frontend ograničenja, podudaranje statusa/koda, nepodržana polja/kodovi i nevaljani payloadi sigurno prelaze na fallback bez mijenjanja izvorne Axios pogreške.
- Provjerite da odgovor 401 CSRF preflighta ne šalje login POST i ne prikazuje se kao nevaljani podaci za prijavu.
- Provjerite lokalne prijevode, pomoćni tekst polja i sačuvane korisničke nacrte; provisioning ograničenja znakova/UTF-8 bajtova ostaju zaseban ugovor provisioninga računa.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — polazni validirani login record i session DTO.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java` — polazno prevođenje autentikacije ograničeno kontrolerom; trenutačna zajednička izgradnja povezana je ranije.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — polazno vlasništvo Security filtara; trenutačni zajednički writeri povezani su ranije.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java` — ograničenja provisioning polja.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/RestResponseEntityExceptionHandler.java` — stariji seam prevođenja pogrešaka.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/ErrorResponse.java` — stariji oblik odgovora, nije ugovor predloška.
