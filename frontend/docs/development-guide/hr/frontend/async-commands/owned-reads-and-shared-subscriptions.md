# Razlikujte vlastite dohvate od zajedničkih query pretplata

Uređivač može upravljati zamjenjivim dohvatom, a da ne upravlja svim pretplatnicima istog udaljenog zapisa. Tu razliku definirajte prije dodavanja abort kontrolera ili otkazivanja queryja. Tako zatvaranje jednog dijaloga neće prekinuti zaglavlje, drugi panel ili zadržanu rutu kojoj zajednički rezultat još treba.

Ovo je **referentni obrazac potrošačke aplikacije**. client-discovery-app ima `useOwnedRead` za operacije koje pokreće uređivač, a zajedničke dohvate zasebno prepušta TanStack Queryju. Taj helper nije ugrađeni starter API. Pravilo vlasništva primijenite kroz trenutačne HTTP i query granice umjesto kopiranja importa iz druge aplikacije.

## Okidač i životni vijek

Vlastiti dohvat koristite kada jedna interakcija featurea pokreće zahtjev čiji rezultat vrijedi samo za tu interakciju: zamjenu asinkronih opcija nakon promjene nadređenog izbora, jednokratni pregled ili razrješavanje odabira prije lokalnog prijelaza. Vlasnik može zamijeniti prethodni zahtjev i otkazati ga pri unmountanju ili promjeni ovlasti.

Zajednički query koristite kada više promatrača namjerno koristi isti identitet predmemorije. Mountani uređivač jedan je promatrač, a ne jedini vlasnik zahtjeva. Zajednički query ključevi moraju sadržavati ulaze koji određuju rezultat, uključujući identitet korisnika ili radnog prostora kada je bitan. Slanje tih ulaza samo u HTTP zaglavlju ne razdvaja predmemorirane podatke.

Pregledani `useOwnedRead` čuva jedan aktivni kontroler. Svaki novi poziv otkazuje prethodni, stvara zamjenski, prosljeđuje njegov signal čitaču i provjerava signal nakon razrješenja promisea. Cleanup u layout effectu prekida aktivan zahtjev kada se promijeni vrijednost ovlasti ili vlasnik nestane. Pogrešku pretvara u `AbortError` samo kada je taj kontroler stvarno otkazan; inače ponovno baca izvornu pogrešku.

## Provedite otkazivanje kroz granicu

Konceptualni čitač u vlasništvu featurea može imati ovakav ugovor:

```ts
// Pseudokod: readCurrent i recordsApi pripadaju featureu; nisu starter importi.
const choice = await readCurrent(signal => recordsApi.findChoices({ parentId, signal }));
// readCurrent odbija poziv koji je zamijenjen, čak i ako transport ignorira abort.
applyChoices(choice);
```

Provjera samo prije zahtjeva nije dovoljna. Transport može završiti tijekom utrke s otkazivanjem ili adapter možda ne može zaustaviti stvarni posao. Provjera nakon `await` sprječava primjenu zastarjelog rezultata na lokalno stanje. Ona ne poništava poslužiteljski rad i nije opravdanje za oporavak zapisivanja koji se oslanja na abort.

Signal provedite kroz svaki adapter koji podržava otkazivanje. Granicu koja ga ne podržava dokumentirajte i zadržite provjeru rezultata. Nemojte izmišljati potpis opcija postojećeg API-ja: pregledajte stvarnu funkciju zahtjeva i namjerno dodajte parametar ondje gdje ga vlasnik može podržati.

Referentni uređivač specifikacija za svoj query koristi drugo pravilo: drugi promatrači radnog prostora i zaglavlja mogu zadržati dohvat nakon unmountanja uređivača ili ponavljanja effecta, pa query funkcija koristi signal Queryja. Ne otkazuje ga globalno samo zato što se uređivač zatvara. Uočeni gubitak ovlasti obrađuje se zasebno, uključujući poništavanje zahvaćenog vlasnika i uklanjanje privatnih zapisa odgovarajućeg opsega kada je potrebno.

## Odlučite što se smije otkazati

