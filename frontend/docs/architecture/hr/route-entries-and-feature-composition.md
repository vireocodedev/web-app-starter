# Ulazi ruta i kompozicija značajki

`src/pages` sadrži ulaze ruta. Stranica odgovara na jedno pitanje: koja javna
sučelja aplikacije i značajki tvore ovaj zaslon?

## Granica stranice

```tsx
import { ContactsFeature } from "@/features/development-guide/contacts";

export function ContactsPage() {
  return <ContactsFeature />;
}
```

Stranice značajki koriste `src/pages/<feature>/`. Male aplikacijske granice kao
Home, Login i Not Found mogu ostati jedna datoteka. Patterns stranice grupirane
su po kategoriji; Architecture stranice prilagođavaju ID članka i lokalitet
javnom rendereru. Stranice ne uvoze unutrašnjost značajke, ne stvaraju runtime,
ne ponavljaju upite i ne posjeduju poslovno ponašanje.

## Pravila ruta pripadaju registru

Registar ruta spaja stranice s pravilima: URL-om, pristupom, razvojnom
dostupnošću, naslovom, mrvicama, navigacijom, rasporedom i pomicanjem. Time
pravila ruta ostaju izvan značajke i ljuske. Ljuska prikazuje dobivenu
navigaciju i podudaran `Outlet`.

Stranica koja sadrži ugniježđene rute adapter je rasporeda: prikažite `Outlet`
na mjestu djeteta te registrirajte raspored i svakog potomka u
`routeRegistry.tsx`. Na potomcima zadržite potpune aplikacijske putanje, a
hijerarhiju izrazite s `parentId`. Ne ponavljajte popis dječjih ruta u stranici.

## Stanje rute i kompozicija značajki

Kada se odabir treba dijeliti ili vratiti navigacijom, koristite stanje rute ili
URL-a. `useAppQueryParams` daje tipizirane reverzibilne kodeke skalarnih
parametara. Svakom polju dajte sigurnu zadanu vrijednost i povezana polja
mijenjajte jednim `setValues()` pozivom.

Više značajki spajajte javnim UI-jem i callbackovima na granici stranice.
Stabilnu runtime ovisnost ubrizgajte u `appFeatures.ts`; izravni hook druge
značajke iznimka je koja se tamo mora prijaviti.

## Testovi usmjereni na rute

Testovima ruta dokažite pristup, ugniježđena preusmjerenja, naslove, mrvice,
omogućena odredišta i Not Found. Testovi značajke ostaju uz stablo vlasništva
značajke.
