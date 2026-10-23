# Nakon svakog važnog awaita ponovno provjerite vlasnika i ovlasti

Otvaranje potvrde ne zamrzava zapis, korisnika, rutu ni ovlast na kojoj je potvrda počivala. Korisnik može promijeniti stranicu dok je dijalog otvoren, druga osoba može opozvati pristup, a odgovor može stići nakon nestanka uređivača. Zabilježite vlasnika i generaciju operacije pa ih ponovno provjerite na granicama na kojima rezultat još može izazvati učinak.

Ovo je **referentni obrazac potrošačke aplikacije** client-discovery-app. Njezin uređivač specifikacija koristi brojač generacije i završno stanje gubitka ovlasti; sales helper životnog vijeka koristi layout-effect cleanup. To su helperi te aplikacije, a ne izvezeni starter API-ji. Koristan ugovor je poništavanje zastarjelog rada, ne univerzalan naziv hooka za kopiranje u svaki obrazac.

## Okidač i vlasnik

Generaciju koristite kada ista mountana komponenta tijekom vremena može predstavljati različite ovlasti uređivanja. Oznaka mountanja govori je li komponenta živa. Ne govori smije li trenutačni korisnik još mijenjati zapis A, je li A još odabran ili pripada li operacija najnovijoj sesiji uređivanja.

Vlasnik featurea definira granicu generacije: korisnika, radni prostor, identitet zapisa, sesiju nacrta i uočena ograničenja koja poništavaju rad u tijeku. Bezopasno osvježavanje ne mora poništiti sve; stvarno ograničenje mora. Nepromjenjivu osnovu naredbe zadržite s tim vlasnikom. Backend i dalje mora provjeriti trenutačnu autorizaciju i konkurentnost prije zapisivanja.

Referentni uređivač povećava generaciju pri uočenom gubitku ovlasti. Drugi restriktivni prijelazi prvo se bilježe u stanju, a zatim potvrđuju kroz layout effect; ref životnog vijeka ne mijenja se tijekom renderiranja. To je važno pri ponavljanju rendera: odbačeni render ne smije poništiti još važećeg vlasnika samo zato što je evaluiran.

## Zaštitite obje strane naredbe

Slijedi **pseudokod protokola u vlasništvu featurea**, a ne starter helper ni potpuna React implementacija:

```ts
const operation = owner.capture(); // identitet zapisa + generacija + nepromjenjiva osnova
if (!owner.mayStart(operation)) return;

const confirmed = await confirmExactAction(operation);
if (!confirmed || !owner.isCurrent(operation)) return;

const result = await api.send(operation.command);
recordAcknowledgedOutcome(result); // poslužiteljski rezultat ostaje činjenica
if (!owner.isCurrent(operation)) return;

acceptIntoCurrentEditor(result);
```

Prva provjera nakon čekanja sprječava da potvrda za zapis A pošalje naredbu nakon što je vlasnik postao zapis B. Druga sprječava da zakašnjeli rezultat A resetira obrazac B ili mu prikaže pogrešan lokalni ishod. Potvrđeni rezultat može obavijestiti zasebnog promatrača na razini aplikacije ako on ima vlastitog valjanog vlasnika; lokalno prihvaćanje i potvrda naredbe imaju različite životne vijekove.

Provjera generacije ne zaključava poslužiteljske promjene. Ovlast se može promijeniti nakon uspješne provjere, prije dolaska zahtjeva. Pošaljite očekivanu reviziju ili token i prepustite poslužitelju odbijanje zastarjelog ili nedopuštenog rada. Brojač u pregledniku ne zamjenjuje autorizaciju.

Pregledani `useFormFeedback` pri unmountanju prekida aktivnu potvrdu i može povezati vanjski abort signal. Uređivač dodatno provjerava zabilježenu generaciju i završno stanje nakon potvrde jer otkazivanje dijaloga ne pokriva svaku promjenu ovlasti. Njegova funkcija povratne informacije za zapisivanje također prihvaća predikat `isCurrent` za pozivatelje kojima treba ograničiti obavijesti na aktualnog vlasnika. Predavanje predikata odluka je pozivatelja; ne predaje ga svaki pregledani poziv.

## Odluke o poništavanju i čišćenju

