# Aplikacijsku politiku odvoji od library mehanike

Prije ekstrakcije odluči pripada li ponašanje public modulu, template konvenciji ili aplikaciji. Sličan JSX i više pozivatelja nisu sami dovoljan admission dokaz.

**Ugrađena RGO granica uz classification smjernice.** App feature/shell vodiči određuju consumer ownership. RGO `PUBLIC_MODULE_CONTRACT` vrijedi za zasebni library repo. Vireo projection je referentni vokabular, ne zamjenski API.

## Okidač, vlasnik i ugovor

Koristi za shared UI, feature logiku predloženu paketu ili generator konvenciju. App zadržava domain vrijednosti, validaciju, prijevode i persistence. Library posjeduje odobrenu neutralnu mehaniku, lifecycle i accessibility.

Sučelje treba sakriti stvarnu složenost bez preuzimanja product odluka. Pass-through, kraći import ili hipotetski reuse nisu dovoljni.

## Prvo klasifikacija

| Vrsta             | Odgovornost                                       |
| ----------------- | ------------------------------------------------- |
| Published runtime | Neutralna mehanika s dokazom i stabilnim API-jem. |
| Recipe/template   | Kompozicija koju app prilagođava.                 |
| Consumer feature  | Domain pravila, state, ovlasti i workflow.        |
| Bez ekstrakcije   | React/MUI/postojeća kompozicija dovoljna.         |

RGO public modul treba stvarni use plus konkretnog drugog potrošača ili platform policy. Leverage traži manju meaningful površinu, deletion da bi uklanjanje redistribuiralo stvarnu složenost.

To vrijedi za library promjenu, ne svaku lokalnu komponentu. Normativni library ugovor traži izričito odobren public-module proposal i novo odobrenje za materijalnu promjenu. Članak nije takva ovlast niti dopušta peer edit.

## Konkretna granica

Grouped list može posjedovati interaction, semantiku, focus i grouping. App šalje labele, ikone, destination, grupe i availability. Shared list ne čita registry da otkrije product policy.

Form mehanika može biti library, ali Zod schema, poruke, mutacija i transport ostaju app. Storage service validira injected schema bez odlučivanja što business treba pamtiti.

```text
app: vrijednosti / pravila / prijevodi / konfiguracija
                       |
                narrow public input
                       |
library: mehanika / accessibility / lifecycle / customization
```

## API nije samo tip

RGO consumer importa root. Public owner ima namjerne named runtime/type exporte i metadata. Internal nije podržani seam. Visible copy i accessible name dolaze iz appa; uska legacy fallback iznimka ne dopušta novu product copy u paketu.

Defaulti, callback order, cancel, cleanup, errors, environment i precedence dio su ugovora. Privatni refaktor može promijeniti javno ponašanje.

Library ima vlastiti MUI styling/slot ugovor. Ne kopiraj drugu platformsku konvenciju bez owner provjere. App arhitektura i domain state ostaju zasebni.

## Pogreške i odluke

| Opažanje                             | Odluka                                   |
| ------------------------------------ | ---------------------------------------- |
| Helper samo preimenuje prop          | Zadrži kompoziciju bez stvarne mehanike. |
| Shared treba product rute            | Policy u app, narrow data u UI.          |
| Paket traži domain validaciju        | Inject schema ili feature owner.         |
| Tipovi prolaze, callback order drugi | Behavioral breaking review.              |
| Novi runtime dependency              | Zasebno izričito library odobrenje.      |
| Peer modul nije instaliran           | Reference s mapiranim suradnicima.       |

## Prihvat

Navedi classification, potrošače, skrivenu složenost, exporte, state i failure/lifecycle. Public promjena traži dokaz paketa i potrošača uz ovlast. Članak ne stvara modul, dependency ili odobrenje.

Kod public promjene posebno pregledaj kontrolirani i nekontrolirani state, dopuštena preklapanja poziva i ponašanje nakon unmounta ili disposea. To su ugovori koje korisnik biblioteke osjeća i kad prop tipovi ostanu isti. Zajednički izgled nije dovoljan razlog za zajednički poslovni lifetime ili persistence owner.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/source-map-and-ownership.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/dependency-boundaries-and-imports.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:docs/platform/PUBLIC_MODULE_CONTRACT.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/index.ts`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
