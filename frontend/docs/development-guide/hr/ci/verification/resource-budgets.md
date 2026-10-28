# Ograniči konkurentnost na svakoj razini izvršavanja

Predvidljiv CI zahtijeva ograničeno cijelo stablo procesa, ne samo broj matrix poslova ili testnih workera. Kapacitet, rokovi i obuhvat zasebni su uvjeti koje treba promatrati zajedno.

**Ugrađeni obrazac predloška.** Workflow, `infrastructure/ci/test_shards.py`, backend Gradle i frontend Vitest konfiguracija upravljaju aplikacijskim izvršavanjem. `infrastructure/ci/README.md` upravlja poolom i host rezervom. Brojevi opisuju izvorni snapshot, ne univerzalni tuning recept.

## Okidač, vlasnik i ugovor

Primijeni kad build bude ubijen, poslovi čekaju, testovi usporavaju ili se predlaže više shardova. Održavatelj upravlja unutarnjim alatima i nedjeljivim poslovima. Operater upravlja ukupnim kapacitetom i rezervom za deployane aplikacije. Lokalna pravila workspacea odvojeno uređuju razvojne provjere.

Ugovor je ograničena konkurentnost na svim razinama uz očuvan obuhvat. Više shard poslova ne stvara više fizičkog CPU-a i RAM-a. Manji broj workera nije razlog za uklanjanje testova ili obveznih buildova.

```text
host kapacitet umanjen za rezervu
                |
    ograničeni istodobni worker slotovi
                |
         limiti pojedinog posla
                |
     Gradle / browser / test procesi
                |
       nedjeljiva datoteka ili build
```

Ako workspace traži jednu tešku provjeru istodobno, koordinator serijalizira buildove, typecheck i browser rad iako urednici mogu raditi neovisno. To nije ograničenje konkurentnosti produkcijskog aplikacijskog koda.

## Stvarna unutarnja ograničenja

Workflow ima tri frontend i tri backend testna sharda uz isključeni matrix fail-fast. Slotovi određuju stvarni broj istodobnih poslova; matrica određuje koliko ih čeka. Frontend shard izričito koristi jedan Vitest worker. Vitest konfiguracija u snapshotu također koristi jedan worker u CI-ju i dva lokalno.

