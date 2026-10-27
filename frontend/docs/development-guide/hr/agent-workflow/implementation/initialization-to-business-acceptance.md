# Odvoji setup spremnost od prihvaćenog poslovnog V1

Vodi setup, dogovorene zahtjeve, implementaciju i release uz jasne dokaze svake
faze. Deployani skeleton dokazuje napredak setupa; prihvaćen poslovni proizvod
zahtijeva implementirane i provjerene korisničke tokove.

**Dokumentirani starter workflow.** Odjeljak **Project lifecycle** u korijenskom
`README.md` koordinira faze. Numerirani ručni postupak u
`docs/template-initialization/INIT_GUIDE.md` vodi setup,
uključujući preduvjete, naredbe za kopiranje i dokaze dovršetka. CI i release
operator vodiči vode svoju infrastrukturu. Članak ne daje ovlast za izvršavanje.
Numerirane skripte učitavaju privatnu env datoteku vrijednosti i provjere vezane uz njezin hash. To je neovisno o uklonjenom agentskom skill/intake workflowu.

## Okidač, vlasnik i ugovor

Koristi pri planiranju consumera, nastavku setupa ili procjeni V1 dovršetka.
Developer/operator vodi setup unutar odobrenog opsega. Product/client vlasnici
dogovaraju zahtjeve i prihvaćaju isporučeno poslovno ponašanje. Implementatori vode
ograničene zadatke, a release operatori promociju i oporavak.

Odabrani setup ulazi, provjerena inicijalizacija, poslovni dogovor i poslovni
prihvat neovisna su stanja. Dovršetak jednog ne podrazumijeva ostala.

```text
consumer checkout -> projektne vrijednosti + pristup -> numerirani ručni setup
                                                   -> provjerena inicijalizacija

dogovoreni poslovni zahtjevi -> implementacija -> staging prihvat
                           -> isti image pair u produkciji + handoff
```

## Potvrdi consumer i slijedi setup vodič

Kreiraj privatni consumer kroz GitHubov template UI, kloniraj ga i otvori njegovu
mapu u VS Codeu prije početka vodiča za inicijalizaciju. Lokalni checkout predloška
nije potreban. Pregledaj stvarni Git origin, identitet i lokalne promjene. Sačuvaj postojeće
podatke, vjerodajnice i provjerene setup dokaze. Slijedi
`docs/template-initialization/INIT_GUIDE.md` redom, počevši od projektnih vrijednosti i
pristupa. Vjerodajnice čuvaj u zaštićenoj pohrani, a samo nesekretne setup odluke i
preostale blokere bilježi u dijelu vodiča za consumer-specific setup.

Pri nastavku usporedi dovršene dokaze sa stvarnim checkoutom i okruženjima, pa
nastavi preostale korake. Potpuna inicijalizacija traži consumer dokaze za lokalni
razvoj, CI/protection, staging, produkciju i inicijalizirani oporavak. Izričiti
local-only opseg dokazuje samo lokalni setup. Neriješen pristup, konfiguracija ili
ovlast blokira pogođeni korak.

Poslovni zahtjevi i njihovo odobrenje pripadaju kasnijoj fazi zahtjeva; nisu
preduvjeti ručnog postupka inicijalizacije.

## Kasniji zahtjevi ostaju odvojeni

Workflow za zahtjeve/specifikaciju treba definirati zasebno. Setup bilješke
opisuju tehničku konfiguraciju i ne predstavljaju poslovne zahtjeve.

Prije pogođene implementacije dogovori poslovne kriterije prihvata, izuzeća,
ovlasti, tokove i vlasnike otvorenih odluka. Potvrda setupa ne odobrava te poslovne
odluke. Issue/PR napredak prati odvojeno.

## Ponašanje prije promocije

| Rezultat                   | Granica                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| Setup vrijednosti odabrane | Ulazi i opseg još trebaju dokaze izvršavanja.                      |
| Lokalni startup            | Lokalni setup; deployani poslovni prihvat ostaje otvoren.          |
| CI/protection              | Delivery osnova; poslovni featurei mogu ostati otvoreni.           |
| Pregledana implementacija  | Ograničen rezultat sa stvarnim provjerama; V1 može ostati otvoren. |
| Zdrav staging              | Zasebno provjeri dogovorene tokove, uloge i pogreške.              |
| Isti par u produkciji      | Dovrši produkcijske smoke, operating i recovery dokaze.            |

Zabilježi poslovni prihvat i blokere za točan staging kandidat. Produkcija promiče
isti prihvaćeni frontend/backend par bez rebuilda. Migracije, backup, računi i
oporavak slijede postojeće vlasnike. Sačuvaj source identitet i stvarne run/pair
potvrde.

## Pogreške i odluke

| Opažanje                                      | Odluka                                                  |
| --------------------------------------------- | ------------------------------------------------------- |
| Nedostaje potreban setup ulaz ili pristup     | Riješi ga prije pogođenog ručnog koraka.                |
| Raniji setup rad već postoji                  | Sačuvaj ga, provjeri dokaze i nastavi preostale korake. |
| Setup gotov, poslovni featurei nedostaju      | Nastavi implementaciju; poslovni V1 nije dovršen.       |
| Poslovna policy odluka otvorena               | Blokiraj pogođeni rad uz vlasnika odluke.               |
| Infrastruktura zelena, journey pada           | Poslovni prihvat ostaje otvoren.                        |
| Produkcijski par razlikuje se od staging para | Uskladi identitet prije tvrdnje o promociji.            |

## Prihvat i handoff

Finalni V1 dokaz uključuje prihvaćene zahtjeve, točan candidate/pair identitet,
stvarni poslovni smoke, aktualne operating/access upute, oporavak i ograničenja.
Consumer setup pripada `docs/template-initialization/INIT_GUIDE.md`. Povijesne template
potvrde ne dokazuju consumer prihvat. Prije tvrdnje da potpuni setup radi bez
naknadnih intervencija potrebna je čista proba na novom consumeru.

Pinane reference niže opisuju povijesne ugovore faza/dokaza. Aktualni
pregled faza nalazi se u korijenskom `README.md`, a ručni setup postupak vodi
`docs/template-initialization/INIT_GUIDE.md`.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
