# Od ulazne točke do prikazane aplikacije

`src/main.tsx` korijen je kompozicije. Redoslijed je namjeran jer kasniji koraci
ovise o ranijima:

## Redoslijed pokretanja

```text
provjera okoline
  → pokretanje razvojnih mockova u mock načinu
  → hidratacija Signala i pokretanje aplikacijskih efekata
  → izgradnja nepromjenjivog runtimea
  → stvaranje usmjerivača preglednika
  → prikaz Appa
```

## Konfiguracija i razvojni mockovi

`loadAppConfig()` provjerava `import.meta.env` i produkcijska pravila prije
stvaranja usluga. U razvojnom mock načinu `main.tsx` dinamički uvozi
`mocks/browser.ts` i čeka MSW. Tako početni zahtjevi ne prestižu worker, a mock
kod ne ulazi u produkcijsko pokretanje.

## Signali, runtime, usmjerivač i prikaz

`initSignalEffects()` najprije hidrira sve registrirane Signal module, zatim
pokreće aplikacijske efekte. Njegovo čišćenje registrirano je za Vite HMR.
Runtime zatim stvara Query klijent, Axios instancu, auth runtime i konstruirane
runtimeove značajki. Usmjerivač se stvara jednom, izvan Reacta.

`App` prima gotov usmjerivač i runtime, postavlja granicu greške prikaza i
uređeno stablo providera te prikazuje `RouterProvider`. Komponente ne smiju
ponavljati pokretanje ili pri prikazu ponovno stvarati aplikacijske usluge.

## Obrada pogrešaka

Cijelo pokretanje je zaštićeno. Greška se prijavljuje kroz
`reportStartupFailure()`, Signal efekti se gase, a `renderFatalStartupError()`
prikazuje minimalni zaslon pogreške. Pogreške tijekom React prikaza zasebno
hvata `AppRenderErrorBoundary`.
