# Proširenim redcima i uređivačima djece dajte izričite granice nacrta

Roditeljski obrazac može imati uređive podretke bez zasebne server transakcije za svaku izmjenu. Odlučite mijenja li dijalog djeteta lokalni nacrt agregata ili sprema neovisan resurs i tu granicu izrazite callbackovima i nazivima gumba.

Ovo je **referentni recept** LMS agregatnih obrazaca i FRED proširenja. Njihovi povijesni React Hook Form i table omotači nisu trenutačni starter API-ji. Prenesite vlasništvo i identitet, a kontrole provedite aktualnim sučeljima.

## Okidač i vlasništvo

Hijerarhijske retke koristite za stvaran odnos roditelja i djeteta s korisnim sažetim pregledom i detaljima. Roditeljski agregat posjeduje cijelu pripremljenu vrijednost i završnu naredbu. Dijalog djeteta drži privremenu kopiju do Primijeni ili Odustani. Proširenje upravlja vidljivošću, ne odabirom ni persistencijom.

Pregledani LMS obrazac spaja kolekcije djece, callbackom dijaloga zamjenjuje odgovarajuće dijete u stanju roditelja i lokalno uklanja stavke. Roditeljsko slanje mapira privremene ID-eve prije slanja agregata. To pokazuje put pripremljenog agregata; ne znači da je svaki child editor aplikacije samo lokalan.

FRED proširivi redak ima zaseban gumb i detaljni redak. Pri zatvaranju unmounta detalje. To odgovara čitanju, ali može izgubiti polja koja žive samo ondje. Trajni nacrt držite kod vlasnika ili namjerno ostavite editor mountan.

## Odvojite identitete i radnje

Ovo je **konceptualni neutralni model**, a ne ugrađeni API:

```ts
type DraftLine = {
  localId: string;
  serverId: string | null;
  title: string;
  quantity: number;
};

// Primijeni dijete: zamjena prema localId u roditeljskom nacrtu.
// Odustani: odbacivanje samo kopije dijaloga.
// Spremi roditelja: validacija i slanje cijelog dogovorenog agregata.
```

Lokalni ID stabilan je kroz sortiranje, proširenje i izmjene. Server ID označava spremljeni zapis. Nemojte ih poistovjetiti ni indeks koristiti za oboje. LMS povijesno stvara negativan timestamp ID novog djeteta; to nije univerzalan protokol i može se sudariti. Birajte stabilan lokalni identitet s izričitim transportnim mapiranjem.

| Radnja                        | Lokalni učinak            | Udaljeni učinak                  |
| ----------------------------- | ------------------------- | -------------------------------- |
| Proširenje                    | Prikaz detalja            | Nema osim vlastitog lazy dohvata |
| Odabir                        | Promjena opsega odabira   | Nema                             |
| Primjena pripremljene izmjene | Promjena nacrta roditelja | Nema do roditeljske naredbe      |
| Odustajanje od djeteta        | Odbacivanje kopije        | Nema                             |
| Spremanje neovisnog resursa   | Ugovor tog resursa        | Izričita potvrđena mutacija      |
| Spremanje agregata            | Validacija cijele namjere | Dokumentirana naredba agregata   |

## Pogreške i oporavak

Nemojte slučajno ugnijezditi HTML obrasce ni dopustiti da Primijeni pošalje roditelja. Portal sam ne definira vlasništvo slanja. Koristite izričitu povezanost obrasca i tipove gumba te pregledajte stvarnu granicu dijaloga.

Ako validacija odbije dijete, vežite pogrešku uz stabilan identitet i omogućite otvaranje retka. Ako dijete nestane udaljeno, uskladite ovlasti i reviziju umjesto zamjene drugog retka na starom indeksu. Odustajanje ne smije zadržati slučajnu mutaciju zajedničkog objekta.

Proširenje, klik retka, checkbox i poveznica trebaju različitu semantiku. FRED povijesni markup ima checkbox ulogu retka bez cjelovitog odabira; nemojte ga kopirati kao smjernicu pristupačnosti. Koristite aktualne podržane semantike, po potrebi `aria-expanded` i vezu kontrole te lokalizirane nazive.

## Scenariji prihvaćanja

Uredite dijete pa odustanite: roditelj se ne mijenja. Primijenite: mijenja se samo točan lokalni redak, bez server upisa u pripremljenom toku. Promijenite poredak: editori, pogreške i odabir prate identitet. Zatvorite detalj: potreban nacrt ostaje kod vlasnika. Spremite nevaljano dijete: točan redak može se otvoriti i ispraviti. Pritisnite Enter pri primjeni: roditelj se ne šalje slučajno. Odbijte server naredbu: siguran unos agregata ostaje.

## Izbjegnite ove prečace

Nemojte proširenje smatrati odabirom, nenamjerno spremiti pola agregata, mijenjati zajednički objekt prije potvrde, koristiti indekse ni negativne timestampe proglasiti standardom. Ugniježđeni editor treba imenovanu granicu nacrta i potvrde.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/lockage/components/LockageForm/LockageForm.tsx` — lokalna zamjena i uklanjanje, privremeni identitet i mapiranje agregata.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/components/data-display/FredTable/components/FredExpandableTableRow/FredExpandableTableRow.tsx` — zasebna kontrola i detaljni redak te ograničenja unmounta i markupa.
