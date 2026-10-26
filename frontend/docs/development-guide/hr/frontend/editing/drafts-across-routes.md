# Sačuvajte nacrt s vlasnikom kroz namjeran prijelaz na drugu rutu

Dulji zadatak može privremeno napustiti obrazac: izraditi prilog, popraviti preduvjet pa se vratiti izvornom nacrtu. Takav prijelaz tretirajte kao izričit protokol sesije. Sam URL ne daje pravo na zadržavanje proizvoljnog nespremljenog stanja, a povratak s uploada ne znači da se najnovija datoteka treba automatski odabrati.

Ovo je **referentni obrazac potrošačke aplikacije** client-discovery-app. Njezina sesija registracije specifikacije i kompozicija ruta radnog prostora usklađuju zadržane nacrte, stvaranje dokaznog materijala i osvježavanje pri povratku. Helperi i nazivi ruta pripadaju tom proizvodu; starter ne ugrađuje univerzalnu pohranu nacrta kroz više ruta ni API takve sesije.

## Okidač i vlasnik

Roditeljsku sesiju koristite kada zadatak stvarno obuhvaća više mountanih prikaza, ali ima jednog vlasnika nacrta. Roditelj upravlja nacrtom i pravilima njegova uklanjanja. Završne rute upravljaju prikazom, lokalnim fokusom i vlastitim kontrolama. Nemojte sve stanje obrasca premjestiti globalno samo zato što se jedan potomak unmounta.

Pregledani nacrt registracije čuva slučajni nonce, ulaze, odabranu temu, serijalizaciju početnih vrijednosti, neobvezan identitet zamjene i tokene svježine. Vlasnik je par projekt/korisnik. Promjena vlasnika uklanja nacrt i stanje prijelaza; uklanja ih i uočeni opoziv ovlasti. Nonce označava jednu sesiju nacrta, a ne poslužiteljsku vjerodajnicu autorizacije.

Stanje izmjena uspoređuje bitne ulaze s početnim snimkom, dok je odabrana tema stanje prikaza. Zauzetost pripada zajedničkom zadatku pa prijelaz na susjednu rutu ne može slučajno omogućiti drugo slanje. Identitet ponovnog pokušaja ostaje u sesiji umjesto u prolaznoj završnoj komponenti.

## Pripremite usko definiran prijelaz

Referentna operacija `armEvidence` uspijeva samo ako nacrt postoji, nije zauzet, opažene su ovlasti svježe, nacrt nije zastario te nema pogreške ovlasti ni opoziva. Kao dopušteni prijelaz bilježi nonce nacrta i neobvezan identitet zamjene. Podudaranje povratka zahtijeva i pripremljeni ID sesije i nonce trenutačnog nacrta.

Neutralni **konceptualni ugovor sesije** izgleda ovako:

```ts
type DraftSession = {
  owner: { workspaceId: string; viewerId: string };
  nonce: string;
  values: { title: string; attachmentId: string | null };
  basis: { revision: number; sourceId: string };
  topic: "details" | "attachments";
};
type ArmedDetour = {
  sessionNonce: string;
  kind: "create-attachment";
};

// Dopustite samo poznati par zadatak <-> pomoćna ruta za ovog vlasnika i nonce.
// Povratak osvježava opcije priloga; odabir ostaje izričita korisnikova radnja.
```

Vlasnik ruta radnog prostora povezuje protokol s običnim zaštitama odlaska uz nespremljene izmjene. Prepoznaje određen par odlaska i povratka za trenutačni projekt, identitet zadatka ili zamjene, pomoćnu rutu i pripadajuću sesiju. Proizvoljni URL-ovi, kopirani stari nonce ili drugi zadatak ostaju obična navigacija s pravilima potvrde i uklanjanja nacrta. Predikat zaštite treba odlučiti smije li se prijelaz provesti; ne smije potajno odbaciti nacrt tijekom procjene moguće rute.

To je iznimka za poznati prijelaz zadatka, a ne opće zaobilaženje zaštite nespremljenih promjena. Operacija u tijeku ili gubitak ovlasti može poništiti prijelaz čak i kada URL i dalje izgleda ispravno.

## Osvježite pri povratku bez izmišljanja namjere

Pregledana operacija povratka bira temu dokumenata i povećava epohu osvježavanja. Komponenta koja koristi sesiju uključuje epohu u ključ administracijskog queryja, zatim prihvaća osvježenu projekciju opcija nakon uspješnog povratnog dohvata. Fokusira odgovarajuću kontrolu dokumenta. Zadržani unos i dalje pripada izvornom nacrtu.

