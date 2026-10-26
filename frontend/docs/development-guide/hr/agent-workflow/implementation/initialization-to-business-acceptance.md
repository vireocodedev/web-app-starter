# Odvoji setup spremnost od prihvaćenog poslovnog V1

Vodi setup, dogovorene zahtjeve, implementaciju i release bez zamjene dokaza jedne
faze drugom. Deployani skeleton dokazuje setup; poslovni proizvod zahtijeva
implementirane i provjerene korisničke tokove.

**Dokumentirani starter workflow.** `docs/v1-workflow.md` koordinira faze.
Setup vode initialization intake (`.agents/skills/initialization-intake/SKILL.md`) i
initialization execution (`.agents/skills/initialization-execution/SKILL.md`).
Specification creator (`.agents/skills/specification-creator/SKILL.md`) vodi naknadno funkcionalno otkrivanje.
Detaljni postupci ostaju uz te pakete i CI/release vlasnike. Članak ne daje ovlast
za izvršavanje.

## Okidač, vlasnik i ugovor

Koristi pri planiranju consumera, nastavku setupa ili procjeni V1 dovršetka.
Developer/operator vodi setup unutar potvrđenog opsega. Product/client vlasnici
dogovaraju zahtjeve i prihvaćaju isporučeno poslovno ponašanje. Implementatori vode
ograničene zadatke, a release operatori promociju i oporavak.

Dovršen intake, prihvaćen setup, poslovni dogovor i poslovni prihvat neovisna su
stanja. Dovršetak jednog ne podrazumijeva ostala.

