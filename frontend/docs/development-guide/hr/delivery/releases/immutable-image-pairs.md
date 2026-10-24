# Isporuči jedan nepromjenjivi par frontend/backend slika

Fullstack izdanje čine dvije izvršive slike iz istog točnog izvora. Između okruženja promoviraju se isti registry digesti. Time se sprječava nepodudaranje frontenda i API-ja te odvaja identitet artefakta od pomicanja grane.

**Ugrađeni obrazac predloška.** Ugovor monorepozitorijskog para pripada vodiču `infrastructure/release/README.md`, helperima `protocol.py` i `client.py` te aplikacijskim Dockerfileovima. Neovisna komponentna izdanja iz split-repository infrastrukture zasebna su arhitektura, ne zadano ponašanje.

## Okidač, vlasnik i ugovor

Koristi kada se frontend i API predloška isporučuju zajedno. Održavatelj odgovara za slike i kompatibilnost. Release workflow proizvodi par. Zaštićeni host executor ga validira i pokreće, bez prihvaćanja shell ili Compose naredbi iz repozitorijskog artefakta.

Ugovor je jedan repozitorij, jedan SHA izvora od 40 znakova, jedan frontend digest i jedan backend digest. Staging provjerava taj par. Produkcija promovira prihvaćeni par bez novog builda. PostgreSQL kontejneri i volumeni imaju zaseban lifecycle okruženja; nisu zamjenjive aplikacijske slike.

```text
točan checkout SHA
        |
   +----+----+
   |         |
frontend   backend
   |         |
   +----+----+
      par digesta
        |
 staging provjera + trajni dokaz
        |
 produkcija: isti par bez rebuilda
```

## Shema para namjerno je uska

Parser prihvaća točno četiri ključa. Primjer je shematski i placeholderi nisu stvarne vrijednosti:

```json
{
  "source_sha": "<40-malih-heksadekadskih-znakova>",
  "repository": "owner/repository",
  "frontend": "ghcr.io/owner/repository-frontend@sha256:<64-hex-znaka>",
  "backend": "ghcr.io/owner/repository-backend@sha256:<64-hex-znaka>"
}
```

Funkcija `pair()` odbija nepoznata ili nedostajuća polja, nesklad repozitorija/izvora, promjenjivi tag i neočekivanu registry putanju. Svaka referenca mora imati odgovarajuću komponentnu GHCR putanju i potpuni digest. Dekoder odbija i ponovljene JSON ključeve, kako isti dokument ne bi imao dvosmisleno značenje.

Objava privremeno označava slike workflow runom i attemptom, šalje ih u registry, čita digest reference, validira par i potvrđuje privatnu vidljivost container paketa. Tag je pomoć pri objavi; digest je identitet za deployment. Git SHA label je koristan dokaz podrijetla, ali nije zamjena za digest.

## Slika mora vrijediti u oba okruženja

Frontend Dockerfile radi produkcijski Vite build sa same-origin `/api`, HTTP adapterom i uključenim credentials ponašanjem. Staging hostname ne ulazi u JavaScript. Javni routing i TLS pripadaju host proxyju pa se ista slika može prenijeti u produkciju. `VITE_*` postavke vidljive su pregledniku i ne smiju sadržavati tajne.

Frontend koristi neprivilegirani Nginx kao `101:101` na privatnom portu `8080`. Podržava read-only filesystem i ograničeni `/tmp`. Konfiguracija razlikuje SPA history rute od nepostojećih hashiranih asseta i API putanja. Vraćanje HTML-a aplikacije za takve pogreške prikrilo bi integracijski problem.

Backend se kompilira Javom 21 u JDK fazi, zatim pokreće jar kroz JRE kao `10001:10001`, također na privatnom `8080`. Zaštićena konfiguracija vanjske baze dolazi pri izvođenju. Jar je read-only; fiksni host runtime uklanja capabilities, uključuje no-new-privileges i ograničava privremeni prostor. Produkcijske vjerodajnice i podaci ne ulaze u image layer.

Oba Dockerfilea validiraju SHA i postavljaju OCI source/revision labele. Bazne slike fiksirane su digestom. Promjena čitljivog taga bez pregledane promjene digesta ne mijenja artefakt. `.dockerignore` pravila štite build context od lokalnih env datoteka i neprimjerenih generiranih ulaza.

## Build, runtime i live stanje različiti su dokazi

Docker build dokazuje kompilaciju i pakiranje prema svom ugovoru. Ne dokazuje izvršavanje redovnog skupa testova. Release faza zato zasebno provjerava obje aplikacije prije pakiranja. Backend image build ne pokreće Testcontainers unutar BuildKita.

Smoke helper provjerava dopuštene metapodatke i podiže ograničene task-unique kontejnere. Za frontend provjerava health, HTML, history rute i API/asset pogreške. Backend dobiva privremeni PostgreSQL za migracije, validaciju sheme, health i autentikacijske granice. Predmet je stvarni artefakt, ne lokalni dev server.

Host potom provjerava podrijetlo povučene slike, točne image ID-eve pokrenutih kontejnera, health i javne rute s oznakom okruženja. Proizvodnja artefakta, staging prihvat i dokaz live stanja ne smiju se spojiti u jednu tvrdnju.

## Pogreške i odluke

| Opažanje                                    | Odluka                                                    |
| ------------------------------------------- | --------------------------------------------------------- |
| Komponente navode različite SHA vrijednosti | Odbij par i proizvedi usklađeno izdanje.                  |
| Referenca koristi `:latest` ili drugi tag   | Zabilježi validirani digest kroz release protokol.        |
| Produkcija treba staging-specifični rebuild | Ukloni ugrađene pretpostavke o okruženju.                 |
| Labele su očekivane, digest nije            | Labele nisu identitet prihvaćenog artefakta; odbij sliku. |
| Nova slika koristi trajnu bazu              | Zasebno analiziraj migracijsku kompatibilnost i oporavak. |
| Host odbija ograničeno izvođenje            | Istraži runtime granicu; ne slabi zaštitu radi prolaza.   |

## Prihvat i inspekcija

Pregledaj isti točan izvor obiju slika, očekivane repozitorije i digeste, privatnu vidljivost, OCI labele, korisnike, fiksirane baze i odsutnost tajni. Provjeri frontend granice history/API/asset te vanjsku backend konfiguraciju.

Zadrži par uz staging run/attempt i uspješan host receipt. Produkcijski dokaz mora navoditi iste digeste, ne novo naizgled jednako izdanje. Operativne postupke zadržava release README. Ovaj članak ne izvršava build, objavu ili deployment.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/nginx.conf`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/.dockerignore`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/.dockerignore`
