# Popis značajki i odgovornosti

Aplikacija isporučuje Početnu, Postavke, autentikaciju i generičku infrastrukturu.
Sve nastavne značajke i čitači članaka žive u Storybooku, izvan `src/`.

## Ugrađeni i referentni vlasnici

| Vlasnik                 | Lokacija                                             | Odgovornost                                            | Produkcijska runtime tvornica? |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------ |
| Settings                | `src/features/settings/`                             | Prikaz postavki lokalizacije, teme i ljuske            | Ne                             |
| Početna i auth stranice | `src/pages/`, `src/app/auth/`                        | Ulaz aplikacije i granice sesije                       | Auth je infrastruktura         |
| Contacts                | `docs/storybook/examples/Contacts/`                  | Cjelovit referentni UI, model, API port i Query opcije | Nema produkcijske registracije |
| Patterns                | `docs/storybook/patterns/<Category>/`                | Fokusirani primjeri i zajednička galerija              | Ne                             |
| Architecture reference  | `docs/storybook/architecture/ArchitectureReference/` | Čitač i katalog kanonskog Markdowna arhitekture        | Ne                             |
| Handbook                | `docs/storybook/handbook/Handbook/`                  | Engleski čitač i katalog uparenih fullstack članaka    | Ne                             |

## Konstruirane i prezentacijske značajke

Produkcijski registar `src/app/bootstrap/runtime/appFeatures.ts` prazan je.
Settings sastavlja vlasničke hookove bez tvornice, API-ja ili runtime dohvaćanja.
Contacts pokazuje stvarnu tvornicu s ubrizganim API i Query ovisnostima,
konstruiranu samo u izoliranom prikazu. Hook čita privatni referentni Context,
a ne produkcijski član `useAppFeature("contacts")`. Živi prikaz bira memorijske
podatke; adapter pohrane u pregledniku ostaje neaktivan, testiran primjer.
Ugradnja potrošačke značajke zahtijeva implementaciju, izbor adaptera, registraciju
runtimea i jedan tipizirani hook vlasnika.

Patterns kategorije su Feedback, Overlays, Localization and formatting,
Application state, Server data, Routing and URL state, Forms te Tables and
collections. Svaka posjeduje referentne panele i testove. Application state
stvara privatne Signale i memorijsku pohranu s čišćenjem u vlasništvu prikaza;
produkcijski registar Signala prazan je. Zajednički Markdown prikaz pripada
`docs/storybook/shared/documentation/`, a zajednička galerija ostaje pod
`docs/storybook/patterns/shared/`. Aplikacija ne ovisi o čitačima ni katalozima.

## Uvjetne mape i uklanjanje

Mape su uvjetne. Značajka dobiva `api/`, `models/`, `signals/`, `hooks/`,
`components/` ili `types/` samo kada posjeduje tu ulogu. Kompaktnoj značajci mogu
biti dovoljne `index.ts` i `components/FeatureSummary.tsx`; prazne mape i lažne
tvornice stvaraju pogrešne ugovore.

Upute i pripreme prikaza koriste sekcije i istoimene mape pod `docs/storybook/`,
sa zajedničkim helperima u `shared/`. Produkcijski izvor ne uvozi dokumentaciju
ni Storybook konfiguraciju, uključujući raw importe i globove.

Pri uklanjanju ugrađene značajke pratite javne izvoze, stranice, rute, navigaciju,
prijevode, testove, mockove, pohranu, runtime i Signal registraciju. Uklanjanje
dokumentacijskog primjera zahvaća samo njegove Storybook potrošače, referentne
testove i upute. Pri reorganizaciji čitača sačuvajte kanonske članke i nepromjenjivu
provenijenciju vezanu uz izvornu reviziju.
