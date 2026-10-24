# VS Code launch dijagnosticiraj redom njegovih ovisnosti

Checked-in debugger treba biti ponovljiv ulaz, a dijagnoza počinje prvom palom ovisnošću. Java launch, database task i frontend terminal imaju različite preduvjete i lifetime.

**Ugrađeni starter workflow.** Ponašanje definiraju `.vscode/launch.json`, `.vscode/tasks.json` i lokalni backend helperi. README i initializer runbook upravljaju pripremom. Članak produbljuje uvod **Jedan workspace, dva runtimea** konkretnim debug odlukama.

## Okidač, vlasnik i ugovor

Koristi kada Run and Debug stane prije Jave, desktop VS Code vidi stari Node ili breakpoint nije aktivan. Workspace upravlja task kompozicijom, backend startupom, a IDE priprema extensionima i Gradle importom.

Ugovor je priprema tajni, startup i autentikacija baze ovog checkouta pa Java iz backend direktorija s lokalnim profilom. Frontend se pokreće neovisno i izričito koristi pravi HTTP. Konfiguracije ne pokreću jedna drugu.

## Stvarni backend redoslijed

```text
Backend: local dev
  -> Backend: prepare local credentials
     -> with-local-node.sh -> setup-local.mjs
  -> Backend: start local PostgreSQL
     -> with-local-node.sh -> start-local.mjs
     -> Compose readiness + password SELECT 1
  -> Java BackendApplication, backend cwd, backend/.env, local profil
```

Process taskovi šalju apsolutne workspace putanje pa ne ovise o slučajnom shell cwd-u. Setup ekskluzivno stvara datoteku i čuva postojeći env. Poruka “Keeping the existing backend/.env unchanged” je uspješno očuvanje, ne blokiran prompt niti dokaz ispravne lozinke.

Start helper bira eksplicitne Compose/env putanje i provjerava password kroz service DNS. Readiness nije autentikacija. Pad pre-launcha namjerno blokira Javu dok je identitet baze nejasan ili lozinka odbijena.

## Desktop PATH i instalirani runtime nisu isto

Task čita major iz `frontend/.nvmrc`. Ako PATH nema odgovarajući Node, wrapper pokušava postojeći nvm, bira već instalirani runtime i ponovno provjerava. Ne preuzima Node. Missing-runtime poruka traži pripremu, ne slabljenje major provjere.

Frontend node-terminal pokreće npm iz `frontend/`, bez backend wrappera. Treba mu deklarirani Node/npm i instalirane lockfile ovisnosti. Popravljen backend PATH ne dokazuje dostupnost frontend alata.

Java launch koristi stvarni main class, backend cwd/env i `--spring.profiles.active=local`. Otvori root, potvrdi workspace trust i dovrši Java extension/Gradle import. Ne kopiraj hard-coded consumer main class.

## Prva pogreška određuje odluku

| Pogreška                         | Odluka                                                    |
| -------------------------------- | --------------------------------------------------------- |
| Node major nedostaje             | Pripremi deklarirani runtime/nvm i ponovi isti task.      |
| Docker/Compose nedostupan        | Riješi lokalni Docker pristup.                            |
| DB loopback port zauzet          | Identificiraj vlasnika i odaberi slobodan port checkouta. |
| Baza zdrava, lozinka odbijena    | Uskladi env i volumen bez brisanja.                       |
| Main class/projekt nije pronađen | Pregledaj import, extension i package identitet.          |
| Java radi, breakpoint nije vezan | Provjeri importani source i stvarno pokrenutu klasu.      |
| Browser dobiva mock              | Provjeri frontend proces i API mode.                      |

## Sačuvaj lifetime i ulaze

Frontend launch za svoj proces postavlja `/api`, HTTP, credentials i development label, nadjačavajući stari lokalni mock izbor. Zasebno pokrenuti Vite ima svoje postavke. Strict loopback port ne dopušta tihi prelazak na drugi port.

Zaustavljanje Java debuggera ne briše i ne zaustavlja PostgreSQL. Koristi dokumentirani project-scoped Compose stop; normalni debugger stop ne smije rušiti volumen.

Local profil dopušta HTTP cookie samo lokalno. Ne koristi ga za popravak produkcijskog HTTPS-a i ne kopiraj produkcijske tajne u lokalni env.

## Prihvat i inspekcija

Zabilježi launch nazive, odabrani runtime, pre-launch autentikaciju, Java startup/breakpoint i real HTTP način. Env i login tajne ostaju privatne.

Kod blokade imenuj sloj i čuvaj podatke. Debug uspjeh nije puna regresija, CI readiness ili deployment ovlast. Runbook ostaje vlasnik preduvjeta; članak ne pokreće task/debugger.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.vscode/launch.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.vscode/tasks.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/with-local-node.sh`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/setup-local.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/start-local.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/runbook.md`
