# Odvojite overlay rezultat, zaštićen izlaz i identitet uređivača

Overlay rezultat opisuje završetak UI sesije, ne dokazuje sam server uspjeh. Potvrda odlaska može završiti nakon promjene, a stari editor prijaviti uspjeh novome u istom panelu. Odvojite transportni ishod, mountani overlay i unutarnju sesiju.

Ovo je **ugrađena kompozicija s RGO ugovorom**. Contacts koristi page-local provider i `useAppMultiViewOverlay`; RGO upravlja prikazom i rezultatom. Feature daje pravilo odlaska i prihvaća samo aktualne callbackove.

## Okidač i vlasnik

Koristite kada filteri, detalj i editor dijele panel ili async naredbu. Provider posjeduje page store, handle mountani prikaz i rezultat, app controller unutarnju sesiju, a feature dirty/busy i API potvrdu.

RGO rezultat je completed s vrijednošću ili cancelled s razlogom. Običan dismiss razrješava cancellation, ne rejection. Implementacijska ili config pogreška druga je stvar; razriješen promise nije automatski uspjeh niti znači da ništa ne može baciti.

## Rezultat čitajte izričito

**Minimalni obrazac ugrađene unije**:

```ts
const outcome = await handle.result;
if (outcome.status === "completed") {
  // Koristite deklarirani ugovor rezultata sadržaja.
} else {
  // Dismiss ili page promjena nije uspješno spremanje.
}
```

Sadržaj treba complete tek nakon potvrde naredbe. `complete(value)` zaobilazi vlastiti busy/guard nakon rada, ali djeca još odobravaju zatvaranje roditelja. Vraća `Promise<boolean>`; pozivatelj ga mora čekati da opaža ishod zaštićenog zatvaranja, uključujući provjere djece i izlazne prijelaze. Ako dijete odbije, promise se razriješi na false iako je write možda potvrđen dok UI ostaje; nemojte tražiti dupli save radi UI završetka.

Contacts čeka `mutateAsync`, a form callback prije completiona provjerava sesiju. Time štiti prihvaćanje i zatvaranje. Obavijest je zaseban put; controller ne jamči da je svaki kasni feedback session-gated.

## Odvojite mount i unutarnji identitet

Controller daje rastući session ID svakom prihvaćenom viewu i simbol mountu. Promjena viewa dijeli handle, mijenja sesiju. State i saved callback nose ID kako A ne bi resetirao B.

Leave je single-flight i abortable. Zabilježi aktualan entry, čeka feature pravilo pa traži odobrenje, živ mount, isti entry i bez aborta. Callback konfiguracija ažurira se na potvrđenoj layout granici. Feature nakon discard awaita ponovno provjerava submitting.

| Prijelaz              | Razlika                                  |
| --------------------- | ---------------------------------------- |
| Isti view             | Ponovno korištenje prema feature pravilu |
| Drugi view uz izmjene | Čekanje pravila aktualne sesije          |
| Zauzet editor         | Odbijanje obične zamjene                 |
| Stari saved           | Zanemariti neaktualan ID                 |
| Kraj page/providera   | Prisilni cancel i abort guard            |
| Potvrđen write        | Činjenica odvojena od UI dismissala      |

## Prikaz zabilježite pri otvaranju

Contacts bira dialog, docked desktop ili modal iz aktualnog breakpointa i postavke. RGO bilježi efektivni bottom-drawer i presentation. Kasnije promjene ne remountaju otvorenu sesiju. `updateProps` plitko mijenja caller podatke, ne prikaz i ne guard.

Nacrt tako preživljava resize. Promjena editor postavke ne obećava trenutno premještanje otvorenog. Nova sesija koristi novi izbor, stara svoj vijek.

## Prisilni vijek i oporavak

PageKey i stvarni unmount prisilno otkazuju, uključujući guard signal. Store mikrotask attachmentom podnosi effect replay. PageKey dolazi nakon routinga: cleanup nije unsaved-navigation autorizacija. Za sprečavanje odlaska treba zaseban route/task guard.

Kasni rezultat ne smije zatvoriti zamjenu ni prepisati njezin state. Neizvjestan write traži server potvrdu ili usklađivanje; brisanje overlaya nije rollback. Guard problem prijavite vlasniku pogreške, ne lažnim uspjehom.

## Scenariji prihvaćanja

Otkazano odbacivanje čuva view. Slanje započeto tijekom potvrde sprječava odlazak recheckom. Nakon promjene viewa stari callback ne dira novi. Resize ili preference promjena čuva mountani nacrt u starom prikazu. Kraj stranice aborta guard i daje cancel. Odbijanje djeteta nakon writea ne poništava potvrđenu persistenciju iako se promise UI completiona razriješi na false.

## Izbjegnite ove prečace

Nemojte settled smatrati uspjehom, koristiti samo naziv viewa, pageKey zvati guardom ni prop patchom mijenjati presentation. Rezultat pripada određenoj sesiji i vlasniku.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/overlays/hooks/useAppMultiViewOverlay.ts` — guard, mount i view sesija.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/development-guide/contacts/hooks/useContactsWorkspace.ts` — politika i početni prikaz.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/development-guide/contacts/components/ContactsSidePanel.tsx` — čekana mutacija i completion.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/types.ts` — rezultat, cancel, completion i prikaz.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/internal/store.ts` — prisilni cancel i lifecycle.