```text
checkout -> sva intake pitanja -> potvrđeni, spremljeni odgovori
         -> uvjetovana puna inicijalizacija -> provjeren setup
         -> adaptivni specifikacijski intervju -> odobrena revizija specifikacije
         -> lokalni paket issuea -> izričito zatražen GitHub import
         -> zasebno planiranje arhitekture/spremnosti -> ograničena implementacija
         -> staging poslovni prihvat -> isti image pair u produkciji + handoff
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

Za lokalnu probu u templateu koristi `$initialization-intake dry run` i
`$initialization-intake resume dry run`. Isti upitnik i validacija koriste
zamišljene ciljeve i izričito simulirane preduvjete servisa, bez otvaranja računa
providera ili zaštićenih operator datoteka. Napredak se sprema odvojeno u
`.agents/skills/initialization-intake/state/dry-runs/<session>/intake.json`;
imenovane sesije čuvaju različite scenarije. Rezultat `rehearsalComplete` uvijek
ostavlja `complete: false` i ne može otključati stvarno izvršavanje. Referenca
`.agents/skills/initialization-intake/references/dry-run.md` vlasnik je ugovora za
probu. U aktualnoj fazi samo intake podržava ovaj dry-run način rada.

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

Inicijalizacija ne zahtijeva vanjski discovery servis, UUID projekta, export ni
poslovno odobrenje. Pri adopciji sačuvaj dovršene stare dokaze; nedovršeno
izvršavanje zahtijeva intake prije daljnjih mutacija.

## Specifikacija zahtijeva punu inicijalizaciju

Pokreni `$specification-creator create a specification for this repository` tek
nakon dovršenog punog initialization executiona. Skill prvo koristi executionovu
lokalnu provjeru dovršenosti za ovaj consumer. Nedostajući, djelomičan, nedosljedan
ili local-only rezultat zaustavlja skill uz uputu za `$initialization-execution`.
Provjera validira spremljeni setup dokaz; nije provjera trenutačnog zdravlja
udaljenih servisa i ne može koristiti template acceptance receipt.

Specification creator (`.agents/skills/specification-creator/SKILL.md`) intervjuira product/client vlasnika u
adaptivnim rundama. Čita dostavljene specifikacije i bilješke kao izvore, razdvaja
potvrđene zahtjeve od tumačenja i prijedloga, propituje vrijednost featurea i
izlaže proturječja. Postavi trenutačno odgovoriva pitanja uz brojeve i obrazložene
preporuke; odgovori određuju sljedeću rundu, bez nagađanja ovisnih odgovora.

Obuhvati problem, korisnike i ishode; V1, budući opseg i izuzeća; tokove, featuree,
stranice i relevantna UI stanja; podatke, odnose i lifecycle; ovlasti, pravila te
slučajeve pogrešaka i prihvata. Istraži primjenjive integracije, obavijesti,
izvještaje, import/export, pristupačnost, lokalizaciju, performanse, privatnost i
retenciju. Uključi vizualni/responsive smjer, reference, rokove, budžetska
ograničenja, ovisnosti, odgovornosti i vlasnika prihvata. Neprimjenjive teme
izričito označi umjesto prešutnog preskakanja.

Nakon svake serije odgovora spremi odgovore, prijedloge, otvorena pitanja,
reference izvora i napredak u Git-ignored `.agents/skills/specification-creator/state/`.
Nova agentska sesija nastavlja otvorene grane bez prethodne konverzacije.
Dokumenti za pregled žive u `docs/specification/`, s ulazom `SPECIFICATION.md`;
povezani dokumenti prema potrebi pokrivaju featuree, stranice, podatke, odluke i
prihvat. Root `CONTEXT.md` ostaje vlasnik poslovnog rječnika; arhitekturne odluke
zadržavaju postojećeg vlasnika.

Nacrt smije imati nepoznanice. Dovršetak traži obrađene sve primjenjive teme,
riješene produktne nepoznanice koje blokiraju uključenu funkcionalnost, provjere
dosljednosti i korisnikovo izričito odobrenje točne revizije specifikacije.
Naknadna promjena čuva prethodnu odobrenu baseline, identificira pogođene zahtjeve
i ponovno otvara njihove grane za odobrenje uz očuvanje nepogođenih odgovora.
Validacija ne daje produktno odobrenje.

Skill završava funkcionalnom specifikacijom. Planiranje arhitekture, kreiranje i
objava issuea, mockupovi, prototipovi i kodiranje zasebni su zadaci. Stvarni
issue/PR napredak prati se neovisno o inicijalizaciji i stanju specifikacije.

## Generiraj lokalno, zatim izričito importaj

Nakon odobrenja točne revizije specifikacije koristi specification-to-issues
(`.agents/skills/specification-to-issues/SKILL.md`) za pripremu lokalnog paketa issuea.
Skill validira odobrenje i čuva kopirani odobreni izvor/dokaz odobrenja, content
hasheve, verzionirani manifest i Markdown tijela issuea. Zadaci zadržavaju reference
izvora, kriterije prihvata, labele, ovisnosti i parent grupiranje. Nedostajuća
poslovna pravila vraćaju se na reviziju specifikacije. Generiranje ne mijenja
aplikacijski source, ne izmišlja arhitekturu i ne objavljuje ništa na GitHubu.

Github-issues-import (`.agents/skills/github-issues-import/SKILL.md`) koristi se
zasebno. Offline validacija/dry-run ne pristupa provideru niti piše u njega.
Stvarni import traži izričit zahtjev s točnim ciljnim repozitorijem. Uskladi stabilne
markere/povezivanja za nastavak bez duplikata, čuvaj ljudske izmjene i zatvorene
issuee te stani kod konflikta. Objavi blokere prvo; dodaj native blocking i
sub-issue odnose gdje su dostupni, inače koristi izričite povezane reference prema
`docs/agents/issue-tracker.md`. Parent grupiranje samo ne određuje izvršni redoslijed.

Novim zadacima zadano dodijeli `needs-triage` prema `docs/agents/triage-labels.md`.
Odobrena funkcionalnost, valjan paket i uspješna objava različita su stanja od
pregleda arhitekture i spremnosti za agentsku implementaciju. Handoff navodi
identitet paketa, odobrenje izvora, stvarne linkove importanih issuea i granice;
nijedna faza automatski ne pokreće coding.

## Ponašanje prije promocije

| Rezultat                  | Granica                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| Intake dovršen            | Potvrđeni ulazi, ne uspješan setup.                                     |
| Lokalni startup           | Lokalni setup, ne poslovni prihvat.                                     |
| Puna inicijalizacija      | Setup preduvjet specifikacije, ne odobreni produktni opseg.             |
| Specifikacija odobrena    | Točan funkcionalni dogovor, ne arhitektura ili implementirani featurei. |
| Lokalni paket valjan      | Task handoff za pregled, ne remote objava ili coding spremnost.         |
| GitHub issuei importani   | Tracker zapisi/odnosi, ne implementirano poslovno ponašanje.            |
| Pregledana implementacija | Ograničen rezultat sa stvarnim provjerama; V1 može ostati otvoren.      |
| Zdrav staging             | Runtime readiness; zasebno provjeri journeys/roles/failures.            |
| Isti par u produkciji     | Identitet i dalje traži smoke, operating i recovery dokaze.             |

Zabilježi poslovni prihvat i blokere za točan staging kandidat. Produkcija promiče
isti prihvaćeni frontend/backend par bez rebuilda. Migracije, backup, računi i
oporavak slijede postojeće vlasnike. Sačuvaj source identitet i stvarne run/pair potvrde.

## Pogreške i odluke

| Opažanje                                      | Odluka                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| Intake nedostaje ili više ne vrijedi          | Zaustavi execution i nastavi intake.                  |
| Druga sesija već je odgovorila na pitanja     | Učitaj stanje i nastavi samo preostala pitanja.       |
| Setup nepotpun ili local-only                 | Zaustavi specifikaciju i dovrši punu inicijalizaciju. |
| Odobreni zahtjevi se mijenjaju                | Sačuvaj baseline i otvori pogođene grane intervjua.   |
| Setup gotov, poslovni featurei nedostaju      | Nastavi implementaciju; poslovni V1 nije dovršen.     |
| Poslovna policy odluka otvorena               | Blokiraj pogođeni rad uz vlasnika odluke.             |
| Infrastruktura zelena, journey pada           | Poslovni prihvat ostaje otvoren.                      |
| Produkcijski par razlikuje se od staging para | Uskladi identitet prije tvrdnje o promociji.          |

## Prihvat i handoff

Finalni V1 dokaz uključuje prihvaćene zahtjeve, točan candidate/pair identitet,
stvarni poslovni smoke, aktualne operating/access upute, oporavak i ograničenja.
Consumer setup pripada njegovu entry pointu. Povijesne template potvrde ne dokazuju
consumer prihvat. Prije tvrdnje da novi setup radi bez naknadnih intervencija
potrebna je čista proba na novom consumeru.

Pinane reference niže opisuju povijesne ugovore faza/dokaza. Aktualno ponašanje
intakea, executiona, specifikacije i issue handoffa pripada gore navedenim trenutačnim skillovima,
ne uklonjenom specifikacijskom paketu vezanom uz aplikaciju.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/project-status.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
