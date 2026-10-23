# Provjeri par na stagingu i promoviraj upravo prihvaćeni artefakt

Odvoji aplikacijski build, objavu u registry i mutaciju hosta u različite faze ovlasti. Produkcija dobiva isti nepromjenjivi par koji je prihvatio staging, uz workflow dokaz i trajni host receipt.

**Ugrađeni obrazac predloška.** Vlasnici su `.github/workflows/deploy-staging.yaml`, `.github/workflows/deploy-production.yaml` i fiksni release client/controller. To je ručna uparena isporuka monorepozitorija; ne automatski PR deployment ni neovisna promocija komponenti.

## Okidač, vlasnik i ugovor

Ovlašteni održavatelj odabire branch kroz GitHubov izvorni manual selector. Workflow i host validiraju točan odabrani SHA. Operater je prethodno instalirao pregledani kod, zaštićenu konfiguraciju, certifikat/ključ i identitete repozitorija, aktera i workflowa. Novi projekt iz predloška ne nasljeđuje te preduvjete.

Ugovor ima tri dijela: aplikacijske build naredbe ne dobivaju package-write; objava se odvija u svježem workeru nakon neovisne provjere artefakta; produkcija prihvaća samo source/pair koji je već prošao staging. Upload slike ili zahtjeva ne znači uspješan deployment.

## Faza 1: build s read-only ovlasti

Staging posao `build` potvrđuje da je `git rev-parse HEAD` jednak `GITHUB_SHA`, provjerava infrastrukturne helpere i obje aplikacije te gradi frontend/backend kandidate iz tog checkouta. Repozitorijski token ostaje read-only. Branch npm/Gradle kod zato ne dijeli worker s registry-write tokenom.

Slike se spremaju u artefakt čiji naziv uključuje trenutni attempt. Trenutačna retencija je jedan dan. Artefakt služi prijenosu između izoliranih workera; još nije objavljeno izdanje ni dokaz staging prihvata.

Normalna release provjera uključuje smislene testne skupove. Opis te politike ne dopušta izvršavanje testova u drugom zadatku gdje ih je korisnik zabranio. Lokalni handoff takvog zadatka treba navesti izostanak, bez slabljenja release automatizacije.

## Faza 2: neovisna provjera i objava

Posao `release` počinje u drugom jednokratnom workeru koji nije izvršavao branch npm/Gradle kod. Učitava kandidatsku arhivu, provjerava točan izvor i neovisno izvršava image smoke provjere pod ograničenjima. Samo taj posao ima `packages: write`.

Pregledani helper kroz izolirani Python objavljuje slike, bilježi digeste i provjerava privatnu vidljivost paketa. `release-pair-<attempt>` trenutačno se čuva trideset dana. Ta retencija nije trajna arhiva svih izdanja.

```text
build worker               svježi release worker       request worker
contents:read              contents:read                contents/actions:read
npm + Gradle + Docker -->  packages:write           --> packages:read
kandidatski artefakt        smoke + digest par           deployments:write
                                                       šifrirani zahtjev + čekanje
```

Privilegirani helperi koriste `python3 -I -S` i izričito učitavaju pregledani transport. Sibling modul dodan u branch ne smije zasjeniti Python standardnu biblioteku. Host source pinovi vežu oba workflowa i pouzdane helpere uz neovisno pregledane bajtove.

## Faza 3: zahtjev pa čekanje stvarnog host rezultata

Treći worker preuzima točan par i stvara deployment zahtjev. Ima read ovlasti za contents/actions/packages i write za deployment statuse; ne može objavljivati slike. Client šifrira par, run/attempt i kratkotrajni token aktivnog request posla javnim certifikatom kontrolera. U jednodnevni artefakt ulazi samo CMS ciphertext. Privatni ključ ostaje na hostu.

Fiksni host kontroler provjerava privatni repozitorij, originalnog i triggering aktera, workflow ID/putanju, aktivni manual run/attempt, hash pouzdanih izvora, točan Deployment payload i stvarno aktivni request posao. Ne prihvaća shell, Compose, mount ili host putanju iz podataka artefakta.

Instalirani runtime povlači točne digeste, čuva zasebnu bazu, zamjenjuje aplikacijski par pod environment lockom te provjerava stvarne image ID-eve, health i javne rute/oznake okruženja. Request posao čeka završni host status. Timeout zahtijeva inspekciju journala; ne dokazuje da se ništa nije promijenilo.

## Promocija bez novog builda

Ove su naredbe samo neizvršene ilustracije. Zahtijevaju zasebno ovlašten i inicijaliziran projekt te zamjenu placeholdera:

```sh
gh workflow run deploy-staging.yaml --repo OWNER/REPOSITORY --ref SOURCE_BRANCH
gh workflow run deploy-production.yaml --repo OWNER/REPOSITORY \
  --ref SAME_SOURCE_BRANCH -f staging_run_id=SUCCESSFUL_STAGING_RUN_ID
```

Produkcijski branch mora i dalje pokazivati na prihvaćeni SHA. Ako se pomaknuo, koristi ili sačuvaj release branch na točnom commitu. Ne mijenjaj source polje para kako bi odgovaralo novijem vrhu grane.

Client odabire `release-pair-<staging-attempt>` iz uspješnog manual staging runa s istim izvorom. Host dodatno traži očekivani staging workflow i trajni uspješni receipt za točan run/attempt i identičan par. Drugi zeleni workflow ili izmišljeni artefakt nisu dovoljni.

Svako okruženje ima vlastiti concurrency group i `cancel-in-progress: false`. Otkazivanje suvišnog CI-ja i prekid mutacije stanja nisu jednaki postupci. Produkcija nema build/publish fazu ni selector pojedinačne komponente.

## Pogreške i odluke

| Opažanje                                         | Značenje i postupak                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| Build skripta vidi package-write token           | Obnovi odvajanje svježih workera prije releasea.                          |
| Slike su objavljene, zahtjev čeka                | Objava je uspjela; host deployment nije razriješen.                       |
| Branch se pomaknuo                               | Odaberi branch na prihvaćenom SHA ili novi staging kandidat.              |
| Staging je zelen, host receipt nedostaje         | Ugovor promocije nije potpun; pregledaj host i podrijetlo.                |
| Promijenjeni su pouzdani workflow/helper bajtovi | Potreban je izričit pregledani operaterski update; odbijanje je namjerno. |
| Završni status izgubljen nakon zamjene           | Prije ponavljanja uskladi transaction i stvarne slike.                    |

## Prihvat i inspekcija

Pregledaj permissions po poslu, ne samo globalne zadane vrijednosti. Potvrdi neovisnost svježeg workera, nazive artefakata trenutnog attempta, jednakost para i odsutnost produkcijskog rebuilda. Provjeri očuvanje izvora pri odabiru release grane.

Za stvarni prihvat zabilježi izvor/run/attempt, digeste, staging receipt, završni produkcijski host rezultat i zasebno potrebni poslovni prihvat. Build i pregled izvora nisu dokaz live deploymenta. Članak ne pokreće workflow, registry objavu ni promjenu hosta.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-staging.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-production.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
