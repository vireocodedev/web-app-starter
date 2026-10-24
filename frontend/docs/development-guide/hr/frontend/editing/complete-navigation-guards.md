# Dosljedno zaštitite promjenu rute, reload i izričitu odjavu

Nespremljeni obrazac može se izgubiti i bez promjene putanje. Parametri upita mogu odabrati drugi zapis, reload napušta aplikaciju, a izričita odjava može završiti uređivač bez routera. Te izlaze povežite s jednim životnim ciklusom obrasca umjesto nepovezanih potvrda u svakom gumbu.

Ovo je **referentno proširenje osnovnog primjera obrasca u starteru**. Ugrađeni `GuardedDraftPreview` pokazuje otkazivi React Router blocker za nespremljene promjene i promjenu putanje. CDA `useFormNavigationGuard` dodatno razmatra parametre upita, zauzetost, izlazak iz preglednika i zaštitu izričite odjave. Ti hookovi nisu ugrađeni starter API-ji; prilagodite njihove ugovore, a ne importe.

## Okidač i vlasništvo

Obrazac upravlja smislenim stanjem izmjena i slanja. Roditeljski uređivač određuje smije li se zadatak napustiti ili odbaciti. Autentificirana kompozicija aplikacije upravlja izričitom odjavom i registrom zaštita. Izlazak iz preglednika zaseban je mehanizam platforme s porukom pod nadzorom preglednika.

Razlikujte izmjene i zauzetost. Izmjene znače da unos odstupa od prihvaćene osnove. Zauzetost znači da operacija traje i možda je već stigla na poslužitelj. Odbacivanje unosa tijekom neizvjesnog zapisivanja nije isto što i odustajanje od lokalne izmjene. Zauzet zadatak možda treba odbiti navigaciju umjesto ponuditi običnu potvrdu odbacivanja.

CDA hook čuva aktualne vrijednosti izmjena i zauzetosti u refu ažuriranom na potvrđenoj layout granici. SPA blocker uspoređuje putanju **ili parametre upita** i blokira kada postoje izmjene ili zauzetost. Blokirani prijelaz tijekom zauzetosti resetira se. Inače se otvara otkaziva potvrda; nakon odgovora ponovno se provjerava aktualna zauzetost prije nastavka. Tako zakašnjela odluka o odbacivanju ne može napustiti zadatak nakon početka slanja.

## Povežite izlazne kanale

Ovo je **konceptualna politika u pseudokodu**, a ne potpis ugrađenog hooka:

```ts
async function mayLeaveTask(signal: AbortSignal) {
  if (task.isBusy()) return false;
  if (!task.isDirty()) return true;
  const discard = await confirmDiscard(signal);
  return discard && !signal.aborted && !task.isBusy();
}

// SPA router pita za relevantne prijelaze koji mijenjaju vlasnika.
// Izričita odjava pita kroz vlastiti aplikacijski registar zaštita.
// Izlazak iz preglednika koristi beforeunload, ne čeka prilagođeni dijalog.
```

Fragment iste stranice često mijenja samo mjesto čitanja. Parametar upita može mijenjati prikaz ili stvarni identitet zadatka. Generički CDA hook oprezno štiti svaku promjenu upita; njegov veći radni prostor može definirati užu iznimku prema identitetu zadatka. Pravilo featurea odaberite izričito. Nemojte zanemariti sve upite zato što putanja ostaje ista ni blokirati bezopasnu promjenu teme bez razmatranja zadržane sesije.

Preglednički `beforeunload` postavlja `preventDefault` i `returnValue` kada postoje izmjene ili zauzetost. Ne može čekati obični aplikacijski modal ni jamčiti prilagođeno lokalizirano upozorenje. Zbog ograničenja preglednika i naglog prekida rada to je posljednje upozorenje, a ne trajna pohrana nacrta.

Izričita odjava mora pitati aplikacijsku zaštitu prije uništenja autentikacijskog stanja. CDA adapter obrasca odbija zauzetost, dopušta čist obrazac i potvrđuje izmjene uz naknadnu provjeru zauzetosti i aborta. To pokriva namjernu odjavu kroz tu kompoziciju. Ne jamči da klijentska potvrda može odgoditi istek poslužiteljske sesije, drugu karticu ili prekid procesa operacijskog sustava.

