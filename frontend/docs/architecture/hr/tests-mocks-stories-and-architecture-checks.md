# Testovi, mockovi, stories i provjere arhitekture

## Smještaj fokusiranih i integracijskih testova

Fokusirani testovi zrcale vlasništvo izvornog koda:

```text
src/app/router/queryParams.ts
tests/app/router/queryParams.test.ts

docs/storybook/examples/Contacts/api/contact.mutation.ts
tests/storybook/contacts/api/contact.mutation.test.ts
```

Scenariji preko više vlasnika pripadaju u `tests/integration/<area>`, a tokovi
preglednika u `tests/browser`. Testovi uvoze produkcijski kod kroz `@/`, a
zajedničku testnu podršku kroz `@test/`. Produkcijski `src/` ne uvozi testove,
stories, mockove ili module samo za primjere.

## Testni i razvojni mockovi

`vitest.config.ts` odabire jsdom testno okruženje. `tests/setup.ts` instalira DOM
matchere i životni ciklus praznog MSW poslužitelja. Pojedini test dodaje samo
handlere svog scenarija, a oni se resetiraju nakon testa. Vrhunski `mocks/` je
drugačiji: podržava razvojnu aplikaciju i dinamički se učitava prije runtimea.

## Stories i browser pokrivenost

Stories dokumentiraju ponovno upotrebljive komponente i važna vizualna stanja.
Upute, CSF primjeri i pripreme žive pod `docs/storybook/<sekcija>/<Upute>/`, izvan
`src/`. Istoimene MDX i CSF datoteke dijele istoimenu mapu, a zajednički helperi
sekcije koriste `shared/`. Produkcija ne ovisi o njima; globalna Storybook
konfiguracija i adapteri ostaju u `.storybook/`. Browser testovi pokrivaju složene
rute, interakciju, prilagodljivost i automatiziranu pristupačnost. Ne zamjenjuju
ručni popis u `docs/manual-accessibility-checklist.md`.

Storybookovi primjeri i upute koriste engleski i ne trebaju prevedene inačice.
Upute za usmjeravanje daju funkcionalne stavke glavnog izbornika za rute primjera;
držite te stavke usklađenima s dokumentiranim postavljanjem izbornika.
Primjeri usmjeravanja s uobičajenim tokom sadržaja koriste zajednički
`StorybookBrowserFrame` kako bi adresna traka i ljuska stali u jedan prikaz.
Kratki primjeri nemaju dodatne klizače iframea i Canvasa, dok dulji sadržaj
zadržava uobičajeno pomicanje prozora. Za fiksne radne površine zasebno provjerite
dimenzioniranje.
Globalni provideri u `.storybook/preview.ts` osiguravaju englesku lokalizaciju i
aplikacijsku temu. Koristite globalni izbornik Theme s opcijama System, Light,
Dark i Soft dark umjesto zasebnog providera ili fiksne teme u pojedinom primjeru.
Isti globalni adapter unutar providera teme daje stvarni lokalizirani feedback
provider. Ključ mu je ID primjera: promjene teme ili argumenata čuvaju feedback,
dok odabir drugog primjera završava njegovu sesiju obavijesti i potvrda. Svaki Docs
iframe ima vlastiti provider. Primjeri i dalje otkazuju svoj rad u tijeku;
završetak prikaza feedbacka ne poništava poslovne naredbe.
Adapteri za upravljačko sučelje, Docs i primjere koriste tokene iz
`src/app/theme/themeSetup.ts`. Most za Storybookove iframeove sinkronizira ugrađene
primjere čak i kada pohrana nije dostupna; provjerava poruke roditelja i djece
istog izvora te čuva postavku odvojeno od aplikacijskih ključeva pohrane.

Uz pokrenut Storybook, `npm run test:browser:storybook` provjerava taj raspored te
validaciju, čekanje spremanja, ponovni pokušaj i očuvanje nacrta pri promjeni teme
u uputama za ContactForm, interakcije i izolaciju obavijesti/potvrda te odabir
arhitekturnih primjera, očuvanje odabira pri promjeni teme i uske Docs stranice, u
instaliranom Chromeu s jednim radnikom.
`RGO_STORYBOOK_URL` odabire drugi već pokrenuti poslužitelj; provjera ne pokreće
izgradnju ni poslužitelj. Zasebna Playwright konfiguracija odvaja te primjere od
aplikacijskih browser scenarija.

