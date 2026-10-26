# Popis značajki i odgovornosti

Predložak isporučuje pet oblika vlasnika značajki. Oni pokazuju različite
strukture; nisu zahtjev svakoj aplikaciji.

## Isporučeni oblici značajki

| Značajka     | Odgovornost                                                                  | Runtime tvornica? | Neobvezni primjer?                 |
| ------------ | ---------------------------------------------------------------------------- | ----------------- | ---------------------------------- |
| Contacts     | UI kontakata, domenski model, Query opcije, mutacije i asinkrona pohrana     | Da                | Da                                 |
| Settings     | Prikaz postavki u vlasništvu lokalizacije, teme i ljuske                     | Ne                | Obično ostaje, ali je prilagodljiv |
| Patterns     | Razvojni interaktivni recepti grupirani po sposobnosti                       | Ne                | Da, po kategoriji ili kao cjelina  |
| Architecture | Razvojni vodič izvornog koda iz ovih Markdown članaka                        | Ne                | Da                                 |
| Handbook     | Razvojni fullstack obrasci, dvojezični katalog članaka i prilagodba sadržaja | Ne                | Da                                 |

## Konstruirane i prezentacijske značajke

Contacts ima `contacts.feature.ts`, registraciju u
`src/app/bootstrap/runtime/appFeatures.ts` i
`hooks/useContactsFeature.ts` jer stvara runtime s adapterom. To ne znači da
svaka značajka treba te datoteke.

Settings je prezentacija i kompozicija. Kategorije Patternsa sadrže neovisne
primjere, a `src/features/development-guide/patterns/gallery` zajedničku
prezentaciju. Architecture posjeduje katalog izvornih članaka i adapter
lokaliteta/sadržaja pod `src/features/development-guide/architecture`. Handbook
posjeduje fullstack manifest, dohvat uparenog Markdowna i adapter sadržaja pod
`src/features/development-guide/handbook`, a Contacts je pod
`src/features/development-guide/contacts`. Zajednički prikaz Markdowna, izdvajanje
naslova, sadržaj članka i okvir stranice pripadaju `app/shell/documentation` te
primaju podatke umjesto uvoza kataloga. Router pretvara javni Handbook manifest
u konkretna odredišta i povezane članke. Vlasnici uputa ne uvoze uklonjive
primjere samo da bi ih opisali.

## Patterns kategorije

Isporučene Patterns kategorije su Feedback, Overlays, Localization and
formatting, Application state, Server data, Routing and URL state, Forms te
Tables and collections. Svaka posjeduje svoje stranice, implementaciju, testove,
metapodatke grupe ruta i prijevode. Application state dodatno posjeduje razvojnu
Signal registraciju i spremljenu vrijednost primjera. Kategorije se mogu
uklanjati neovisno, uz zadržavanje zajedničke galerije i preostalih kategorija.

## Uvjetne mape i uklanjanje

Mape su uvjetne. Značajka dobiva `api/`, `models/`, `signals/`, `hooks/`,
`components/`, `types/` ili `stories/` samo kada posjeduje tu ulogu. Prazne
mape i lažne tvornice stvaraju pogrešne ugovore. Kompaktnoj značajci mogu biti
dovoljne `index.ts` i jedna implementacija, primjerice
`components/FeatureSummary.tsx`, umjesto implementacijske datoteke u korijenu
značajke.

Pri uklanjanju pratite javni izvoz, stranice, rute, prijevode, testove, mockove,
pohranu te runtime ili Signal registraciju. Architecture mora raditi i bez
Contactsa ili pojedine Patterns kategorije.