| Događaj                                                         | Vlastiti jednokratni dohvat                           | Zajednički query                                              |
| --------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Promjena nadređenog izbora                                      | Prekinite prethodni poziv i zamijenite ga             | Promijenite ključ koji određuje rezultat                      |
| Unmount jednog uređivača                                        | Prekinite njegov aktivan zahtjev                      | Prepustite Queryju životni vijek promatrača i zahtjeva        |
| Drugi panel još koristi zapis                                   | Ne utječite na taj panel                              | Sačuvajte valjanu pretplatu                                   |
| Korisnik izgubi ovlast                                          | Prekinite vlastiti rad i odbijte zakašnjele rezultate | Uskladite čišćenje privatne predmemorije odgovarajućeg opsega |
| Poslužitelj vrati stvarnu validacijsku ili transportnu pogrešku | Sačuvajte identitet pogreške                          | Izložite stanje pogreške queryja                              |

Nije svako otkazivanje queryja pogrešno. Feature može namjerno otkazati točan ključ pod svojim nadzorom prije optimističnog ažuriranja ili ukloniti nedostupne privatne podatke nakon opoziva ovlasti. Razlog i opseg moraju dolaziti iz životnog ciklusa featurea, a ne iz generičnog effecta koji pri cleanupu otkazuje sve.

## Pogreške i oporavak

Zamijenjeni dohvat smatrajte zastarjelim radom, u pravilu bez toasta pogreške. Stvarni neuspjeh aktualnog dohvata prikažite kao problem na koji se može djelovati. Široki `catch` koji vraća praznu kolekciju pretvara otkazivanje, zabranu pristupa, nedostajuće podatke i nedostupnost sustava u lažno uspješno stanje.

Ako stari dohvat opcija završi nakon novog, ne mijenjajte novi izbor. Ako aktualni dohvat ne uspije, sačuvajte kompatibilan unos gdje je sigurno i ponudite jasno imenovan ponovni pokušaj. Promijeni li se korisnik ili vlasnik zapisa, uklonite rezultate vezane uz vlasnika prije nego što ih zakašnjeli dovršetak može prikazati. Samo otkazivanje queryja ne osigurava tu provjeru ovlasti.

Stanje čekanja vežite uz odgovarajuću operaciju. Neovisno osvježavanje zaglavlja ne treba prikazati nepovezani izbor kao zauzet, a otkazivanje tog izbora ne smije obrisati podatke zaglavlja.

## Scenariji prihvaćanja

Pokrenite spor dohvat za nadređeni izbor A, prijeđite na B i dovršite A posljednji: pojavljuju se samo opcije B. Ponovite s adapterom koji završi unatoč abortu; provjera nakon čekanja i dalje odbija A. Zatvorite uređivač dok zaglavlje promatra isti query: lokalni rad završava bez aplikacijskog otkazivanja queryja zaglavlja. Promijenite korisnika tijekom dohvata: stari rezultat ne može popuniti stanje novog vlasnika. Stvarni mrežni problem ostaje pogreška, a ne poruka da nema rezultata.

Zasebno lokalizirajte čekanje, ponovni pokušaj, nedostupnost i odsutnost podudaranja. Objašnjenje onemogućenih izbora učinite čitljivim pomoćnim tehnologijama i nemojte premještati fokus nakon pozadinskog osvježavanja.

## Izbjegnite ove prečace

Nemojte stvarati nepovezan abort kontroler čiji signal nikad ne dođe do zahtjeva, pri unmountanju otkazivati sve queryje širokog prefiksa, svaku odbijenu promise operaciju proglasiti otkazivanjem ili koristiti transportni abort kao jedinu zaštitu od zastarjelih rezultata. Rezultat potreban samo uređivaču nemojte premjestiti u paralelan globalni signal radi lakšeg čišćenja. Životni vijek zahtjeva prilagodite najmanjem vlasniku koji može pouzdano odlučiti kada rezultat više ne vrijedi.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useOwnedRead.ts` — zamjena, layout cleanup, signal i provjera otkazivanja nakon čekanja.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — zajednički Query životni vijek, ključ s korisnikom i zasebno čišćenje nakon gubitka ovlasti.
