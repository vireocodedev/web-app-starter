# Odaberi deklarirani aplikacijski toolchain unutar posla

Jednokratni worker treba reproducirati deklarirane alate bez izmjene host instalacije. Aplikacijski target, baseline izvršitelja, dependency lock i Action commit različiti su slojevi identiteta.

**Ugrađeni obrazac predloška.** Vlasnici su `.github/workflows/ci.yml`, frontend `.nvmrc`/`package.json`/lockfile, backend Gradle/Dockerfile i `infrastructure/ci/README.md`. Brojevi opisuju navedeni snapshot; pri pregledanoj nadogradnji vrijede aktualne deklaracije vlasnika.

## Okidač, vlasnik i ugovor

Koristi pri dodavanju projekta u CI, nadogradnji Nodea/npm-a/Jave, promjeni Actiona ili problemu koji postoji samo na jednom računalu. Aplikacijski vlasnik odabire target. Operater bira immutable baseline workera. Nadogradnja baselinea ne smije neprimjetno postati aplikacijska migracija.

Ugovor je izričit job-local odabir: CI čita deklaracije, smješta alate u jednokratni prostor, instalira zaključane ovisnosti i radi checkout bez zadržanih Git vjerodajnica. Naslijeđeni desktop PATH ili host JDK nisu aplikacijsko sučelje.

## Četiri različite vrste fiksiranja

| Sloj                     | Ugrađeni vlasnik i značenje                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Frontend runtime obitelj | `.nvmrc` bira Node 24, a `devEngines` zahtijeva 24.x.                                |
| Package manager          | `packageManager` bira točan npm 12.0.2 u snapshotu; `devEngines` odbija drugi major. |
| Backend                  | Gradle toolchain i image faze biraju Javu 21.                                        |
| Workflow implementacija  | Actioni koriste pregledane pune commit SHA vrijednosti.                              |

Operaterski vodič odvojeno bilježi validation pinove workera. Noviji JDK u baselineu ne mijenja backend ugovor. Frontend `.nvmrc` bira major, a Docker digest točan artefakt; to nisu ista razina zaključavanja.

## Alati pripadaju privremenom prostoru posla

Workflow predaje `frontend/.nvmrc` SHA-pinned setup-node Actionu i isključuje package-manager cache. Čita `packageManager`, validira oblik `npm@x.y.z` i instalira ga pod runner temp. Dodavanje njegova `bin` direktorija u `GITHUB_PATH` utječe na sljedeće korake posla, ne na trajni host toolchain.

```yaml
# Ilustracija opsega, ne potpuni workflow.
env:
  RUNNER_TOOL_CACHE: ${{ runner.temp }}/toolcache
# setup-node: node-version-file: frontend/.nvmrc
# setup-java: distribution: temurin, java-version: "21"
# npm prefix: $RUNNER_TEMP/npm
```

Tool cache nalazi se u jednokratnom prostoru. Backend posao izričito bira Javu 21 kroz setup-java. Ne traži zapis u `/opt/jdk` i ne mijenjaj deployment-host Javu radi CI kompilacije. To su drugi vlasnici i drugi aktivacijski postupci.

Ovisnosti instalira `npm ci` prema lockfileu. Raspon u `package.json` opisuje dopuštene nadogradnje; lockfile određuje stvarni graf zaključane instalacije. Promijenjeni raspon bez pregledanog lockfilea nije dovršena nadogradnja.

## Action pin i checkout granica

Puni Action commit veže preuzetu implementaciju umjesto promjenjivog taga. Komentar major verzije služi čitljivosti; nije pin. Nadogradnju pregledaj kao promjenu izvršivog koda, ovlasti i side effecta, ne samo zamjenu hasha prema novijoj oznaci.

Checkout postavlja `persist-credentials: false` kako kasnije source skripte ne bi naslijedile zadržane Git vjerodajnice. Normalni CI globalno ima read-only ovlasti. Registry objava pripada zasebnom svježem release poslu, ne instalaciji alata ili PR provjeri.

Action pin ne uklanja preuzimanje runtime artefakata. Stvarni prihvat novog hosta/projekta mora potvrditi odabranu verziju, lokaciju cachea i Gradle target. YAML pokazuje namjeru; stvarno izvršavanje dokazuje kompatibilnost.

## Pogreške i odluke

| Opažanje                                  | Odluka                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Runner ima Javu 25, aplikacija očekuje 21 | Odaberi deklarirani JDK samo za posao.                                  |
| npm major odgovara, točna verzija ne      | Koristi točnu `packageManager` verziju.                                 |
| VS Code vidi stari Node                   | Koristi projektni lokalni wrapper; CI pin nije popravak desktop PATH-a. |
| Action tag se promaknuo                   | Pregledaj novi commit i fiksiraj ga.                                    |
| Posao traži zajednički zapisivi cache     | Zasebno procijeni svježinu i izolaciju; zadano je disposable spremište. |
| Lockfile instalacija pada                 | Uskladi manifest i lock umjesto unconstrained instala.                  |

## Prihvat i inspekcija

Pregledaj deklaracije, lockfile, stvarno odabrane verzije, job-local putanje i Action commitove. Potvrdi kompatibilnost Java compile/runtime faza i da nisu dodane trajne host instalacije ili zadržane vjerodajnice.

Dokaz veži uz source reviziju i opažene alate u ovlaštenom CI-ju. Operativni setup ostaje u `docs/github-ci.md` i pool vodiču. **Budžeti resursa** objašnjavaju zašto ispravna verzija alata još traži ograničeno unutarnje izvršavanje.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/.nvmrc`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/package.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/package-lock.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/README.md`
