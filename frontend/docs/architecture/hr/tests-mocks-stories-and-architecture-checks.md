# Testovi, mockovi, stories i provjere arhitekture

## Smještaj fokusiranih i integracijskih testova

Fokusirani testovi zrcale vlasništvo izvornog koda:

```text
src/app/router/queryParams.ts
tests/app/router/queryParams.test.ts

src/features/development-guide/contacts/api/contact.mutation.ts
tests/features/development-guide/contacts/api/contact.mutation.test.ts
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

Stories dokumentiraju ponovno upotrebljive komponente i važna vizualna stanja,
ali produkcija ne ovisi o njihovim pripremama. Browser testovi pokrivaju složene
rute, interakciju, prilagodljivost i automatiziranu pristupačnost. Ne zamjenjuju
ručni popis u `docs/manual-accessibility-checklist.md`.

## Automatizirane provjere i prosudba pregleda

Za cijelu mapu ugrađenih frontend/backend zaštita, provjera, vlasnika dokaza,
naredbi i granica automatizacije koristite
[Arhitekturne invarijante i provjere](/dev-guide/quality/test-design/architecture-invariants-and-checks).

`npm run verify:architecture` mehanički provjerava dopuštene korijene, smještaj
testova, uvoze preko vlasnika, javna sučelja, privatne kontekste, runtime hook
wrappere, prijavljene ovisnosti značajki, Signal nazive i registracije, nazive
providera/hookova, pristup pohrani, granicu ljuske/usmjerivača i cikluse.

Ne može odlučiti je li vlasnik dobro imenovan, sučelje minimalno, tvornica
potrebna, test smislen, dokumentacija točna ili iznimka mudra. To ostaje posao
pregleda. Nakon pomicanja pokrenite provjeru arhitekture, fokusirane testove i
cjelovitu repozitorijsku provjeru prije isporuke.
