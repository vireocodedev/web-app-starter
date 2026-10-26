# Koristite polja prema shemi bez izmišljanja korisnikove namjere

Strukturirani opis obrasca može dijeliti tekst, broj, objekt, polje, nullable i union kontrole među povezanim naredbama. Ne može odlučiti što korisnikov poslovni izbor znači. Odvojite transportni oblik, početne vrijednosti, izričit odabir i domensku validaciju.

Ovo je **referentni recept**, a ne ugrađeni starter renderer. CDA deklarira `FormNode` i inicijalizaciju, a featurei naredbi dodaju semantiku. Starter koristi trenutačni TanStack Form i `@rgo-web/frontend`. Namjerne obrasce featurea nemojte zamijeniti uvezenim potrošačkim engineom samo zato što oba prihvaćaju JSON vrijednosti.

## Okidač i vlasnik

Strukturirani renderer koristite kada povezane operacije stvarno dijele stabilnu semantiku i feature daje nazive, izbore, validaciju i pristupačan prikaz. Prilagođen obrazac birajte za specijaliziran zadatak, bogato objašnjenje ili točne domenske dokaze.

Feature posjeduje naredbu i autoritativnu shemu. Renderer posjeduje kontrole i smještaj pogrešaka. Uređivač posjeduje životni vijek i slanje. Navigacija tema može organizirati kontrole; CDA `AppTopicEditor` upravlja navigacijom i prikazom, ne renderiranjem sheme.

CDA `FormNode` deklarira `requireChoice`. Ipak, pregledani zajednički initializer union uvijek inicijalizira prvom opcijom i ne čita tu oznaku. Nemojte izričito neodabran union predstavljati kao jamstvo tog utilityja. Zahtjev prvo implementirajte i validirajte u stvarnom featureu ili rendereru.

## Smislene izbore učinite izričitima

Ovo je **predloženi neutralni ugovor nacrta**, a ne ugrađeni API:

```ts
type DestinationDraft =
  { choice: null } | { choice: "existing"; recordId: string | null } | { choice: "new"; title: string };

// choice:null nije valjan za slanje dok korisnik ne odabere.
// Promjena grane slijedi izričito pravilo zadržavanja ili odbacivanja.
```

Zadana grana može odgovarati bezopasnoj prikaznoj postavci. Ne odgovara kada izbor postojećeg ili novog određuje stvaranje ili povezivanje resursa. Prije naredbe provjerite discriminator i obvezna polja grane. Nemojte poslati skrivena stara polja prethodne grane.

`null`, prazan string, nula i false različite su vrijednosti. Prazan broj ne treba prešutno postati nula bez izričite semantike. Datum i točan trenutak trebaju različita pravila parsiranja; CDA utility poznaje metapodatke formata i pretvara instant u lokalni tekst, ali novi renderer i dalje treba obrnutu pretvorbu i ugovor vremenske zone.

## Odluke i oporavak

| Promjena                   | Potrebna politika                                    |
| -------------------------- | ---------------------------------------------------- |
| Promjena union grane       | Namjerno zadržavanje ili odbacivanje starih podataka |
| Nullable polje onemogućeno | Odlučiti postaje li null ili samo nije uređivo       |
| Dodavanje stavke polja     | Stabilan lokalni identitet gdje treba                |
| Promjena verzije sheme     | Uskladiti nacrt bez tihog preoblikovanja             |
| Poslužitelj odbije odnos   | Sačuvati siguran unos i stvarnu pogrešku             |

Validacija oblika ne dokazuje aktualno dopuštenje, vlasništvo povezanog zapisa ni svježinu. Backend ponovno provjerava cijelu naredbu. Generički renderer ne smije nedostupan izbor pretvoriti u slobodan tekst za zaobilaženje pravila.

## Scenariji prihvaćanja

Otvorite obvezni union bez odabira: slanje nije valjano. Odaberite granu, unesite podatke, promijenite je i vratite se: vrijedi dokumentirano zadržavanje. Očistite nullable broj: null i nula ostaju različiti. Dodajte ili premjestite stavke: fokus i pogreške slijede stabilan identitet. Učitajte staru shemu: nepodržana polja ne šalju se tiho. Poslužitelj odbije zastarjeli odnos: obrazac čuva koristan dopušten unos i nudi točan ispravak.

Lokalizirajte nazive, pomoć, opcije i pogreške. Interni nazivi svojstava nisu završni UI tekst. Generirane kontrole trebaju stabilne oznake i veze pogrešaka, a dugi obrasci smislene naslove tema.

## Izbjegnite ove prečace

Nemojte prvom granom nevidljivo odlučiti poslovni ishod, nullable poistovjetiti s praznim stringom, sirovi JSON koristiti kao univerzalni UX ni pretpostaviti da je deklarirana oznaka implementirano ponašanje. Dijelite mehaniku dok feature zadržava semantiku.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/structuredFields.ts` — strukturirani rječnik i deklarirani metapodaci izbora.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/utils/structuredFields.ts` — početne vrijednosti, prva union opcija i lokalni prikaz trenutka.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppTopicEditor.tsx` — prikaz tema bez vlasništva renderera sheme.