| Granica                                         | Potrebna odluka                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Korisnik otkaže potvrdu                         | Završite bez slanja i bez poruke uspjeha                                        |
| Korisnik ili zapis promijeni se tijekom potvrde | Poništite zabilježenog vlasnika i zanemarite rezultat potvrde                   |
| Ovlast se opozove                               | Učinite radnje zastarjelima i uklonite ograničene podatke                       |
| Naredba završi nakon navigacije                 | Sačuvajte potvrđenu poslužiteljsku činjenicu; preskočite stare učinke uređivača |
| Aktualna naredba ne uspije                      | Prikažite pogrešku aktualnom vlasniku                                           |
| Stara naredba izvršava cleanup                  | Nemojte ukloniti zauzetost novog vlasnika                                       |

Zauzetost i zaštita od dvostrukog klika također pripadaju vlasniku operacije. Sinkrona oznaka može spriječiti drugi poziv prije nego što React iscrta onemogućen gumb. Cleanup mora osloboditi resurse te operacije bez mijenjanja zamjenskog uređivača. Provjera vlasništva samo u uspješnoj grani nije dovoljna ako bezuvjetni `finally` može obrisati tuđe stanje rada u tijeku.

Dajte prednost poništavanju potvrđenog vlasnika prije nego što zastarjele radnje utječu na vidljivu stranicu. Referentni sales helper koristi layout granicu, a uređivač specifikacija layout effect za promjene epohe ovlasti. To nije dopuštenje za mijenjanje refova tijekom renderiranja ni za premještanje svih nepovezanih effecta u layout effecte.

## Pogreške i oporavak

Otkazana potvrda znači da naredba nije poslana. Otkazivanje transporta nakon slanja ne dokazuje da je poslužitelj poništio zapisivanje. Ako se potvrda izgubi, koristite identitet ponovnog pokušaja i poslužiteljski receipt protokol umjesto stvaranja nove operacije. Zakašnjela pogreška zastarjelog vlasnika ne smije zamijeniti pogrešku trenutačnog uređivača.

Pri uočenom gubitku ovlasti prvo poništite rad, zatim uskladite uklanjanje ograničenih nacrta i predmemorije. Pri prolaznoj pogrešci dohvata sačuvajte siguran unos i ponudite oporavak; svaka pogreška nije trajan opoziv ovlasti. Stvarne ugovore odgovora mapirajte kroz API featurea umjesto nagađanja statusnih kodova po UI kontrolama.

## Scenariji prihvaćanja

Otvorite „Arhiviraj dokument A”, prijeđite na B i potvrdite: ne šalje se zahtjev za zastarjelog vlasnika. Opozovite ovlast dok je dijalog otvoren: potvrda ne može zaobići zabranu. Pokrenite zapisivanje za A, promijenite stranicu pa ga dovršite: B zadržava svoje vrijednosti, zauzetost i poruke. Dvaput kliknite prije iscrtavanja onemogućenog gumba: pokreće se jedna operacija. Ponovite mount i cleanup u razvoju: stare potvrde i pretplate završavaju bez otkazivanja drugog valjanog vlasnika.

U lokaliziranoj potvrdi imenujte točnu radnju i cilj. Sačuvajte ponašanje fokusa pri potvrđivanju i otkazivanju. Pristanak nikad nemojte zaključiti iz samog otvaranja dijaloga ili ostanka na stranici.

## Izbjegnite ove prečace

Nemojte koristiti `isMounted` kao autorizaciju, provjeravati generaciju samo prije čekanja, mijenjati refove životnog vijeka u renderu, dopustiti starom `finally` bloku resetiranje nove operacije ni pretpostaviti da onemogućen gumb zaustavlja programske pozive. Provjere držite uz svaki vidljivi učinak kako dodavanje novog awaita ne bi ponovno otvorilo utrku.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — generacija, poništavanje ovlasti, provjere nakon potvrde i zapisivanja te zaštita od dvostrukog poziva.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/sales/hooks/useSalesLifetime.ts` — potvrđeni životni vijek mountanja i layout cleanup.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useFormFeedback.ts` — otkaziva potvrda i neobvezan predikat aktualnog vlasnika za obavijesti zapisivanja.
