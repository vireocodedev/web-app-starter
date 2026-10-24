# Fokus prenesite tek nakon oslobađanja modalnog vlasništva

Zatvaranje sheeta i navigacija nisu trenutan događaj. Mountani trap može vratiti fokus s nove stranice, a opći opener restore na kontrolu stare rute. Odredite vlasnika pri odustajanju, ruti, fragmentu i prisilnom uklanjanju.

Ovo je **ugrađena starter kompozicija s RGO detaljima**. AppShell posjeduje pathname fokus, AppPageNavigation izlaz sheeta, a RGO normalno vraćanje pri finalizaciji. Portal čuva React kontekst, ali ne uklanja DOM i modalni vijek.

## Okidač i vlasnik

Koristite za drawer, dijalog, page selector, command navigaciju i contents link u portalu. Modal upravlja trapom i izlazom. Shell novim main fokusom. Feature užim poljem ili naslovom samo kada zadatak to traži.

AppShell pri promjeni pathnamea fokusira main s `preventScroll`. Search i fragment nisu automatski isti događaj; njihov tok odlučuje. Skip link cilja focusable main, a shell ne ocrtava cijelu regiju iako skip kontrolu čini vidljivom na fokus.

## Pričekajte pravu granicu

**Ilustracija slijeda** page navigacije:

```text
odabir druge stranice
  -> closing i zapamćeno odredište
  -> Drawer onExited i closed render
  -> koristan lokalni fokus
  -> router navigacija
  -> novi pathname posjeduje main fokus
```

AppPageNavigation isključuje automatski MUI restore i radi ga nakon izlaza. Odustajanje vraća trigger. Ista stranica zatvara bez gubitka upita i fragmenta. Vanjska pathname promjena potiskuje restore da trap ne ukrade novi fokus.

Footer može doći portalom. Nativni click listener stvarnog DOM-a presreće prikladne fragment linkove, čeka izlaz i čuva modifier/new-tab ponašanje. Isti hash izričito skrola postojeći cilj, novi ide routerom uz query. To nije razlog za zamjenu svih React događaja nativnima.

| Prijelaz                | Vlasnik                                          |
| ----------------------- | ------------------------------------------------ |
| Odustajanje             | Trigger nakon izlaza                             |
| Druga putanja           | Router/shell nakon izlaza                        |
| Ista stranica           | Dismiss i ista adresa                            |
| Contents fragment       | Prvo release pa ciljni scroll                    |
| Normalno RGO zatvaranje | Finalizer pokušava povezani opener               |
| Opener više ne postoji  | Fallback pokušaj ili namjerno odredište featurea |

## Granice biblioteke i prisilnog zatvaranja

RGO čuva opener i vraća ga nakon normalnog exit prijelaza. Ako je odspojen, pokušava body. To ne jamči koristan naslov ili fokusabilnost svakog hosta. Prisilna page/provider cancel ima drugi vijek; ruta posjeduje novo odredište umjesto univerzalnog starog openera.

Samo gornji modal treba dismiss gestu; stog se može promijeniti tijekom nje. Bottom drawer zato ponovno provjerava aktualni top. Globalni Escape ne smije zaobići vlasnike i zatvoriti nepovezane površine.

## Pogreške i scenariji prihvaćanja

Odustajanje vraća fokus nakon izlaza. Druga stranica ostavlja ga u novom sadržaju. Portal contents skrola tek nakon releasea. Desktop resize uklanja stari mobile trap. Uklonjeni opener nije pretpostavljen valjan cilj. Ugniježđeni dismiss zahvaća točnu gornju sesiju.

Provjerite tipke, stvarni focus element i URL/query/hash, ne samo nestanak. Scan ili slika ne dokazuju vrijeme handoffa. Kontrole, dialog i recovery naslovi trebaju smislen naziv u jeziku; refetch ne treba stalno pomicati fokus.

## Izbjegnite ove prečace

Nemojte navigirati prije releasea, uvijek vraćati stari opener, globalno isključiti fokus ni portal kontekst smatrati DOM containmentom. Prijelaz treba jednog aktualnog vlasnika.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/components/AppShell.tsx` — skip, main i drawer handoff.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/components/AppPageNavigation.tsx` — izlaz, navigacija i portal fragment.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/RgoOverlayProvider.tsx` — exit i gornji dismiss.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/internal/store.ts` — opener i prisilni vijek.
