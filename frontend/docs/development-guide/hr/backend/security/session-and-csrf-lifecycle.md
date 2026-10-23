# Session autentikacija i CSRF imaju zajednički životni ciklus

**Status podrške: ugrađen obrazac predloška.** Backend koristi poslužiteljsku JDBC sesiju, session cookie i CSRF tokene u HTTP sesiji. Izdavanje JWT-a, spremanje tokena u preglednik, remember-me i tenant autorizacija nisu ugrađene zamjene za ovaj ugovor.

Koristite ovaj obrazac pri promjeni prijave, dodavanju zaštićene promjene, dijagnostici 403 nakon prijave ili povezivanju novog frontend klijenta. Uspješna autentikacija samo je jedan korak: rotacija identiteta sesije, poništavanje CSRF-a i eksplicitno spremanje sigurnosnog konteksta moraju ostati usklađeni.

## Vlasništvo i javni endpointi

`SecurityConfiguration` upravlja filter chainom, authentication providerom, password encoderom, session strategijom, CSRF repozitorijem i repozitorijem sigurnosnog konteksta. `AuthController` posjeduje JSON prijavu i javni DTO identiteta. `AuthExceptionHandler` ograničava detalje autentikacijskih pogrešaka. Flyway upravlja JDBC session tablicama, a frontend zahtjevima s cookiejem, dohvatom tokena i UI oporavkom.

Servlet kontekst `/api` daje sljedeće vanjske rute:

| Zahtjev                 | Ugovor                                                            |
| ----------------------- | ----------------------------------------------------------------- |
| GET `/api/auth/csrf`    | Vraća `{headerName, token}` za trenutačni životni ciklus sesije   |
| POST `/api/auth/login`  | Validirani JSON podaci; uspješan odgovor je 204                   |
| GET `/api/auth/session` | Autentificirani javni DTO; ponovno dohvaća aktivnog korisnika     |
| POST `/api/auth/logout` | Spring Security odjava; uspješno vraća 204 i briše SESSION cookie |

CSRF i login dopušteni su autorizacijskim pravilima. `permitAll` **ne isključuje** CSRF na prijavi: zahtjev koji mijenja stanje i dalje treba token i zaglavlje dobiveno CSRF endpointom. `/actuator/health` i `/error` također su dopušteni. Svi drugi zahtjevi u ugrađenom chainu trebaju autentikaciju.

## Uređeni prijelaz prijave

Frontend prvo dohvaća CSRF i koristi vraćeni naziv zaglavlja umjesto izmišljanja vlastitog. Zahtjev prijave šalje JSON podatke, CSRF zaglavlje i session cookie preglednika. Backend autentificira kroz `DaoAuthenticationProvider`, korisničke podatke iz repozitorija i BCrypt s troškom 12.

Kontroler zatim izvodi ovaj **ugrađeni redoslijed**:

```java
var authentication = authenticationManager.authenticate(
    UsernamePasswordAuthenticationToken.unauthenticated(
        credentials.username(), credentials.password()));
sessionAuthentication.onAuthentication(authentication, request, response);
var context = SecurityContextHolder.createEmptyContext();
context.setAuthentication(authentication);
SecurityContextHolder.setContext(context);
securityContexts.saveContext(context, request, response);
```

`sessionAuthentication` kombinira `ChangeSessionIdAuthenticationStrategy`, a zatim `CsrfAuthenticationStrategy`. Prva mijenja identitet sesije, druga uklanja prethodni CSRF token. Tek potom kontroler stvara autentificirani sigurnosni kontekst i eksplicitno ga sprema kroz `HttpSessionSecurityContextRepository`.

Nemojte ukloniti spremanje zato što trenutačni zahtjev izgleda autentificiran: kontekst vezan uz thread sam ne ostvaruje ugovor persistirane sesije za sljedeći zahtjev. Nemojte ukloniti strategiju zato što cookie prijava prividno radi bez nje: identitet sesije i trajanje tokena prije prijave sigurnosne su odluke, ne kozmetika preglednika.

Nakon uspješne prijave frontend mora ponovno dohvatiti CSRF prije sljedeće promjene. Zatim treba dohvatiti session DTO za autentificirani UI. Ponovna uporaba anonimnog tokena čest je razlog neuspjeha prve promjene nakon prijave iako je login vratio 204.

## Identitet sesije nije trajna ovlast

Ugrađeni session endpoint ponovno dohvaća korisničko ime i vraća samo aktivan `AppUser`. To je korisna provjera živog identiteta. Ne znači da svaki budući autentificirani endpoint automatski provjerava aktivnost računa ili domensko članstvo. Security principal može ostati autentificiran dok njegov životni ciklus ne završi; servisi projekta koji trebaju trenutačne ovlasti moraju ih provjeriti za vlastite radnje.

Predložak dodjeljuje `USER` u user-details adapteru. Nema ugrađen tenant, administratorski ili resource-membership model. Dodavanje role provjere kopiranom endpointu ne daje nedostajuću politiku članstva. Promjene ovlasti, onemogućeni računi i resursi ograničeni opsegom zahtijevaju eksplicitan dizajn aplikacijskog servisa.

## Cookieji, pohrana i oporavak

Osnovna konfiguracija označava cookie kao HTTP-only, secure i SameSite=Lax, uz trajanje sesije 30 minuta. Samo lokalni HTTP profil isključuje secure. JDBC session retke i atribute priprema Flyway, dok je automatska inicijalizacija session sheme isključena. Neispravna persistencija sesije zato može biti problem migracije ili baze, a ne razlog za spremanje pristupnih podataka ili tokena u localStorage.

Odjava pripada Security filter chainu, ne novoj metodi kontrolera radi simetrije. S POST odjavom pošaljite trenutačni CSRF token. Uspjeh vraća prazno tijelo i briše `SESSION`; frontend treba ukloniti cacheirani identitet i token umjesto nastavka prikaza prethodnog aktera.

Različite pogreške zahtijevaju različit oporavak. Nevaljani podaci dobivaju kontrolirani generički 401. Neautentificirani zaštićeni zahtjev dobiva authentication entry point. Nedostajući ili zastarjeli CSRF može dobiti 403 iz access-denied handlera. Ne ponavljajte automatski svaku neuspjelu promjenu: politika mora znati je li nuspojava mogla nastati. Ponovni dohvat tokena popravlja stanje tokena, ne problem ovlasti ili zastarjelu poslovnu reviziju.

## Kriteriji prihvata buduće implementacije

Ovim slučajevima definirajte prihvat implementacije; odaberite provjere prema aktualnom zadatku i pravilima repozitorija.

- Login bez CSRF-a odbija se; dopuštena ruta ne zaobilazi token.
- Valjana prijava rotira identitet sesije, sprema autentikaciju i uklanja uporabljivost prethodnog tokena za sljedeće promjene.
- Novi token nakon prijave dopušta valjanu promjenu kada vrijede i domenske ovlasti.
- Session endpoint vraća samo javni identitet i odbija nepostojeći ili onemogućeni račun.
- Odjava s potrebnim tokenom završava autentificirani ciklus i čisti frontend identitet.
- Deployment secure cookie radi preko odobrenog HTTPS-a; lokalni HTTP koristi samo lokalnu iznimku.
- Novi poslovni servis dokumentira provjerava li žive ovlasti umjesto tretiranja cacheirane uloge kao trajnog prava.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — provider, repozitoriji, redoslijed strategija, filter pogreške i odjava.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — eksplicitno spremanje konteksta i DTO identiteta.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java` — kontrolirana autentikacijska pogreška.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml` — pravila sesije, cookieja i sheme.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql` — trajna session shema.
