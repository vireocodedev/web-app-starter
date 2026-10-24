# Prije platform recepta utvrdi stvarno instalirani stack

Provjeri koji template, library i generator ugovor checkout stvarno sadrži. Sličan naziv, autor ili noviji peer projekt ne dokazuju API kompatibilnost ili upgrade put.

**Ugrađeni RGO profil uz odvojenu Vireo referencu.** Starter deklarira točan `@rgo-web/frontend` 1.0.3 i vlastiti Spring Boot backend. Vireo ecosystem/projection ugovori pripadaju drugoj liniji; ovdje nisu instalirana migracija.

## Okidač, vlasnik i ugovor

Koristi prije kopiranja primjera, upgradea, generatora ili tumačenja peer metapodataka. Aplikacijski vlasnik provjerava manifest, import, skripte i upute. Library/generator vlasnik definira svoje sučelje. Usporedba ne odobrava izmjenu izvornog peer repozitorija.

Prvo dokaz pa recept: utvrdi koordinatu i public API pa biraj odgovarajući vodič. Spomen naredbe nije dokaz dostupnosti.

```text
application source: <repo i commit>
frontend dependency: <manifest i lock>
backend contract: <build i ovisnosti>
public imports: <podržani entrypoint>
generator metadata: <postojeće/odsutno/povijesno>
upgrade owner: <stvarni postupak ili nedostaje>
```

To nije nova shema. Stari receipt opisuje podrijetlo, ne nužno današnje pakete i custom kod.

| Površina          | Starter                                        | Vireo referenca                            |
| ----------------- | ---------------------------------------------- | ------------------------------------------ |
| Frontend          | `@rgo-web/frontend` root                       | Više paketa i export subpathova.           |
| App               | `app`, `features`, tanke `pages`               | Projection i managed metadata.             |
| Backend           | Vlastiti Java/Spring                           | Vireo JVM compatibility set.               |
| Generator/upgrade | Samo stvarno bundled postupak                  | `create-vireo`, graph i transformi.        |
| Verzije           | Upstream RGO library/initializer sinkroniziran | Vireo paketi mogu imati različite verzije. |

Tablica ne predlaže zamjenu stacka. Reference package nije već dostupan import.

## Precizan identitet

Manifest bira RGO 1.0.3, lockfile stvarni artefakt. RGO snapshot ima ESM root API i peer raspone. Library `@/` je interna alias putanja, ne consumer seam.

Vireo ugovor veže npm/Maven/Template u compatibility set bez obvezne iste verzije svih paketa. Linija je u izvoru public alpha; “latest je stabilan” nije ispravna pretpostavka.

Node/npm/Java target također ima svog vlasnika. Reference CLI ili baseline ga ne zamjenjuje.

## Primijeni pravi recept

Prati stvarni import ili script do javnog ugovora. Ako helper nedostaje, opiši prilagodbu umjesto izmišljenog importa. Migraciju prvo ograniči kompatibilnošću, ownershipom i prihvatom.

Starter ima vlastiti router, feature indexe i pravila. Vireo marker/projection može inspirirati dizajn, ali samo dodavanje metapodataka ne instalira upgrade jamstva.

## Pogreške i odluke

| Opažanje                            | Odluka                                 |
| ----------------------------------- | -------------------------------------- |
| Druga package obitelj               | Reference recept, ne gotov import.     |
| Receipt ne odgovara manifestu/locku | Uskladi stvarno stanje.                |
| CLI postoji samo u peeru            | Ne izvršavaj kao podržan lokalni alat. |
| Sličan folder, drugi owner          | Slijedi aktualni source i callere.     |
| Noviji profil privlačan             | Predloži bounded migraciju.            |

## Prihvat

Zabilježi koordinate, API, app ownership, metadata i nedostajuće upgrade sposobnosti. Čuvaj peer provenance i customizacije. Članak ne instalira, generira ni objavljuje.

Pri predaji drugom agentu navedi i ograničenje profila: koji primjer je neposredno primjenjiv, kojem nedostaje paket ili adapter i gdje bi promjena postala migracija. Sam naziv templatea ne dokazuje sposobnost generatora. Git izvor, package verzija i lock integrity međusobno se nadopunjuju; nijedan sam ne opisuje sve lokalne prilagodbe.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package-lock.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/build.gradle`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:package.json`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:docs/platform/PUBLIC_MODULE_CONTRACT.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/ECOSYSTEM_CONTRACT.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/APPLICATION_PROJECTION.md`
