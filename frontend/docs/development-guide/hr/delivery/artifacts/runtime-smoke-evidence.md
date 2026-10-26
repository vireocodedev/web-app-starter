# Provjeri proizvedenu sliku pod stvarnim runtime ograničenjima

Provjeravaj pakirani artefakt uz jednokratne podatke i iste vrste ograničenja kao pri deploymentu. Zeleni dev server i uspješan Docker build ne dokazuju startup konačne slike ili njezin HTTP ugovor.

**Ugrađeni obrazac predloška.** `infrastructure/release/smoke_images.py` upravlja startupom, probeovima i točnim cleanupom. Dockerfileovi definiraju korisnike, labele, entrypoint i healthcheck. Host runtime zasebno provjerava jači identitet stvarnog deploymenta.

## Okidač, vlasnik i ugovor

Koristi pri promjeni Dockerfilea, korisnika, Nginx ruta, backenda, provisioninga ili pakiranja. Aplikacijski vlasnik upravlja ponašanjem i slikom. CI/release vlasnik poziva helper unutar izoliranog workera. Trajni aplikacijski podaci nisu ulaz.

Ugovor je task-unique resurs, generirana scratch tajna, ograničeni probe, restricted non-root container i čišćenje samo resursa čije je stvaranje ovaj poziv pokušao. Smoke uspjeh je dokaz artefakta; ne potvrđuje poslovni prihvat i ne daje deployment ovlast.

## Čitaj samo potrebne metapodatke

Helper traži dopuštene metadata fieldove umjesto punog env dumpa. Odbija root/praznog korisnika i traži očekivanu OCI revision labelu. Sam ne potvrđuje točan frontend/backend UID ni source-repository labelu. Fiksni deployment runtime naknadno provjerava točne korisnike, source/revision labele i stvarne image ID-eve.

Ta razlika sprječava prejaku tvrdnju o dokazu. Smoke rezultat i host receipt nadopunjuju se, nisu ista provjera. Pair protokol zasebno validira registry putanje komponenti i digest identitet.

## Resursi pripadaju samo zadatku

Poziv generira nepredvidiv prefix i privremeni direktorij. Backend dobiva nove nepovezane database/provisioning lozinke u zaštićenim scratch env datotekama. Digest-pinned PostgreSQL radi na task mreži. Baza i zapisive runtime putanje koriste ograničeni tmpfs, bez produkcijskog volumena, vjerodajnica ili mreže.

Aplikacijski kontejneri imaju read-only root, uklonjene capabilities, no-new-privileges, memory/PID limite i ograničeni `/tmp`. Probeovi koriste dinamične loopback portove, ne trajni javni servis.

```text
proizvedene slike + očekivana revizija
                 |
   task mreža / scratch baza / generirani ulazi
                 |
      ograničeni aplikacijski kontejneri
                 |
       health + HTTP + state probeovi
                 |
       točno usklađivanje i cleanup
```

## Stvarno implementirane provjere

| Artefakt                  | Dobiveni dokaz                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend                  | Non-root/revision, `/healthz`, built SPA na `/login`, nepoznati API 404, missing asset 404, container health.             |
| Backend                   | Svježi PostgreSQL, startup migracija/sheme, health `UP`, anonimni session 401, CSRF header/token oblik, container health. |
| Normalni startup          | `app_user` ostaje prazan i uz provisioning ulaze.                                                                         |
| Eksplicitni provisioner   | Završava uspješno; isti repeat čuva red; konflikt lozinke pada bez izmjene.                                               |
| Dijagnostika provisionera | Generirane tajne ne pojavljuju se u uhvaćenom outputu.                                                                    |

Provisioner nema objavljeni app port. Scratch state provjerava se fingerprintom reda, bez prikaza korisničkih podataka. Helper ne radi potpuni browser login/logout, ne uspoređuje sve cache headere, ne dokazuje izvršavanje svih testova i ne provjerava kompatibilnost produkcijske sheme.

Redirect se odbija umjesto prihvaćanja kao zamjene endpointa. Polling ima rok i traži status/body ugovor, ne samo socket. Database startup pogreška može uključiti ograničenu redigiranu dijagnostiku; to nije dozvola za objavu proizvoljnih raw logova.

## Neizvjesno stvaranje razriješi točnim vlasništvom

Naziv se bilježi prije pokušaja stvaranja, a `finally` pokreće cleanup. Izgubljeni Docker odgovor nakon stvaranja zato vodi inventaru točnog naziva umjesto pretpostavke da resursa nema. Kontejneri se uklanjaju obrnutim redom, zatim točna mreža. Neuspješan inventar ili uklanjanje prijavljuje potrebu za inspekcijom.

Brisanje po širokom prefixu, uklanjanje svih kontejnera ili shared-daemon prune nije isto. Cleanup ne smije dirati lokalne baze, deployane volumene ili drugi task. Važan je i nakon ranijeg pada probea.

## Pogreške i odluke

| Opažanje                                     | Odluka                                              |
| -------------------------------------------- | --------------------------------------------------- |
| Build prolazi, restricted entrypoint pada    | Pregledaj user/filesystem/temp i podržani host.     |
| I drugi programi padaju uz no-new-privileges | Dijagnosticiraj host politiku bez tihog slabljenja. |
| Health prolazi, session/CSRF ne              | Smoke je neuspješan; popravi API/startup granicu.   |
| Isti provisioning mijenja red                | Narušena je idempotentnost.                         |
| Probeovi prolaze, cleanup inventar pada      | Sačuvaj neuspjeh i pregledaj točne resurse.         |
| Smoke prolazi, javno okruženje nije dobro    | Potreban je zasebni host prihvat.                   |

## Prihvat i inspekcija

Zadrži očekivani source, stvarne reference, helper rezultat i cleanup ishod. Provjeri ograničenja i mogućnost njihova nepromijenjenog izvođenja na podržanom hostu. Opiši granice: status smoke nije potpuna regresija ni poslovni prihvat.

Operativni pozivi ostaju u `infrastructure/release/README.md`; povezane teme su ugovori slika i immutable promocija. Članak ne izvršava container ili database radnje.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
