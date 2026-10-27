# Dodavanje, promjena ili uklanjanje značajke

Slijedite ovaj redoslijed kako bi vlasništvo i čišćenje ostali vidljivi.

## Dodavanje

1. Imenujte sposobnost i njezine javne potrošače. Stvorite
   `src/features/<feature>/index.ts` samo s namjernim izvozima.
2. Dodajte samo potrebne mape uloga. Modele i sheme definirajte prije adaptera;
   transportne tipove ne puštajte u API port.
3. Ako konstrukcija ubrizgava suradnike, dodajte `<feature>.feature.ts`, izvezite
   tvornicu i tip, registrirajte ih u `appFeatures.ts` te dodajte vlasnički
   `use<Feature>Feature` hook. Inače ne dodajte runtime kostur.
4. Ako Signali trebaju aplikacijsku hidrataciju ili efekte, izvezite jedan modul
   životnog ciklusa i registrirajte ga u `signalModules.ts`.
5. Dodajte tanke stranice, rute, navigaciju, prijevode oba jezika i potrebnu
   shemu pohrane sa zadanim vrijednostima.
6. Dodajte zrcaljene testove te integracijsku/browser pokrivenost prema riziku.
   Za ponovno upotrebljiva vizualna stanja dodajte stories.
7. Ažurirajte vodič Architecture kada se mijenja konvencija ili popis primjera.

## Promjena

Prije premještanja pratite javno sučelje i svaku registraciju. Sačuvajte
stabilne izvoze osim pri namjernoj migraciji. Mijenjajte jednog vlasnika odjednom
i nakon promjene uvoza ili naziva pokrenite provjeru arhitekture.

## Uklanjanje

Izbrišite implementaciju i zrcaljene testove, zatim stranice, rute, navigaciju,
prijevode, mockove, ključeve pohrane, runtime konstrukciju, Signal registraciju,
stories i poveznice. Nakon toga pretražite javni naziv i ID rute. Zadržite
generičku infrastrukturu koju ostale značajke koriste te provjerite pokretanje,
izravne URL-ove, Not Found i oba jezika.

Dokumentacijski primjeri žive samo pod `docs/storybook/`, s referentnim testovima
u `tests/storybook/`. Uklanjanje referentne kategorije zahvaća njezine Storybook
čitače, galeriju, testove i poveznice; nema ugrađene aplikacijske registracije za
uklanjanje. Sačuvajte zajednički docs prikaz i kanonske članke kada uklanjate
samo jedan primjer.
