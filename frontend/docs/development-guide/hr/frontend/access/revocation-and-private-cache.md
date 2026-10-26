# Zajedno opozovite ovlasti nacrta i privatnu predmemoriju

Dopuštenje može nestati dok je stranica otvorena. Onemogućiti spremanje nije dovoljno ako stari nacrt, pregled paketa ili privatna query predmemorija i dalje prikazuju sadržaj koji korisnik više ne smije čitati. Uočeni opoziv tretirajte kao usklađenu promjenu ovlasti uređivača i zadržanih podataka.

Ovo je **referentni protokol potrošačke aplikacije** client-discovery-app. Njezin uređivač specifikacija povezuje projekciju ovlasti, zadržane zapise, generacije operacija i Query čišćenje odgovarajućeg opsega. Starter ne ugrađuje predikat opoziva ni query obitelji tog proizvoda. Protokol prilagodite stvarnom ugovoru vidljivosti i pogrešaka trenutačnog featurea; pozicije u polju nemojte kopirati kao univerzalan cache API.

## Okidač i vlasništvo

Vlasnik ovlasti featurea određuje uklanja li svježe opažanje postojeće dopuštenje, skriva zapis, mijenja nositelja dodjele, arhivira uređivi resurs ili čini privatni paket nedostupnim. Vlasnik sesije uklanja svoj nacrt i pravo ponavljanja naredbe. Vlasnik query ključeva točno određuje koje zadržane projekcije više nisu sigurne.

CDA u ovom uređivaču opažene odgovore 401, 403 i 404 smatra završnim gubitkom ovlasti. To je politika tog endpointa, a ne pravilo prema kojem svaka nestala stavka ili mrežna pogreška znači odjavu. Svježa projekcija radnog prostora može ukloniti i ovlasti, identitete dopuštenih radnji, verzije ili dodjele. Ograničenja resetiraju uređivač; nepovezani dodaci čuvaju unos i mogu učiniti njegovu osnovu konkurentnosti zastarjelom.

Razlikujte zastarjelost i opoziv. Zastarjeli podaci mogu opravdati zadržavanje dopuštenog unosa radi usklađivanja. Opozvana vidljivost može zahtijevati uklanjanje istog unosa. Čuvanje rada vrijedno je samo dok ga vlasnik još smije držati.

## Uskladite prijelaz

Neutralni slijed je **konceptualni pseudokod**, a ne ugrađena starter funkcija:

```ts
function observeRestriction(nextAuthority: Authority) {
  invalidatePendingGeneration();
  clearUnauthorizedDraftAndRetry();
  projectOnlyPermittedVisibleFacts(nextAuthority);
  void cancelAndRemovePrivateQueries(affectedScope);
}
```

Pregledani uređivač odmah ograničava vidljivi zapis stanjem zabrane i vidljivosti, pa asinkrono čišćenje predmemorije nije jedina zaštita. Očišćeni zapis ne može se ponovno popuniti iz iste uspješne, ali nedopuštene projekcije. Vidljiva projekcija koristi trenutačne ovlasti i dodjele radnji, filtrira nevidljive verzije i uklanja administrativne dodjele i događaje nakon gubitka upravljanja.

Promjene epohe ovlasti potvrđuju se kroz layout effect prije nego što zastarjele radnje mogu utjecati na stranicu. Zaseban effect otkazuje zahvaćene queryje pa ih uklanja. Otkazivanje prije uklanjanja smanjuje mogućnost ponovnog popunjavanja starim zahtjevom, ali vlasnik rezultata i dalje treba provjeru ovlasti za adaptere koji završe kasno. Ni uklanjanje ni brojač generacije sami ne opozivaju poslužiteljski pristup.

Izvor ograničava čišćenje na projekt i korisnika pa bira privatne queryje paketa, administracije, radnog prostora ili statusa prema opozvanoj ovlasti. Predmemorija drugog korisnika i nepovezana javna kolekcija izvan su te granice. Opseg izrazite imenovanom tvornicom ključeva ili tipiziranim predikatom featurea; nemojte širiti nedokumentirane pretpostavke o indeksima ključa po stranicama.

## Odlučite što ostaje

