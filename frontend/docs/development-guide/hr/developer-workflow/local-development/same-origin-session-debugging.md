# Session dijagnosticiraj kroz jedan browser origin

Prati lokalnu prijavu od browser zahtjeva preko Vite proxyja do backend sessiona i svježeg CSRF-a. Prvo razlikuj transport, cookie politiku i račun, tek onda mijenjaj sigurnosno ponašanje.

**Ugrađeni starter ugovor.** Put pripada Vite konfiguraciji, Axios factoryju, Spring-session adapteru i backend auth/local konfiguraciji. Ovo je dijagnostički recept, ne druga auth implementacija.

## Okidač, vlasnik i ugovor

Koristi kad login prođe, session ostane anoniman, unsafe zahtjev dobije 403, mock identitet ne radi u Javi ili hostname mijenja rezultat. Frontend infrastruktura upravlja HTTP instancom/adapterom, backend auth sessionom/CSRF-om/cookiejem, a lokalni setup proxyjem.

Ugovor je jedan frontend origin, `/api`, credentialed HTTP i session-bound CSRF na svakom unsafe zahtjevu. Široki CORS ili ugašeni CSRF ne popravljaju pogrešan host, proxy ili stari token.

## Put zahtjeva prije lozinke

```text
browser: http://127.0.0.1:<frontend-port>/api/...
       -> Vite /api proxy
       -> loopback backend:<api-port>/api/...
       -> session u PostgreSQL-u
```

Ugrađeni defaulti su `5173` i `8080`. Koristi isti hostname: `localhost` i `127.0.0.1` imaju različite cookie hostove. Drugi port istog hosta ne izolira cookie.

Potvrdi da stvarni Vite koristi HTTP. VS Code launch to postavlja, zasebni proces može čitati mock env. Mock fixture nije DB račun. MSW prikaz ne dokazuje Javu ili trajnu autentikaciju.

Axios koristi validirani base URL i `withCredentials`. Ne dodaj feature-local HTTP klijent kao auth popravak; mogao bi zaobići interceptor i lifecycle.

## Stvarni session slijed

| Zahtjev                 | Očekivana granica                              |
| ----------------------- | ---------------------------------------------- |
| GET `/api/auth/csrf`    | `X-CSRF-TOKEN` i neprazni session-bound token. |
| POST `/api/auth/login`  | JSON i svježi CSRF; 204 za uspjeh.             |
| GET `/api/auth/session` | Identity DTO ili 401 za anonimnog korisnika.   |
| POST `/api/auth/logout` | Svježi CSRF, invalidacija i 204.               |

Login mijenja session ID i rotira CSRF. Adapter prije svake unsafe metode dohvaća novi token; ne sprema ga trajno i ne ponavlja mutaciju automatski. Mrežni pad nakon POST-a ne dokazuje odsutnost server promjene.

Session 401 postaje odsutni user, login 401 invalid credentials, a neočekivani 401 drugdje aktivira auth expiry observer. Ne svodi sve na isti globalni toast.

Credentials su prolazni form/request podaci, a HttpOnly cookiejem upravlja browser. Session cookie, lozinka ili CSRF ne smiju u localStorage, URL, log ili screenshot.

## Prvi nesklad određuje smjer

| Opažanje                      | Pregled                   | Odluka                                            |
| ----------------------------- | ------------------------- | ------------------------------------------------- |
| API vraća HTML                | Proxy i backend           | Popravi routing prije lozinke.                    |
| Login prođe, session anoniman | Host, cookie, credentials | Koristi pravi origin/profil, ne otvaraj endpoint. |
| Unsafe 403                    | CSRF fetch/header/session | Popravi lifecycle, ne gasi zaštitu.               |
| Login 400                     | JSON format/validacija    | Sačuvaj wire ugovor.                              |
| Login 401, DB pristup radi    | Postojeći app račun       | Env ne resetira seedanu lozinku.                  |
| Radi samo mock                | Stvarni backend           | Odvoji mock dokaz od HTTP dokaza.                 |

## Lokalni i deployani cookie nisu isto

Base konfiguracija traži Secure cookie. Loopback `local` profil dopušta HTTP. Base profil preko lokalnog plain HTTP-a može spriječiti očekivani povrat cookieja. Local profil na serveru slabi produkcijski ugovor i nije popravak.

Produkcija ima frontend i `/api` pod jednim HTTPS originom kroz host proxy. Vite proxy nije dio builda. Produkcijski routing popravlja se kod vlasnika proxyja, ne isporukom Vite dev servera.

## Prihvat i inspekcija

Za ovlaštenu dijagnozu zabilježi mode, netajni origin/path, statuse te session kroz navigaciju/logout. Sve tajne redigiraj. Deployani prihvat zasebno traži HTTPS.

Uspješan session ne dokazuje sve role ili poslovne akcije. Provjere ovise o aktualnoj autorizaciji i skriptama. Članak ne radi login, capture ni sigurnosnu promjenu.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/vite.config.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/src/app/data/http/createAppAxios.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/src/app/auth/api/appAuth.api.springSession.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/resources/application-local.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/README.md`
