# Dijelite mehaniku obrasca uz izričit način rada s entitetom

Stvaranje i ažuriranje različite su operacije. Ažuriranje treba postojeći entitet, stvaranje vlastite zadane vrijednosti. Razliku izrazite sučeljem pa dijelite vrijeme validacije, lokalizirane sheme i potvrđeno slanje bez premještanja ruta i podataka u univerzalnu tvornicu obrazaca.

Ovo je **ugrađeni starter obrazac**. `AppEntityFormMode` je diskriminirana unija prema grupi obrasca trenutačne biblioteke. Stvaranje zabranjuje početni entitet, ažuriranje ga zahtijeva. `buildAppEntityFormOptions` daje validaciju pri prvom slanju i zatim promjenama te čeka slanje vlasnika prije `onSaved`.

## Okidač i vlasništvo

Zajedničku granicu koristite za obične entitetske obrasce s jednakim vremenom validacije i izvještavanjem životnog ciklusa. Feature definira vrijednosti, shemu, polja, početne vrijednosti i mapiranje ažuriranja. Roditelj upravlja API pozivom, uspjehom i pogreškom, zatvaranjem, navigacijom i protokolom revizije. Helper ne odlučuje koji endpoint pozvati.

Starter daje tip tvornice sheme s prijevodom i izričitim kontekstom. Iz njega gradite lokaliziranu validaciju umjesto engleskih stringova u generičkom utilityju. Povijesni LMS `useLmsForm` također injektira prijevod, ali njegov React Hook Form omotač nije aktualni starter API.

## Identitet operacije učinite vidljivim

Ovo je **neutralna ilustracija**, a ne točan ugrađeni tip:

```ts
type DocumentFormMode =
  { mode: "create"; initialValue?: never } | { mode: "update"; initialValue: { id: string; title: string } };

// Feature: način rada mapira u početne vrijednosti i kontekst sheme.
// Vlasnik: čeka stvarni rezultat prije uspjeha i zatvaranja.
```

Nemojte `initialValue?: Entity` prešutno koristiti za obje operacije; neuspjeli dohvat ažuriranja mogao bi postati obrazac stvaranja. Učitavanje, odsutnost i zabranu razriješite prije valjanog update vlasnika. Pri promjeni zapisa izričito resetirajte ili otvorite novu sesiju umjesto pretpostavke da defaults zamjenjuju unos.

| Pitanje            | Zajednička politika         | Odgovornost featurea ili roditelja         |
| ------------------ | --------------------------- | ------------------------------------------ |
| Vrijeme validacije | Prvo slanje, zatim promjene | Ispravna međupoljna pravila i poruke       |
| Parsiranje         | Validacija prije callbacka  | Domenski ulaz i očekivana revizija         |
| Slanje             | Čekanje predanog promisea   | Razrješenje prema stvarnom ugovoru potvrde |
| Uspjeh             | Callback nakon razrješenja  | Namjerno zatvaranje, reset ili navigacija  |
| Pogreška           | Odbijanje ne postaje uspjeh | Prikaz problema i čuvanje sigurnog unosa   |

## Pogreške i oporavak

Zajednički helper ima jednu namjeru validacije. Za nepotpuni nacrt i strogo završno slanje slijedite [referentne upute Draft and submit forms](../../../../storybook/forms/DraftAndSubmitForms/DraftAndSubmitForms.mdx). Primjer povezuje ugrađenu mehaniku obrasca s izričitom namjerom naredbe, uvjetnim poljima, prihvaćenom osnovicom i zaštitom izlaska; ne slabi zajednički helper niti uvodi drugi form framework.

Pregledani helper prijavljuje submitting prije parsiranja i čekanja. Sam ne daje opći `finally` reset, oporavak sukoba ni pretplatu stvarnog stanja obrasca. Povežite stvarni životni ciklus kako odbijeni parse ili zahtjev ne bi ostavio roditelja trajno zauzetim. Jedan helper nije potpun stroj čekanja.

Razriješeni callback istinit je koliko i njegova implementacija. Ako pokrene zahtjev bez vraćanja ili čekanja, `onSaved` dolazi prerano. Ako HTTP prihvaćanje asinkrone naredbe smatra konačnim dovršetkom, treba drugi tok ishoda. Pogrešku promatrača nakon poznatog commita također treba razdvojiti od stvarnog zapisivanja.

## Scenariji prihvaćanja

Create pozivatelj ne može slučajno dati entitet, a update ga ne može izostaviti pod ugrađenim tipom. Nevaljane vrijednosti ne stižu API-ju. Prvo slanje pokazuje lokalizirane pogreške; kasnije izmjene revalidiraju. Odbijen API promise ostavlja obrazac i unos. Potvrđen uspjeh pokreće namjerni završetak. Promjena identiteta ne prepisuje tiho izmijenjenu sesiju.

Lokalizirajte polja, validaciju, create/update naslove i završne radnje. Pogreška treba pripadati pravom polju i omogućiti pristupačan fokus; dijeljenje vremena validacije ne uklanja tu odgovornost.

## Izbjegnite ove prečace

Nemojte graditi jednog divovskog vlasnika ruta, podataka, ovlasti i polja, izvoditi operaciju iz neobveznog objekta, kopirati povijesne hookove ni zatvarati prije potvrde. Mala zajednička politika ostavlja smisao operacije izričitim.

## Izvori i podrijetlo

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/forms/types/AppEntityForm.ts` — unija operacije, lifecycle propovi i kontekst lokalizirane sheme.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/forms/utils/buildAppEntityFormOptions.ts` — vrijeme validacije, parse, čekano slanje i callback uspjeha.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/shared/hooks/useLmsForm.ts` — povijesna injekcija prijevoda, ne API za prijenos.
