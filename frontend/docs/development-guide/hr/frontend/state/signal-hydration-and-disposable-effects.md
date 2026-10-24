# Hidratirajte sve signal grupe prije effecta s cleanupom

Effect pohrane može prepisati spremljeno defaultima ako počne prije hidracije. Aplikacijski effecti trebaju i jedan restartabilan vijek kako HMR i ponovljeni startup ne bi duplicirali pretplate. Registrirajte sinkrone module i prepustite poredak vlasniku lifecyclea.

Ovo je **ugrađena integracija startera s RGO ugovorom**. Starter delegira `createRgoSignalEffectsService`; registar sada uključuje razvojne primjere samo u DEV-u. Citirana biblioteka daje izričito pokretanje, rollback i generacijski disposal.

## Okidač i vlasnik

Koristite za sinkrone aplikacijske grupe, ne proizvoljne async poslove i lokalne componente. Modul posjeduje izvore, hidraciju, stjecanje effecta i cleanup. Registar pripadnost aplikaciji. Bootstrap ga pokreće i disposer registrira HMR-u.

Tvornica provjerava i snima callback reference bez pokretanja. Inicijalizacija prvo hidratira sve redom pa pokreće effecte istim redom. Rani effect tako ne vidi nehidratirane default vrijednosti druge grupe.

## Poštujte sinkroni ugovor

**Minimalna ilustracija ugrađenog oblika**:

```ts
const lifecycle = createRgoSignalEffectsService([
  { hydrate: restorePreferences, initEffects: startPreferencePersistence },
]);
const dispose = lifecycle.initialize();
// startPreferencePersistence vraća sinkroni cleanup.
// Async učitavanje ima drugu namjernu granicu.
```

Hidracija, početak i cleanup moraju biti sinkroni. Thenable se odbija; `initEffects` vraća undefined ili funkciju. Odbijanje async callbacka ne otkazuje rad koji je već pokrenuo. Fire-and-forget zahtjev nije čekana hidracija.

Aktivna inicijalizacija vraća isti disposer bez novih effecta. Poziv tijekom starta ili disposal-a baca. Disposer je idempotentan i vezan generaciji: stari ne zaustavlja kasniju. To su jamstva citirane biblioteke, ne page ref protokol za ponovno izmišljanje.

| Problem ili prijelaz      | Lifecycle                       | Odgovornost modula                              |
| ------------------------- | ------------------------------- | ----------------------------------------------- |
| Hidracija ne uspije       | Nema effecta                    | Staro hidratirano stanje ne vraća se automatski |
| Početak effecta ne uspije | Raniji cleanupovi obrnuto       | Osloboditi resurse prije vlastitog throwa       |
| Izričit disposal          | Pokušaj svih cleanupova obrnuto | Sinkrono oslobađanje                            |
| Jedan cleanup baci        | Prijava nakon pokušaja          | Caller odlučuje oporavak                        |
| Više pogrešaka            | AggregateError                  | Korisna dijagnostika                            |
| Restart nakon disposal-a  | Nova generacija                 | Valjano stanje i hidracija za restart           |

## Startup rollback nije univerzalni rollback

Servis zna samo uspješno vraćene cleanup funkcije. Ako modul registrira listener pa baci prije povratka, treba vlastito failure-safe stjecanje. Hidracija također mijenja stanje; servis ne vraća stari snimak nakon kasnijeg neuspjeha.

Ako zakažu startup i rollback cleanup, pogreške se agregiraju. Bootstrap zato treba namjerno rukovanje ako jamči vidljiv fallback. Nemojte ih tiho progutati ni pretpostaviti zaštitu svakog pozivatelja.

Estimate pokazuje ograničen effect: čita izvore, sprema tipiziranu vrijednost i prijavljuje saved/unavailable bez poništavanja živog unosa. Sprema izvore, ne drugi spremljeni izračun.

## Životni vijek i prihvaćanje

Entrypoint inicijalizira izvan rendera, čuva disposer, daje ga HMR-u i zove pri startup pogrešci. Render boundary ne posjeduje automatski taj vijek. Lokalna component pretplata treba lokalnog vlasnika, ne aplikacijski registar.

Sva hidracija mora prethoditi persistenciji. Ponovljeni aktivni poziv ne duplicira upise. Disposal prekida kasnije upise, pokušava sve i ponovljen ne dira novu generaciju. Neuspješan starter vraća ranije effecte, a sam modul svoje djelomične resurse. Razvojni primjeri ostaju uvjetni; produkcijski moduli ulaze namjerno kroz sučelje featurea.

## Izbjegnite ove prečace

Nemojte effect pokrenuti u renderu, async hidraciju ugurati u sinkroni registar, pretpostaviti povratak hidracije ni zanemariti disposer zbog budućeg reloada. Jamstvo vrijedi uz jasnu granicu stjecanja svakog modula.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/signals/initSignalEffects.ts` — delegacija i initializer.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/signals/signalModules.ts` — DEV registar.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — bootstrap i HMR.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/services/RgoSignalEffectsService/RgoSignalEffectsService.ts` — sinkronost, rollback, pogreške i generacije.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/development-guide/patterns/applicationState/signals/estimate/sigEstimate.effects.ts` — pohrana izvora i saved/unavailable effect.
