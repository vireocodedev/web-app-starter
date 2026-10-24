# Build, objava i deployment zahtjev trebaju različite ovlasti

Zaštiti release vjerodajnice odvajanjem izvršivog aplikacijskog builda, registry objave i zahtjeva hostu. Svaka faza predaje ograničeni artefakt i dobiva samo ovlast potrebnu za svoj ishod.

**Ugrađeni obrazac predloška.** Staging workflow, release client/protocol i zaštićeni host controller upravljaju podjelom. Članak objašnjava ovlasti; **Staging i produkcijska promocija** opisuje operatorski tok i odabir prihvaćenog para.

## Okidač, vlasnik i ugovor

Koristi kad dependency instalacija traži tajne, kada se spajaju release poslovi, mijenja artifact transport ili predlaže deployment iz PR shell procesa. Aplikacijski održavatelj upravlja build ulazima. Release održavatelj upravlja pouzdanim workflow/client kodom. Operater upravlja instaliranim host kodom, source pinovima i konfiguracijom.

Ugovor je da branch npm/Gradle build ne dijeli worker s registry-write ovlasti. Runner ne dobiva host Docker socket, deployment SSH ključ ili proizvoljno host izvršavanje. Objava, stvaranje zahtjeva i host prihvat zasebni su ishodi.

## Najprije nacrtaj permission matricu

| Faza           | Izvršava                              | Trenutačna token ovlast                           | Izlaz                            |
| -------------- | ------------------------------------- | ------------------------------------------------- | -------------------------------- |
| Build          | Aplikacijske provjere i Docker build  | `contents: read`                                  | Kandidatska arhiva attempta      |
| Svježi release | Restricted smoke i pouzdani publisher | `contents: read`, `packages: write`               | Immutable digest par             |
| Request/wait   | Šifrirani handoff i status polling    | Contents/actions/packages read, deployments write | Ciphertext i završni status      |
| Zaštićeni host | Fiksni pregledani runtime             | Zaštićena operaterska ovlast                      | Provjereno live stanje i receipt |

Svježi release worker ipak izvršava candidate kod: smoke namjerno pokreće slike u ograničenim kontejnerima. Nije izvršavao branch npm/Gradle skripte na worker filesystemu i ne mounta registry tajne u candidate kontejnere. Ključna je lokacija nepouzdanog koda i ovlast koja prelazi granicu.

## Svježina sprječava utjecaj build ostataka

Build skripta može mijenjati datoteke i ostaviti procese. Publish korak kasnije u istom workeru ne uklanja taj utjecaj. Workflow zato prenosi slike kroz artefakt trenutnog attempta, pokreće svježi release worker, neovisno provjerava kandidate i tamo poziva pregledani publisher.

Client prima registry autentikaciju kao ulaz svog koraka, piše privremeni Docker login i potom uklanja direktorij. Par bilježi digeste i privatnu vidljivost. Kandidat ne može poslati shell naredbu kao uputu objave.

Pouzdani helperi koriste `python3 -I -S` i eksplicitni pregledani transport. Checkout search path zato ne može neprimjetno podmetnuti branch modul umjesto standardne biblioteke. Host dodatno fiksira workflow/helper bajtove. Promjena te granice traži pregledani operaterski update, ne samo push.

## Zahtijevaj operaciju, ne šalji host naredbe

Request validira par, stvara Deployment vezan uz source/environment/run/attempt te javnim host certifikatom šifrira kratkotrajni token i ticket. Artefakt sadrži ciphertext; privatni ključ ostaje na hostu. Download ograničava veličinu i članove arhive, provjerava digest i ne prosljeđuje GitHub Authorization na potpisani storage URL.

Kontroler provjerava aktivni manual workflow/attempt, privatni repozitorij, dopuštene aktere, očekivani workflow ID/putanju, točan payload, source hash i aktivni request posao. Produkcija dodatno zahtijeva uspješni staging workflow i trajni host receipt identičnog para.

```text
runner: fiksni ticket -> šifrirani artefakt -> zaštićeni validator
                                                  |
                                      instalirani fiksni runtime
                                                  |
                                   environment lock + digest par
```

Nema polja za proizvoljni Compose, shell, putanju ili mount. Runtime derivira konfiguraciju iz zaštićenih postavki. Request čeka konačni host status dok kratkotrajni token još vrijedi. Sam zahtjev ne dokazuje uspjeh mutacije.

## Optimizacija mora čuvati granice

Ušteda setupa vrijedi samo uz očuvane ovlasti. Kompatibilne read-only faze mogu se pregledati za objedinjavanje. Build i publish ne spajaju se samo zato što koriste Docker. Upload iz prethodnog posla ne čini kandidata pouzdanim; neovisna provjera dio je ugovora.

PR CI ostaje read-only i ne pokreće privilegirani host rad implicitno. Dispatch, deployment, host instalacija i merge trebaju vlastitu autorizaciju zadatka. Čitanje vodiča nije takva radnja.

## Pogreške i odluke

| Opažanje                                    | Odluka                                            |
| ------------------------------------------- | ------------------------------------------------- |
| Publish slijedi npm install u istom workeru | Vrati svježu fazu prije package-write ovlasti.    |
| Candidate traži registry token mount        | Preoblikuj tok; smoke ne nasljeđuje tajne objave. |
| Branch helper zaobilazi pin                 | Ne isključuj zaštitu; potreban je review/update.  |
| Artefakt šalje shell ili Compose            | Odbij; host prihvaća samo fiksni ticket.          |
| Push slike uspije, host odbije ticket       | Odvojeno izvijesti objavu i deployment.           |
| Wait timeout nakon moguće zamjene           | Prije retrya uskladi journal i live stanje.       |

## Prihvat i inspekcija

Pregledaj permissions svakog posla, svježe workere, tajne samo u pouzdanim koracima i odsutnost host ovlasti u runnerima. Provjeri source/attempt vezivanje, source pinove, ciphertext transport i čekanje završnog statusa.

Live prihvat traži controller receipt i stvarni image/public dokaz, ne upload. Operativni postupci ostaju u `infrastructure/release/README.md`; članak ne mijenja tokene, workflow, host ni registry.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-staging.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-production.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