Provjere podataka, kolekcija i lokalizacije pokrivaju i izolirane query/mutation
tokove, odbijeno spremanje i ponovni pokušaj, otkazivanje zastarjelog čitanja,
klijentsku i kontroliranu poslužiteljsku obradu tablice i odabir, formatiranje,
englesku interpolaciju i množine, očuvanje nacrta, promjene teme, uske Docs
stranice i reprezentativnu automatiziranu pristupačnost. Primjeri ne dokazuju
ponašanje udaljenog API-ja te ne mijenjaju aplikacijsku pohranu ni jezik dokumenta.

Upute za URL, stanje, postavke, autentikaciju i testiranje dodaju browser scenarije
za atomske promjene upita i povijest, oporavak neispravnog URL-a, hidraciju Signala
i gašenje efekata, nedostupnu pohranu, stvarne potrošače postavki i zaštitu fiksnih
vrijednosti, redoslijed sesije/CSRF-a, različite pogreške prijave, čišćenje privatnog
cachea pri isteku te opažanja granica sheme i mutacija. Provjere obuhvaćaju i
očuvanje stanja pri promjeni globalne teme, uske Docs stranice, pomicanje, izolaciju
aplikacijske pohrane i reprezentativnu automatiziranu pristupačnost. Privatni auth
transport ne šalje HTTP zahtjeve i ne dokazuje ponašanje kolačića, autorizacije ni
baze na backendu. Primjer testiranja prikazuje stvarna opažanja granica, a ne
izvršavanje Vitesta.

Napredne referentne upute pokrivaju ulazak i radnje prema ovlastima, injektirani
feature HTTP i ugovore odgovora/pogrešaka, validaciju nacrta/slanja i zaštitu
izlaska, verzionirane naredbe i usklađeno osvježavanje te inbox zapise pojedinog
primatelja. Browser scenariji provjeravaju odbijene naredbe, promjene ovlasti,
redoslijed CSRF-a, očuvanje nacrta, odbijene/neizvjesne ishode naredbi, oporavak
ciljanog osvježavanja i ponovno stvaranje klijenta. Privatni transporti i zadržani
memorijski poslužitelji pripadaju primjerima: ne ugrađuju produkcijske uloge ili
endpointe i ne dokazuju trajnost stvarne baze, backend autorizaciju ni rollback.
Provjere obrasca pokrivaju SPA/logout zaštitu i otkazivanje poslanog događaja
`beforeunload`; izvorno upozorenje preglednika pri izlasku ostaje ručna provjera.

Arhitekturna provjera odbija vlasnike vodiča i story artefakte pod `src/`,
uključujući prazne mape `stories/` i datoteke `*.stories.ts(x)`. Svaki produkcijski
import ili reexport u bilo koju putanju `docs/` ili `.storybook/` odbija se,
uključujući nepostojeće ciljeve, raw upite, doslovne dinamičke importe i
`import.meta.glob` obrasce koji mogu odabrati dokumentaciju. Nema iznimke za raw
Architecture ili Handbook importe. Dokumentacijski TypeScript provjerava
`tsconfig.storybook.json`. Referentni jedinični testovi žive u `tests/storybook/`;
aplikacijske browser provjere dokazuju Not Found za ukinute URL-ove vodiča u oba
jezika i navigaciju samo prema ugrađenim odredištima.

## Automatizirane provjere i prosudba pregleda

Za cijelu mapu ugrađenih frontend/backend zaštita, provjera, vlasnika dokaza,
naredbi i granica automatizacije koristite
[Arhitekturne invarijante i provjere](../../development-guide/hr/quality/test-design/architecture-invariants-and-checks.md).

`npm run verify:architecture` mehanički provjerava dopuštene korijene, smještaj
testova, uvoze preko vlasnika, javna sučelja, privatne kontekste, runtime hook
wrappere, prijavljene ovisnosti značajki, Signal nazive i registracije, nazive
providera/hookova, pristup pohrani, granicu ljuske/usmjerivača i cikluse.

Ne može odlučiti je li vlasnik dobro imenovan, sučelje minimalno, tvornica
potrebna, test smislen, dokumentacija točna ili iznimka mudra. To ostaje posao
pregleda. Nakon pomicanja pokrenite provjeru arhitekture, fokusirane testove i
cjelovitu repozitorijsku provjeru prije isporuke.