## Odluke i oporavak

| Pokušaj                                    | Politika                                   | Oporavak                                                |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| Čist, nezauzet prijelaz                    | Nastavite                                  | Nije potreban                                           |
| Izmjene, nezauzet prijelaz drugom vlasniku | Pitajte jednom                             | Nastavak uređivanja ili izričito odbacivanje            |
| Prijelaz tijekom zauzetosti                | Odbijte ili resetirajte prijelaz           | Pričekajte poznat ishod ili izričito uskladite          |
| Slanje počne dok je potvrda otvorena       | Ponovno provjerite zauzetost nakon potvrde | Ostanite u zadatku                                      |
| Reload ili zatvaranje kartice              | Upozorenje preglednika gdje je podržano    | Trajni oporavak zahtijeva zaseban feature nacrta        |
| Izričita odjava uz izmjene                 | Pitajte kroz aplikacijsku zaštitu odjave   | Odjavite tek nakon dopuštenog izlaza                    |
| Opoziv ovlasti                             | Primijenite politiku opoziva               | Potvrda odbacivanja ne smije zadržati zabranjen sadržaj |

Životni vijek potvrde je bitan. Prekinite stare potvrde pri cleanupu ili zamjeni kako zakašnjeli odgovor ne bi proveo stari prijelaz. Jedan vlasnik treba spriječiti složene višestruke dijaloge. Pogrešku kanala potvrde razlikujte od potvrdnog rezultata; neuspješan dijalog ne smije značiti dopuštenje.

Nakon potvrđenog spremanja namjerno resetirajte osnovu obrasca kako prihvaćene vrijednosti više ne bi bile izmjene. Nakon odbijenog spremanja sačuvajte koristan unos i aktivnu zaštitu. Uspješan toast sam ne dokazuje ažuriranje osnove obrasca.

## Scenariji prihvaćanja

Promijenite samo parametar koji odabire B dok A ima izmjene: odgovarajuća zaštita se izvršava. Otkažite odbacivanje: odredište se ne otvara, polja ostaju. Otvorite potvrdu, drugom valjanom radnjom pokrenite zapisivanje pa potvrdite: ponovna provjera zauzetosti sprječava izlaz. Kliknite odjavu uz izmjene: otkazivanje zadržava autentikaciju. Pokušajte odjavu tijekom zauzetosti: aplikacija je odbija prema pravilima. Pokrenite reload: preglednički put odvojen je od prilagođenog modala. Opozovite pristup: ograničeni podaci čiste se i uz izmjene.

Lokalizirajte odbacivanje i nastavak uređivanja. Odbijanje zbog zauzetosti objasnite uz zadatak i zadržite koristan fokus nakon otkazane navigacije. Naziv gumba ne smije obećavati rollback već poslane naredbe.

## Izbjegnite ove prečace

Nemojte štititi samo putanju ako upit mijenja vlasnika, izvoditi izmjene iz fokusa, dopustiti zaobilaženje obrasca odjavom, nuditi odbacivanje tijekom nepotvrđenog zapisivanja ni dopustiti starom dijalogu poziv `proceed`. Nemojte obećavati oporavak nakon pada na temelju `beforeunload`. Jednom definirajte cjelovitu izlaznu politiku pa svaki relevantni kanal povežite s njezinim vlasnikom.

## Izvori i podrijetlo

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/components/DirtyStateAndNavigationGuardPanel/GuardedDraftPreview.tsx` — ugrađena zaštita putanje, otkaziva potvrda i reset prihvaćenih vrijednosti.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useFormNavigationGuard.ts` — putanja i upit, zauzetost, unload i provjere nakon potvrde.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useFormLogoutGuard.ts` — politika izričite odjave uz izmjene i zauzetost.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/auth/hooks/useBeforeLogoutGuard.ts` — potvrđeni callback i registracija zaštite u aplikaciji.
