# API-ji, modeli, upiti i mutacije

Podatkovna granica značajke ima odvojene slojeve kako bi se transport,
validacija, cache i UI mogli neovisno mijenjati.

## Modeli, portovi i adapteri

`models/` posjeduje domenske vrijednosti i Zod sheme. Podatke parsirajte na
ulaznoj granici. API port u `<domain>.api.ts` opisuje domenske operacije i
zahtjeve poput `AbortSignal`; ne izlaže Axios ili Zod tipove.

Adapter poput `contact.api.browser-storage.ts` implementira port. Contacts referenca
namjerno izlaže asinkrone metode; živi Storybook prikaz koristi memorijske podatke. Budući
HTTP adapter može implementirati isto sučelje uz aplikacijsku Axios instancu
ubrizganu kroz tvornicu.

Contacts je dokumentacijska referenca pod `docs/storybook/examples/Contacts/`,
a ne ugrađena značajka. Živi prikaz ubrizgava memorijski adapter; adapter provjerene
pohrane u pregledniku neaktivan je, testiran primjer. Vlasnik kompozicije bira
adapter i predaje ga tvornici zajedno s Query klijentom.

## Opcije upita i mutacija

Query ključevi u `<domain>.querykeys.ts` stabilne su hijerarhijske vrijednosti.
Tvornice u `<domain>.query.ts` pozivaju API port i prosljeđuju signal prekida.
Tvornice mutacija u `<domain>.mutation.ts` pišu podatke i invalidiraju samo
pogođene ključeve. UI daje te opcije Query hookovima; ne stvara adaptere i ne
pristupa pohrani.

## Jedan vlasnik asinkronih podataka

```text
komponenta
  → query/mutation opcije runtimea značajke
    → API port
      → odabrani adapter
```

Vlasnik kompozicije bira adapter i predaje ga tvornici uz zajedničke ovisnosti
kao `QueryClient`. Query koristite za asinkrone podatke, uključujući asinkroni
ugovor Contactsa. Ne kopirajte Query podatke u Signale ili Context. Query
posjeduje učitavanje, pogreške, prekid, cache, osvježavanje i invalidaciju;
lokalni UI posjeduje privremeni prikaz i odabir.
