# Provjerite povezana polja i očistite nekompatibilan odabir

Valjano polje može postati nevaljano promjenom drugog. Odabrana osoba više ne pripada odjelu, završetak prethodi početku ili je razlog obvezan samo za jednu vrstu zahtjeva. Definirajte ograničenje i prijelaz koji nacrt drži dosljednim.

Ovo je **ugrađeni starter obrazac s povijesnim proširenjima**. Primjeri ovisnih polja koriste aktualne TanStack Form listenere i pretplate, a lokalizirana shema provjerava odnose. Stari FRED hook i LMS datumske kontrole pokazuju ponavljajuću potrebu; njihovi React Hook Form omotači nisu API-ji za prijenos.

## Okidač i vlasništvo

Feature posjeduje odnos i pravilo čišćenja. Shema posjeduje završnu valjanost i putanje pogreške. Listener obrađuje namjernu promjenu, a pretplata prikazuje ovisni dio. Nemojte mijenjati druga polja tijekom rendera ni resetirati unos generičkim effectom pri svakoj promjeni identiteta objekta.

Ugrađeni primjer odjela pri promjeni računa dopuštene opcije i čisti `assigneeId` samo ako stari izbor više nije valjan. Ne briše sve bezuvjetno. Primjer uvjetnog razloga čisti zastarjeli razlog pri povratku na standardni zahtjev. Shema neovisno zahtijeva razlog iznimke i provjerava pripadnost osobe.

## Povežite prijelaz i validaciju

Ovo je **neutralna ilustracija pravila**, a ne novi form helper:

```ts
function keepOrClearSelection(selectedId: string | null, allowedIds: readonly string[]) {
  return selectedId !== null && allowedIds.includes(selectedId) ? selectedId : null;
}

// Korisnik promijeni roditeljski izbor -> zadržite ili očistite ovisnu vrijednost.
// Cijela shema i dalje odbija nekompatibilan odnos pri slanju.
```

Čišćenje poboljšava nacrt, ali nije provedba. API pozivatelj može zaobići UI, a opcije se promijeniti udaljeno. Backend provjerava odnos pri izvršenju. Asinkroni dohvat treba vlasništvo zahtjeva kako stari rezultat A ne bi popunio opcije roditelja B.

Za datume odredite jesu li kalendarski, lokalni zidni unos ili točni trenuci. Ograničenje završetka treba null semantiku: otvoren kraj može biti dopušten ili oba kraja obvezna. Nemojte truthinessom zamijeniti nulu odsutnošću. LMS postavlja min/max granice kontrola početka i kraja; same UI granice ne dokazuju valjanost sheme ili servera.

| Prijelaz                                   | Pravilo vrijednosti                        | Pravilo pogreške                                  |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| Roditelj promijenjen, dijete još dopušteno | Zadržite dijete                            | Revalidirajte odnos                               |
| Dijete više nije dopušteno                 | Namjerno očistite                          | Pogreška obveznog ili nevaljanog izbora uz dijete |
| Uvjetno polje nije relevantno              | Očistite ili zadržite prema politici       | Uklonite zastarjelu pogrešku aktivnog slanja      |
| Promjena datumske granice                  | Čuvajte namjeru ili izričito očistite kraj | Pogreška uz korisno polje ispravka                |
| Udaljene opcije uklone izbor               | Označite ili uskladite nacrt               | Bez slanja skrivenog nevaljanog ID-a              |

## Pogreške i oporavak

Starter validira pri prvom slanju pa promjenama. Kad su pogreške vidljive, promjena povezanog polja treba osvježiti relevantnu pogrešku, ne čekati novo slanje. Povijesni FRED hook to radi nakon slanja, ali pretpostavlja nepromjenjiv popis praćenih polja i potiskuje exhaustive dependencies. Prenesite zahtjev, ne potiskivanje u aktualne hookove.

Server pogreška starog odnosa ne treba zauvijek ostati uz novi nepovezan izbor. Očistite ili revalidirajte kroz vlasnika koji zna izvorni zahtjev. Skrivanje kontrole istodobno ne smije slučajno ukloniti validaciju vrijednosti koja se i dalje šalje.

## Scenariji prihvaćanja

Odaberite dijete pa kompatibilnog roditelja: izbor ostaje. Odaberite nekompatibilnog: čisti se. Programsko slanje nevaljanog odnosa odbijaju shema i server. Promijenite početak iza kraja nakon neuspjelog slanja: pogreška se ažurira uz pravo polje. Iznimku pretvorite u standard: razlog i pogreška slijede pravilo. Utrkajte dva dohvata opcija: stari roditelj ne vraća nekompatibilne opcije.

Lokalizirajte poruke odnosa i objasnite iznenađujuće čišćenje. Fokus zadržite na aktualnoj kontroli i učinite razloge onemogućenih ovisnih polja dostupnima.

## Izbjegnite ove prečace

Nemojte čuvati skrivene nevaljane ID-eve, sve ovisno brisati bez razlike, mutirati tijekom rendera, granice date pickera smatrati provedbom ni kopirati hookove s ignoriranim ovisnostima. Povezane vrijednosti trebaju jedno pravilo prijelaza i cjelovit ugovor valjanosti.

## Izvori i podrijetlo

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/components/DependentFieldsPanel/DepartmentAssigneePreview.tsx` — uvjetno čišćenje listenerom i pretplata.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/components/DependentFieldsPanel/ConditionalReasonPreview.tsx` — čišćenje nerelevantnog polja.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/validation/forms.validation.ts` — lokalizirani odnosi i putanje pogrešaka.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/lib/react-hook-form/hooks/useDependentFieldValidation.ts` — povijesna povezana revalidacija nakon slanja i ograničenje ovisnosti.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/lockage/components/LockageForm/LockageForm.tsx` — povezane datumske granice i odnosi lokalnog agregata.
