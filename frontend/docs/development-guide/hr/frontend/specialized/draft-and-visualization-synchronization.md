# Držite jedan nacrt iza obrasca i vizualnog pregleda

Karta, dijagram ili raspored mogu prikazivati isti nacrt kao polja bez drugog izvora poslovne istine. Definirajte pretvorbu nacrta u vizual i izričite vizualne interakcije natrag u nacrt. Persistencija ostaje zasebna imenovana naredba.

Ovo je **referentni recept** FRED form/map integracije i LMS agregatnog rasporeda. Povijesni React Hook Form i OpenLayers helperi nisu ugrađeni starter API-ji. Prenosivi ugovor jedan je kanonski nacrt s adapterima, a ne karte u svakom potrošaču predloška.

## Okidač i vlasništvo

Sinkronizirani vizual koristite kada objašnjava ili uređuje iste činjenice kao kontrole: dimenzije pravokutnika, položaj čvora ili raspored. Obrazac ili feature posjeduje vrijednosti i validaciju. Adapter posjeduje preview objekte i listenere. Vlasnik naredbe šalje dogovorenu domensku reprezentaciju.

FRED `useFormInteraction` prati obrazac, pretvara vrijednosti u DTO i metodom featurea osvježava geometriju. Izlaže obrazac i objekt. Sam ne dokazuje potpuno čišćenje, dvosmjernu sinkronizaciju ni persistenciju. LMS mijenja pripremljene vrijednosti djece i pri zamjeni čuva koordinate rasporeda; roditelj naknadno šalje agregat.

## Namjerno definirajte oba smjera

Ovo je **neutralni konceptualni kod**, a ne ugrađeni SDK API:

```ts
type ShapeDraft = { width: number; height: number; x: number; y: number };

function toPreview(draft: ShapeDraft) {
  return { origin: [draft.x, draft.y], size: [draft.width, draft.height] };
}

// Promjena polja -> validacija/izvod -> ažuriranje postojećeg vizuala.
// Dovršen drag -> pretvorba koordinata -> promjena kanonskog nacrta.
// Spremi -> validacija cijele naredbe -> API potvrda.
```

Preview događaj ne treba odmah spremati. Programsko osvježavanje može emitirati SDK događaj; označite izvor ili usporedite smislene vrijednosti kako naprijed ne bi rekurzivno pokretao natrag. Granica interakcije treba biti izričita: drag end mijenja nacrt, dok pomaci mogu mijenjati samo lagani preview ako feature tako odredi.

Koordinatni sustav, jedinice, preciznost i snapping pripadaju adapteru i domeni. Piksel nije nužno poslovna udaljenost, a transformacija može gubiti preciznost. Autoritativna ograničenja ostaju u domenskoj i backend validaciji; uvjerljiv prikaz nije dokaz valjanosti.

| Promjena                 | Kanonski nacrt                           | Vizual                                |
| ------------------------ | ---------------------------------------- | ------------------------------------- |
| Uređeno brojčano polje   | Promjena kroz vlasnika obrasca           | Izvedena geometrija                   |
| Dovršena vizualna radnja | Provjeren mapirani patch                 | Prikaz rezultirajućeg nacrta          |
| Programsko ažuriranje    | Bez zasebne poslovne mutacije            | Bez povratne petlje                   |
| Odustajanje              | Odbacivanje ili vraćanje prema pravilima | Uklanjanje ili reset                  |
| API odbije spremanje     | Siguran nacrt i pogreške ostaju          | Isti nespremljeni pregled             |
| Promjena vlasnika        | Završetak starog uređivanja              | Odvajanje starih objekata i listenera |

## Pogreške i oporavak

Neuspjela pretvorba ne smije upisati nevaljane brojeve. Sačuvajte posljednju smislenu vrijednost, objasnite problem i dajte ne-vizualni ispravak. Udaljena promjena osnove traži zastarjelost i usklađivanje umjesto precrtavanja unosa.

Slojeve, interakcije i callbackove montirajte i uklonite pod SDK vlasnikom. FRED hook mapiranja sam ne dokazuje te garancije; prije primjene pregledajte potrošača. Zakašnjeli događaj uklonjenog vizuala ne smije mijenjati novi uređivač iste komponente.

Izmjene neka predstavljaju korisnikovu namjeru, ne svaku promjenu SDK objekta. Izvedeno crtanje ne treba stalno označavati čist obrazac promijenjenim ni samo pokretati zaštitu odlaska.

## Scenariji prihvaćanja

Promijenite polje: jedna vrijednost i pregled se ažuriraju. Povucite vizual: nacrt se promijeni jednom, bez petlje i server upisa. Odustanite: oba slijede isto pravilo. Pošaljite nevaljanu geometriju: validacija odbija uz siguran unos. Unmountajte tijekom interakcije: listeneri prestaju, kasni događaji ne diraju novog vlasnika. Unesite i pregledajte iste vrijednosti tipkovnicom bez vizuala. Nakon uspjeha prihvaćena osnova i pregled se slažu.

Lokalizirajte jedinice, ograničenja, pogreške i upute. Valjanost ne izražavajte samo bojom i dajte pristupačne kontrole bitnih izbora.

## Izbjegnite ove prečace

Nemojte čuvati dva nekontrolirana nacrta, spremati svaki SDK događaj, server pravila računati samo iz piksela, puštati preview objekte ni precrtavanje smatrati persistencijom. Vizual predstavlja namjeru nacrta s vlasnikom.

## Izvori i podrijetlo

- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/features/map-interactions/hooks/useFormInteraction.ts` — pretvorba obrasca u DTO i pregled te granice helpera.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/lockage/components/LockageForm/LockageForm.tsx` — pripremljena zamjena djeteta, koordinate i kasnije slanje agregata.