Frontend statička provjera ograničava Nodeov old-space heap na 1536 MiB. Storybook, potpuna provjera aplikacija za staging i produkcijski Docker build koriste isti heap limit te `ROLLDOWN_WORKER_THREADS=2` i `RAYON_NUM_THREADS=2`. Rolldownov runtime i Rayon imaju zasebne native thread poolove; samo ograničenje JavaScript heapa ne ograničava njihovu memoriju. Ove postavke samo za build ostavljaju prostor za native alokacije, runner i ostale procese unutar memorijskog budžeta workera. Ne mijenjaju okolinu deployane aplikacije. Vidi [Rolldownovu dokumentaciju thread poolova](https://rolldown.rs/guide/troubleshooting).

Workflow za produkcijski deploy promovira točno onaj par slika koji je staging prihvatio, bez ponovnog builda. Njegovi koraci promocije i zahtjeva ne pokreću Node ni native build poolove; ograničenja pripadaju koraku provjere za staging i buildu slika.

Uz OOM brojače pregledaj `memory.events` i memorijski pritisak. Dugotrajni reclaim iznad `memory.high` može zaustaviti napredovanje builda i runner heartbeat bez OOM killa. Prije prijedloga većeg host limita izmjeri stvarni build s ograničenim heapom i native poolovima; lokalni RSS procesa pomoćni je dokaz, a potpuni CI run mora stati i unutar worker cgroupa.

Backend kompilira cjelovite testne izvore. Inventar i stvarni testovi koriste jedan fork, a testni JVM vidi dva procesora. Spring context cache ograničen je na dva jer svaki kontekst drži server, pool i PostgreSQL resurse. Fixturei zajedničke baze ne postaju sigurni za paralelno izvršavanje samo promjenom rasporeda klasa.

Build JVM ima zaseban limit:

```properties
org.gradle.workers.max=2
org.gradle.jvmargs=-Xms256m -Xmx512m -XX:MaxMetaspaceSize=384m -XX:ActiveProcessorCount=2 -Dfile.encoding=UTF-8
```

To su trenutačno odabrane vrijednosti. Dockerfile kopira `gradle.properties` pa limit vrijedi i pri kompilaciji slike. Heap nije sva memorija: metaspace, native memorija, drugi procesi i kontejnerski overhead ostaju dodatni. Zato procesni limit ne zamjenjuje vanjski limit posla.

## Resursi nisu samo CPU

Operaterska konfiguracija ograničava memory high/max, swap, CPU kvotu, broj zadataka, disk, trajanje i host rezervu. Višeslotni pool traži eksplicitne zbrojne CPU/RAM budžete. Testcontainers i image layeri troše disk i memoriju i uz jedan testni worker.

Mrežne ovlasti nisu tuning opcija. Ne izlaži host Docker i zajednički zapisivi cache radi brzine. Povećanje task limita također ne rješava procurjelo stablo browser procesa.

Odvojeno mjeri čekanje, instalaciju alata i ovisnosti, kompilaciju, image build, runtime provjeru i stvarno izvršavanje assertiona. Sporiji ukupni run može biti posljedica zauzetosti poola. Težine osvježavaj iz uspješnih potpunih izvješća; početne vrijednosti samo su planiranje.

## Optimiziraj stvarno pomičan uski grlo

Najprije identificiraj najsporiju nedjeljivu datoteku ili build. Veća matrica ne dijeli jednu datoteku. Sačuvaj affinity kad je potreban lifecycleu fixturea. Ažuriraj težine da uravnotežiš raspored pa pregledaj queue prije dodavanja kapaciteta.

Dodatni kapacitet operaterska je promjena s rezervom i prihvatnim dokazima. Istodobno povećanje slotova i unutarnjih workera otežava razumijevanje uzroka i može pojesti rezervu. Mjeri jednu pregledanu promjenu odjednom.

Povijesni cilj brzine ne opravdava novi proizvoljni hard timeout ili zamjenu obveznih provjera noćnim poslovima. Vlasnički CI vodič navodi aktualnu politiku prihvata i mjerenja.

## Pogreške i odluke

| Simptom                              | Inspekcija i odluka                                                    |
| ------------------------------------ | ---------------------------------------------------------------------- |
| OOM uz jedan worker                  | Pregledaj JVM/native potrošnju, kontekste, kontejnere i parent cgroup. |
| Dugi queue, kratko izvršavanje       | Izmjeri pool i rezervu prije povećanja matrice.                        |
| Jedna datoteka dominira              | Pregledaj granule i lifecycle; težina je ne može podijeliti.           |
| Aplikacije na hostu usporavaju uz CI | Zaštiti rezervu i pregledaj zbrojne limite.                            |
| Disk pun uz mali heap                | Pregledaj pripadajuće layere, job filesystem i cleanup.                |
| Setup dominira                       | Procijeni sastav poslova bez spajanja različitih ovlasti.              |

## Prihvat i inspekcija

Zabilježi source, potpun dokaz inventara, stvarno preklapanje poslova, queue/setup/execution vremena i zbrojne resurse. Potvrdi single-worker/fork i Gradle limite u image buildu. Obuhvat provjera mora ostati nepromijenjen.

Brz djelomični run nije prihvat. Zeleni potpun run uz limite dokazuje odabrani source i workload, ne sve buduće veličine skupa. Povezane teme: **Dokaz shardova**, **Rokovi faza i čišćenje procesa** te operaterski vodič za stvarnu promjenu kapaciteta.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test-timings.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/gradle.properties`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/vitest.config.ts`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`