Callback zadržavanja dokaznog materijala namjerno ne dodjeljuje ID uploadanog priloga. Korisnik može poslati više datoteka, stvoriti nešto za drugu svrhu ili se vratiti bez dovršenog uploada. Osvježavanje dostupnih izbora i izričit odabir željenog priloga izbjegavaju skrivenu poslovnu odluku.

Promijene li se udaljeni izvor ili revizija tijekom odsutnosti, označite nacrt zastarjelim i zahtijevajte usklađivanje. Problem nemojte popravljati zamjenom samo tokena. Ako se ovlast izgubi, uklonite ograničen materijal nacrta čak i kada bi čuvanje bilo praktično. Podudaranje klijentske sesije dopunjuje poslužiteljske provjere; ne autorizira pristup ni povezivanje priloga.

## Odluke o životnom vijeku i oporavku

| Događaj                                     | Ponašanje sesije                                | Vidljivi sljedeći korak                                                       |
| ------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Ulazak na dopuštenu rutu priloga            | Zadržite isti nacrt i nonce                     | Stvorite ili pregledajte prilog                                               |
| Povratak s pripadajućom sesijom             | Osvježite opcije; zadržite izričit izbor        | Fokusirajte dio za priloge                                                    |
| Povratak sa starim ili tuđim nonceom        | Nemojte preuzeti drugu sesiju                   | Objasnite nedostajući ili istekli zadatak odnosno provedite običnu navigaciju |
| Izvor se promijeni tijekom odsutnosti       | Zadržite siguran nacrt, označite zastarjelost   | Uskladite s aktualnim izvorom                                                 |
| Promjena projekta ili korisnika             | Očistite nacrt i ponavljanje tog vlasnika       | Započnite zaseban zadatak                                                     |
| Opoziv ovlasti                              | Uklonite ograničen sadržaj i poništite prijelaz | Prikažite dopušten put oporavka                                               |
| Reload preglednika izgubi sesiju u memoriji | Nemojte izmišljati nacrt iz samog URL-a         | Objasnite ponovno pokretanje nacrta                                           |

Trajni nacrti zasebna su odluka proizvoda. Trebaju opseg pohrane, migraciju sheme i verzije, zadržavanje, privatnost, vlasništvo i pravila vraćanja. Referentna sesija u memoriji nije dokaz da postoji oporavak nakon ponovnog pokretanja preglednika.

## Scenariji prihvaćanja

Unesite naslov, odaberite temu, otvorite dopuštenu pomoćnu rutu i vratite se: isti unos i identitet nacrta ostaju. Uploadajte prilog: opcije se osvježavaju, ali nijedan prilog nije prešutno odabran. Vratite se kopiranim starim nonceom ili drugim radnim prostorom: nacrt se ne preuzima. Promijenite udaljenu reviziju tijekom odsutnosti: slanje ne može povezati stare vrijednosti sa svježim tokenom. Opozovite korisnikovu ovlast: zadržani nacrt nestaje i povratak ne zaobilazi zabranu. Pokušajte otići na nepovezanu rutu uz izmjene: obična zaštita odbacivanja i dalje vrijedi.

Lokalizirajte prijelaz, povratak, istek sesije, zastarjeli izvor i odbacivanje. Kontrola povratka treba imenovati zadatak koji nastavlja. Fokus vratite relevantnoj temi ili polju nakon pristizanja svježih opcija, a ne na odspojeni element ili proizvoljan vrh stranice.

## Izbjegnite ove prečace

Nemojte nacrte čuvati u singletonu bez opsega, izvoditi vlasništvo iz promjenjivog naziva, dopustiti bilo kojem `returnTo` URL-u zaobilaženje zaštita, zaključiti izbor priloga iz najnovijeg zapisa ni čistiti identitet ponavljanja pri svakoj promjeni teme. Nonce u URL-u nije dokaz ovlasti. Koristan protokol sesije točno definira vlasnika nacrta, par ruta koji ga smije zadržati i događaje koji završavaju njegov životni vijek.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationRegistrationSession.ts` — vlasništvo nacrta i noncea, priprema prijelaza, podudaranje, epoha povratka i izričito neodabiranje priloga.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/components/ProjectSpecifications.tsx` — query opcija ovisan o povratku, prihvaćanje svježe projekcije i fokus kontrole dokumenta.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/discovery/components/DiscoveryWorkspace.tsx` — par ruta određen projektom i zadatkom, podudaranje sesije i integracija obične navigacije.
