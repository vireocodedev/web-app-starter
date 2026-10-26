# Izgradi frontend sliku prenosivu između okruženja

Jednom proizvedi browser assete, posluži ih uz izričite HTTP granice i prepusti API routing proxyju okruženja. Frontend slika ima cache, privilege i route ugovor; nije kontejnerizirani dev server.

**Ugrađeni obrazac predloška.** Vlasnici su `frontend/Dockerfile`, `frontend/nginx.conf`, build konfiguracija i `frontend/.dockerignore`. Release runtime dodaje ograničenja i javni routing. Širi identitet frontenda/backenda objašnjava **Nepromjenjivi par slika**.

## Okidač, vlasnik i ugovor

Koristi za promjene build argumenata, API konfiguracije, SPA routinga, cachea ili runtimea. Frontend vlasnik odgovara za javne compile-time postavke i Nginx. Operater upravlja TLS-om, backend proxyjem i alokacijom okruženja.

Ugovor je ista slika za staging i produkciju bez ugrađenog hostnamea ili tajne. Oba okruženja koriste same-origin `/api`; proxy prosljeđuje backendu. Nepostojeći API ili hashirani asset ne smije postati uspješni HTML odgovor.

## Javne postavke nastaju pri buildu

Build faza bira deklarirani npm, instalira lockfile ovisnosti i kopira frontend context. Prije `npm run build` postavlja:

```dockerfile
ENV VITE_API_BASE_URL=/api \
    VITE_API_WITH_CREDENTIALS=true \
    VITE_API_MODE=http \
    VITE_APP_ENV=production
```

To je isječak postojećeg vlasnika, ne provisioning recept. Vrijednosti se ugrađuju u browser assete. Kasnija container env varijabla ne prepisuje već izgrađeni JavaScript. Ako treba runtime javna konfiguracija, oblikuj i provjeri eksplicitan loader umjesto pretpostavke da `docker run -e VITE_*` mijenja aplikaciju.

Browser JavaScript je javan. `VITE_*` nije spremište tajni. Database lozinke, registry tokeni i privatni API ključevi ne pripadaju frontend contextu ili slici.

`.dockerignore` isključuje lokalne env datoteke, ovisnosti, output i izvješća. Context je frontend direktorij pa se pravila i COPY putanje tumače u njemu. Lokalni Vite dev uspjeh ne dokazuje taj produkcijski put pakiranja.

## HTTP pogreške moraju ostati vidljive

| Vrsta zahtjeva                            | Ugrađeno ponašanje                                  |
| ----------------------------------------- | --------------------------------------------------- |
| `/healthz`                                | Mali samostalni 200 odgovor.                        |
| `/api` ili `/api/...` koji dođe do Nginxa | 404; proxy treba preusmjeriti backendu.             |
| Postojeći `/assets/...`                   | Statički asset uz jednogodišnji immutable cache.    |
| Nepostojeći `/assets/...`                 | 404 bez SPA fallbacka.                              |
| `/index.html`                             | `Cache-Control: no-store`.                          |
| History putanja poput `/login`            | Postojeća datoteka/direktorij, inače `/index.html`. |

Lifetime asseta u snapshotu je `31536000` sekundi. Hashirani naziv promijenjenom assetu daje novi URL, a svježi index referencira novo izdanje. Index ne smije dobiti immutable cache. Nedostajući stari hash mora ostati vidljiv 404 umjesto HTML-a koji kasnije uzrokuje JavaScript parse pogrešku.

Nginx API 404 nije backend autorizacija. On otkriva pogrešan proxy umjesto da ga prikrije. Nginx u slici nema ugrađeni produkcijski backend target.

## Izvođenje pod stvarnom granicom

Runtime koristi digest-pinned unprivileged Nginx i `101:101`, privatni `8080` te PID/temp ispod `/tmp`. Statičke datoteke kopirane su read-only. Fiksni runtime dodaje read-only root, uklonjene capabilities, no-new-privileges, memory/PID limite i ograničeni tmpfs.

Javni TLS i oznaka okruženja pripadaju host proxyju. Slika ne traži host certifikate ili Docker socket. Health potvrđuje dohvatljiv server, ne ispravan par, javni routing ili poslovni tok.

Development rute i mock setup ostaju pod frontend environment politikom. Izvor uklanja dostupnost razvojnih ruta u produkciji i izbacuje MSW worker iz build outputa. Mock mode nije popravak nepotpunog produkcijskog demo toka.

## Pogreške i odluke

| Opažanje                              | Odluka                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Staging hostname u JavaScriptu        | Vrati same-origin ugovor prije build-once promocije.                           |
| API vraća HTML 200                    | Popravi proxy/Nginx granicu, ne svakog pozivatelja.                            |
| Nedostajući asset vraća index         | Vrati eksplicitan 404.                                                         |
| Stari index preživi deploy            | Pregledaj no-store i posredničke cacheove.                                     |
| Runtime env ne mijenja JS             | Postavka je compile-time; potreban je usklađen rebuild ili eksplicitni loader. |
| Nginx traži zapis u sistemske putanje | Uskladi PID/temp s ograničenim runtimeom.                                      |

## Prihvat i inspekcija

Pregledaj source label, non-root korisnika i konfiguraciju slike. Ovlaštena artifact provjera treba koristiti stvarne history, nepoznate API i missing asset putanje uz runtime ograničenja. Cache headere pregledaj zasebno: smoke status probeovi ne dokazuju svako cache pravilo.

Potvrdi da output ne sadrži razvojni worker ni tajnu te da proxy pokazuje očekivano okruženje. Operativne naredbe ostaju u `infrastructure/release/README.md`. Članak ne gradi i ne pokreće kontejnere.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/nginx.conf`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/.dockerignore`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/vite.config.ts`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/src/main.tsx`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/src/app/router/routeRegistry.tsx`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
