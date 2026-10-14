# Vlasništvo stanja i životni ciklus Signala

Stanje birajte prema odgovornosti i životnom vijeku, a ne omiljenoj biblioteci.

## Odabir mehanizma koji posjeduje stanje

| Vrsta stanja                                  | Prikladni vlasnik               |
| --------------------------------------------- | ------------------------------- |
| Privremena interakcija ili prikaz             | Najbliža React komponenta       |
| Vrijednosti obrasca, pogreške, slanje         | Instanca obrasca i shema        |
| Dijeljivi filtri ili odabir rute              | URL/query parametri             |
| Asinkroni podaci, učitavanje, pogreške, cache | TanStack Query                  |
| Sinkrono zajedničko reaktivno domensko stanje | Signali značajke ili aplikacije |
| Vrijednosti koje prežive ponovno učitavanje   | Vlasnička provjerena pohrana    |

## Pohrana nije drugi izvor istine

Spremljena vrijednost nije zaseban model stanja. Odredite vlasnika žive
vrijednosti, provjerite ulaz iz pohrane, namjerno hidrirajte i pišite kroz jedan
efekt ili uslugu. Ne održavajte isti izvor istine u Queryju, Signalu, Contextu i
pohrani.

## Oblik Signal grupe

Signal grupe žive u `<owner>/signals/<group>/` i dijele korijen naziva
`sig<Group>`. Grupa može izvesti izvorišne/izračunate vrijednosti, tipizirane
akcije, model, uslugu i efekte, a ostaje ravna unutar mape grupe.

## Hidratacija, efekti i čišćenje

Grupa koja treba hidrataciju pri pokretanju ili aplikacijski efekt izlaže jedan
tipizirani modul životnog ciklusa kroz javni `index.ts`. Registar je
`src/app/bootstrap/signals/signalModules.ts`; `initSignalEffects.ts` hidrira
**sve** module prije pokretanja **ijednog** efekta i vraća jedno čišćenje.
Redoslijed registracije ne smije predstavljati ovisnost.

Efekti komponente ostaju u komponenti i vraćaju vlastito čišćenje. Stanje rute
ne pretvarajte u aplikacijski Signal kada ga trebaju reproducirati duboka
poveznica i tipke Natrag/Naprijed.
