# Granice ovisnosti i uvozi

Ovisnosti slijede vlasništvo. Koristite `@/` pri prelasku između vlasnika
sposobnosti, a relativne uvoze unutar jednog vlasnika. Alias jasno pokazuje
prijelaz granice i omogućuje provjeri arhitekture dosljedno razrješavanje.

## Prijelazi između vlasnika

```text
main.tsx ──▶ pokretanje i kompozicija aplikacije
pages    ──▶ javna sučelja značajki i aplikacije
app/bootstrap/runtime ──▶ javne tvornice značajki
unutrašnjost značajke ──▶ vlastiti modeli, API portovi, UI i hookovi
```

## Javna sučelja značajki

Svaka korijenska značajka izlaže namjerno odabrane imenovane članove iz
`index.ts`. Stranice, runtime kompozicija, druge značajke i registri životnog
ciklusa ne smiju uvoziti unutarnje putanje značajke. Izbjegavajte široke
`export *` bačve. Objekti konteksta i mape `internal/` ostaju privatni.

## Ovisnosti između značajki

Međuzavisnost značajki u pravilu riješite kompozicijom javnog UI-ja ili
ubrizganom ovisnošću na granici tvornice. Izravna ovisnost o hooku druge
značajke iznimka je: uvezite imenovani javni član i prijavite vezu u
`src/app/bootstrap/runtime/appFeatures.ts`. Veze moraju biti poznate,
jedinstvene, bez samoodnosa i bez ciklusa.

## Ponovno upotrebljive aplikacijske kontrole unosa

Značajke smiju uvoziti namjerno izložene dijelove aplikacijskih obrazaca iz
`@/app/forms/{components,types,hooks,utils}`. Validacija značajke, spremljene
vrijednosti i prikaz pojedine stranice ostaju u značajci ili vlasniku postavke.
Primjer kontroliranog odabira jedne opcije:

```tsx
import { useState } from "react";

import { AppSingleChoiceToggleGroup } from "@/app/forms/components/AppSingleChoiceToggleGroup";

export function EnabledChoice() {
  const [enabled, setEnabled] = useState(false);

  return (
    <AppSingleChoiceToggleGroup
      aria-label="Omogućeno"
      onChange={setEnabled}
      options={[
        { value: false, label: "Ne" },
        { value: true, label: "Da" },
      ]}
      value={enabled}
    />
  );
}
```

U aplikacijskom kodu dajte lokalizirane oznake. Vrijednosti opcija moraju biti
jedinstveni nizovi znakova, brojevi ili booleove vrijednosti; opcije mogu imati
i ikonu, onemogućeno stanje, zasebnu pristupačnu oznaku i `sx` gumba. Grupa prima
MUI svojstva prikaza, izvorne atribute i događaje te referencu korijenskog
elementa. `onChange` prima novu vrijednost pa izvorni događaj. Za neodgovoreno
polje postavite `value` na `null`; uključite `allowDeselect` kako bi korisnik
mogao ukloniti odabir, a povratni poziv primiti `null`. Vlasnik ažurira odabir
pri promjeni opcija; komponenta ga ne usklađuje automatski.

## Smjer aplikacije i pregled

Generička podatkovna infrastruktura ne poznaje auth krajnje točke.
Autentikacija ne ovisi o mockovima, Signalima ni spremljenim postavkama. Ljuska
prima navigaciju i ponašanje računa od usmjerivača; sama ne učitava registar
ruta ili stranice. Stabilna aplikacijska infrastruktura ne ulazi u unutrašnjost
značajki; iznimka je eksplicitna kompozicija u `app/bootstrap/runtime`.

Provjera otkriva mnoga kršenja uvoza, uključujući razriješene relativne
putanje. Pregled je i dalje potreban za odluke o pravom vlasniku, namjerno javnom
izvozu i opravdanosti iznimke.

Vidi i [Anatomija značajke, nazivi datoteka i javna sučelja](./feature-anatomy-filenames-and-public-interfaces.md).
