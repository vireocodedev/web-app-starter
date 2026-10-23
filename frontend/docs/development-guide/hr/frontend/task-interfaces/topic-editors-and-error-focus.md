# Navigacija tema zadržava jednu formu i jednog vlasnika

Navigaciju tema koristite kada duga forma sadrži različite skupine rada, ali i dalje šalje jednu poslovnu naredbu. Prijelaz s „Detalja” na „Privitke” mijenja vidljivu sekciju; ne stvara drugi zapis, ne sprema dio nacrta i ne potvrđuje valjanost ranijih odgovora.

Ovo je **referentni recept**. Client Discoveryjev `AppTopicEditor` pruža prikaz i navigaciju; nije ugrađeni izvoz predloška. Potrošačka aplikacija treba zadržati vlasnika forme i pravila validacije predloška umjesto uvođenja drugog kontrolera forme.

## Vrijednosti držite iznad odabrane teme

Značajka posjeduje instancu forme, početnu osnovicu, ID odabrane teme, stanje izmjena, validaciju, slanje i zaštitu navigacije. Teme sadrže stabilne ID-eve, prevedene naslove i prikaz polja. Prezentacijska komponenta prima te podatke, eksplicitni callback odabira, poveznice pogrešaka, stanje zauzetosti i završnu radnju vlasnika.

U pregledanom izvoru sve sekcije ostaju montirane. Neaktivne sekcije koriste `hidden` i `display: none`; promjena teme ne resetira vrijednosti polja. To sprječava gubitak neposlanih vrijednosti, ali skrivanje nije čišćenje životnog ciklusa: efekti, pretplate i skupi prikazi unutar skrivenih tema ostaju montirani. Namjerno odlučite treba li ugrađena karta ili velik pregled odgoditi vlastiti skupi rad.

Ne stvarajte zasebnu instancu forme u svakoj temi pa tek na završnom kliku spajajte vrijednosti. Time otežavate validaciju između tema, praćenje izmjena i sastavljanje točne naredbe. Zasebno spremljeni podređeni resurs druga je operacija i treba eksplicitnog vlasnika.

## Navigacija nije validacija ni spremanje

Sljedeće je **ilustrativno sastavljanje u potrošačkoj aplikaciji**, ne komponenta koju predložak izvozi:

```tsx
<TopicEditor
  topics={topicsOwnedByThisForm}
  topicId={selectedTopic}
  onTopicChange={setSelectedTopic}
  errors={visibleFormErrors}
  busy={commandPending}
  finalAction={
    <Button type="submit" disabled={commandPending}>
      {t("documents.create")}
    </Button>
  }
/>
```

Stvarna referentna komponenta zahtijeva i prevedene navigacijske oznake. Kontrole prethodne/sljedeće teme koriste `type="button"`; završna radnja predaje se bez izmjene. Vlasnik zato mora postaviti ponašanje slanja, pristupačan naziv, uvjete ovlasti i onemogućeno stanje. `busy` ne konfigurira proizvoljan predani gumb.

Referenca izravno navigira između tema; „Sljedeće” ne validira sekciju. Ako aplikacija treba uvjetovane korake, zasebno definirajte taj tijek i objasnite preduvjet. Oznaka koraka ne smije prešutno značiti da su podaci spremljeni ili prihvaćeni na poslužitelju.

Završno slanje ostaje odgovorno za potpunu mjerodavnu validaciju i naredbu. Odredite odnos izvorne validacije preglednika i skrivenih obaveznih kontrola; ne onemogućujte skrivena polja samo radi zaobilaženja validacije jer to može promijeniti poslane vrijednosti. Dosljedno koristite predviđeni ugovor validacije i slanja biblioteke forme.

## Poveznice pogrešaka mijenjaju temu i fokus

Pogreška teme ima stabilan ID, ID pripadajuće teme, prevedenu poruku i neobavezni ID polja. Zadani handler reference odabire temu te raspoređuje fokus na polje ili naslov teme kada polje nije navedeno. Naslovi podržavaju programski fokus i koriste zajednički odmak ljepljivog zaglavlja.

Prepisivanje `onErrorSelect` prenosi tu odgovornost vlasniku. Mora otkriti ispravnu temu i pomaknuti fokus kada je cilj montiran i vidljiv. Ako odabir teme postane asinkron, koristite potvrđenu vidljivost/spremnost umjesto pretpostavke da jedan animacijski okvir uvijek završava prijelaz.

Fokus mijenjajte nakon korisničke navigacije ili odabira pogreške. Ne fokusirajte prvo polje pri svakom pozadinskom osvježavanju upita. Lokalizirajte oznake, sažetke pogrešaka i prethodno/sljedeće te zadržite logične razine naslova stranice.

## Odluke o stanju i neuspjehu

| Situacija                                   | Očekivano ponašanje                                              |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Korisnik mijenja temu                       | Sačuvajte vrijednosti, izmjene i istu instancu forme             |
| Završna validacija pronalazi drugu pogrešku | Povezani sažetak otkriva i fokusira cilj                         |
| Naredba je u tijeku                         | Vlasnik operacije blokira promjenu teme i dvostruko slanje       |
| Skup tema se promijeni                      | Namjerno normalizirajte stabilni ID; rezervni indeks nije ovlast |
| Korisnik napušta editor                     | Postojeće zaštite izmjena i zauzetosti odlučuju o odlasku        |
| Poslužitelj odbije naredbu                  | Zadržite siguran unos i označite polja ili poslovni konflikt     |

Pregledana komponenta za nepoznati ID prikazuje prvu temu. To je rezervni prikaz, ne validacija parametra rute ni dokaz ovlasti. Prazan skup tema treba eksplicitno stanje vlasnika umjesto forme koja zavarava s „1 od 0”.

## Prihvat i prečaci koje treba izbjeći

Unesite vrijednost, promijenite temu dvaput i vratite se: vrijednost i povijest validacije ostaju. Odaberite pogrešku druge teme: stvarno polje dobiva fokus. Pokrenite slanje: navigacija i predana završna radnja poštuju zauzetost. Promijenite jezik: oznake se mijenjaju bez promjene identiteta teme ili unosa. Napustite nespremljen editor: postojeća zaštita i dalje djeluje.

Izbjegavajte ponovno montiranje forme s `key={topicId}`, indekse polja kao semantičke ID-eve, skriveno spremanje na „Sljedeće” i nepristupačan sažetak koji pokazuje na skriveno polje. Prikaz tema pomaže dovršiti jednu operaciju; ne posjeduje poslovno dovršenje.

## Izvori i porijeklo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppTopicEditor.tsx` — montirane sekcije, odabir, zauzetost, pogreške, fokus i završna radnja.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/AppTaskPresentation.ts` — ugovori tema i pogrešaka.