| Opažanje                             | Pravilo nacrta                                 | Pravilo projekcije čitanja                                 |
| ------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------- |
| Privremena nedostupnost transporta   | Sačuvajte dopušten unos                        | Prikažite pogrešku ili zastarjelost; ne zaključujte opoziv |
| Promjena revizije bez ograničenja    | Zadržite unos, označite staru osnovu           | Svježu dopuštenu projekciju držite zasebno                 |
| Uređivanje uklonjeno, čitanje ostaje | Zaustavite uređivanje prema pravilima featurea | Zadržite samo dopušten prikaz                              |
| Privatna verzija više nije vidljiva  | Uklonite ograničeni materijal verzije          | Otkažite i uklonite paket i ovisne privatne projekcije     |
| Promjena korisnika ili projekta      | Završite sesiju starog vlasnika                | Koristite drugi identitet predmemorije                     |
| Gubitak sesije ili prava pregleda    | Očistite ograničeni zapis i stare naredbe      | Uklonite zahvaćene privatne zapise i prikažite zabranu     |

UI ne može izbrisati informacije koje je osoba već vidjela ili zabilježila. Protokol sprječava nastavak prikaza, slučajno korištenje među vlasnicima i stare lokalne operacije; ne jamči retroaktivnu tajnost. Poslužitelj mora nastaviti provoditi svako čitanje, preuzimanje i naredbu.

## Pogreške i oporavak

Kada operacija izgubi ovlast, stariji uspješan odgovor ne smije resetirati zabranu. Nova dodjela ovlasti može pokrenuti novo dopušteno čitanje i sesiju prema izričitim pravilima oporavka; ne smije prešutno oživjeti stare privatne nacrte. Ponovni ulazak i prijava moraju utvrditi pravog vlasnika prije popunjavanja sadržaja.

Ako čišćenje ne uspije, zadržite vidljivu zabranu i prijavite sigurnu dijagnostiku bez bilježenja privatnog sadržaja. Stari sadržaj ne prikazujte kao fallback. Istodobno nemojte uništiti dopušten rad zbog običnog timeouta samo zato što je brisanje svega jednostavnije od modeliranja pogreške.

Dugovječni objekti pregleda, downloadi, lokalne pohrane i imperativni prikazivači trebaju vlastita pravila uklanjanja. Pregledano Query čišćenje dokaz je za query zapise, a ne da je uklonjena svaka moguća klijentska kopija. Dodatne vlasnike popišite kada ih feature uvede.

## Scenariji prihvaćanja

Opozovite čitanje dok su otvoreni nacrt s izmjenama i privatni paket: sadržaj nestaje, čekajuća potvrda ne može poslati naredbu, a zakašnjeli dohvat ne može ga vratiti. Uklonite upravljanje uz zadržano osnovno čitanje: administrativni detalji nestaju, dopuštena projekcija ostaje dosljedna. Osvježite nepovezanim novim zapisom: unos ostaje, bez lažnog opoziva. Promijenite korisnika ili projekt: stari nacrt i identitet ponavljanja ne prenose se. Izazovite timeout dohvata: dopušten unos ostaje dostupan za siguran oporavak.

Zasebno lokalizirajte zabranu, zastarjelu osnovu, nedostupne podatke i ponovno pokretanje. Nakon uklanjanja uređivača fokus postavite na smislen naslov ili odredište oporavka; nemojte ga ostaviti na odspojenom polju.

## Izbjegnite ove prečace

Nemojte samo onemogućiti zapisivanje, zauvijek držati privatni zapis, uklanjati queryje bez zaštite od kasnih rezultata, invalidirati cijelu predmemoriju pri svakom osvježavanju ili svaki neuspjeh proglasiti trajnim gubitkom ovlasti. Opoziv je promjena vlasnika s posljedicama za zadržavanje podataka, a ne samo stanje gumba.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — ograničene projekcije, završni gubitak ovlasti, poništavanje uređivača i opseg otkazivanja i uklanjanja.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationRegistrationSession.ts` — uklanjanje nacrta i ponavljanja pri promjeni vlasnika ili opozivu.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/api/specifications.api.http.ts` — query identitet projekta i korisnika te validirane API projekcije.
