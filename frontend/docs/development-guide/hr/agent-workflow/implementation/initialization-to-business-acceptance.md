# Odvoji setup spremnost od prihvaćenog poslovnog V1

Vodi setup, dogovorene zahtjeve, implementaciju i release bez zamjene dokaza jedne
faze drugom. Deployani skeleton dokazuje setup; poslovni proizvod zahtijeva
implementirane i provjerene korisničke tokove.

**Dokumentirani starter workflow.** `docs/v1-workflow.md` koordinira faze.
Setup sada vode `.agents/skills/initialization-intake/SKILL.md` i
`.agents/skills/initialization-execution/SKILL.md`; detaljni postupci ostaju uz te
pakete i CI/release vlasnike. Članak ne daje ovlast za izvršavanje.

## Okidač, vlasnik i ugovor

Koristi pri planiranju consumera, nastavku setupa ili procjeni V1 dovršetka.
Developer/operator vodi setup unutar potvrđenog opsega. Product/client vlasnici
dogovaraju zahtjeve i prihvaćaju isporučeno poslovno ponašanje. Implementatori vode
ograničene zadatke, a release operatori promociju i oporavak.

Dovršen intake, prihvaćen setup, poslovni dogovor i poslovni prihvat neovisna su
stanja. Dovršetak jednog ne podrazumijeva ostala.

```text
checkout -> sva intake pitanja -> potvrđeni, spremljeni odgovori
                         -> provjera uvjeta -> provjeren setup

dogovoreni poslovni zahtjevi -> implementacija -> staging prihvat
                         -> isti image pair u produkciji + handoff
```

## Potvrdi consumer i dovrši intake

Pregledaj stvarni Git origin, identitet, lokalni rad i kompatibilne pakete. Sačuvaj
podatke, vjerodajnice, potvrde inicijalizacije i privatno stanje nastavka. Adopcija
zahtijeva oba cjelovita skilla, ne samo helper bez njegovih referenci.

Sam naziv skilla otvara kratak izbornik i čeka odgovor. Konkretan zahtjev poput
`$initialization-intake prepare initialization for this repository` izravno
pokreće intake. Agent prikazuje sva poznata pitanja unaprijed, predlaže otkrivene
činjenice za pregled i rješava ljudske preduvjete pristupa servisima prije izvršavanja.

Odgovori, nepoznanice i dokazi preduvjeta spremaju se u Git-ignored
`.agents/skills/initialization-intake/state/intake.json`. Sadrže nesekretne vrijednosti
i reference na zaštićenu pohranu. Druga agentska sesija nastavlja s
`$initialization-intake resume intake`, čuva odgovore i prikazuje što nedostaje.
Dovršetak povezuje korisnikovu potvrdu s točnim opsegom i aktualnim stanjem;
promjena odgovora poništava dovršetak.

## Izvršavanje zahtijeva dovršen intake

`$initialization-execution initialize this repository` prvo provjerava dovršenost
intakea, aktualne odgovore i identitet checkouta. Ako intake nedostaje, djelomičan
je, izmijenjen ili pripada drugom repozitoriju, izvršavanje izričito staje uz uputu
za `$initialization-intake`, prije provjera providera ili inicijalizacijskih radnji.
Execution ne dopunjava odgovore niti sam označava intake dovršenim.

Nakon prolaska provjere, potvrdi stvarnu spremnost i izvrši dogovoreni opseg prema
execution ugovoru/runbooku. Potpuni setup traži stvarne consumer dokaze za lokalni
razvoj, CI/protection, staging, produkciju i inicijalizirani oporavak. Izričiti
local-only opseg dokazuje samo lokalni setup. Neočekivani kvar providera ili
promjena opsega može zaustaviti rad; poznata pitanja pripadaju intakeu.

Inicijalizacija ne zahtijeva Client Discovery servis, UUID projekta, export ni
poslovno odobrenje. Pri adopciji sačuvaj dovršene stare dokaze; nedovršeno
izvršavanje zahtijeva intake prije daljnjih mutacija.

## Kasniji zahtjevi ostaju odvojeni

Zamjenski workflow za zahtjeve/specifikaciju nije dio ove promjene i tek ga treba
definirati. Nije ugrađena nova automatizacija specifikacije. Postojeći
`discovery-specification` ostaje stara integracija s aplikacijom, izvan novog
setupa; lokalni intake nije njegov poslovni izvor.

Prije pogođene implementacije poslovni opseg treba kriterije prihvata, izuzeća,
ovlasti, tokove i vlasnike otvorenih odluka. Potvrda setupa ne odobrava te odluke.
Stvarni issue/PR napredak prati se neovisno o stanju inicijalizacije.

## Ponašanje prije promocije

| Rezultat                  | Granica                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| Intake dovršen            | Potvrđeni ulazi, ne uspješan setup.                                |
| Lokalni startup           | Lokalni setup, ne poslovni prihvat.                                |
| CI/protection             | Delivery osnova, ne implementirani poslovni featurei.              |
| Pregledana implementacija | Ograničen rezultat sa stvarnim provjerama; V1 može ostati otvoren. |
| Zdrav staging             | Runtime readiness; zasebno provjeri journeys/roles/failures.       |
| Isti par u produkciji     | Identitet i dalje traži smoke, operating i recovery dokaze.        |

Zabilježi poslovni prihvat i blokere za točan staging kandidat. Produkcija promiče
isti prihvaćeni frontend/backend par bez rebuilda. Migracije, backup, računi i
oporavak slijede postojeće vlasnike. Sačuvaj source identitet i stvarne run/pair potvrde.

## Pogreške i odluke

| Opažanje                                      | Odluka                                            |
| --------------------------------------------- | ------------------------------------------------- |
| Intake nedostaje ili više ne vrijedi          | Zaustavi execution i nastavi intake.              |
| Druga sesija već je odgovorila na pitanja     | Učitaj stanje i nastavi samo preostala pitanja.   |
| Setup gotov, poslovni featurei nedostaju      | Nastavi implementaciju; poslovni V1 nije dovršen. |
| Poslovna policy odluka otvorena               | Blokiraj pogođeni rad uz vlasnika odluke.         |
| Infrastruktura zelena, journey pada           | Poslovni prihvat ostaje otvoren.                  |
| Produkcijski par razlikuje se od staging para | Uskladi identitet prije tvrdnje o promociji.      |

## Prihvat i handoff

Finalni V1 dokaz uključuje prihvaćene zahtjeve, točan candidate/pair identitet,
stvarni poslovni smoke, aktualne operating/access upute, oporavak i ograničenja.
Consumer setup pripada njegovu entry pointu. Povijesne template potvrde ne dokazuju
consumer prihvat. Prije tvrdnje da novi setup radi bez naknadnih intervencija
potrebna je čista proba na novom consumeru.

Pinane reference niže opisuju povijesne ugovore faza/dokaza. Aktualno ponašanje
intakea i executiona pripada gore navedenim trenutačnim skillovima.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/project-status.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
