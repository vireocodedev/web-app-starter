# Validirajte spremljene postavke i namjerno migrirajte njihovo značenje

Vrijednost pročitana iz browser storagea nepouzdan je ulaz i kada ju je aplikacija sama zapisala. Može doći iz starijeg izdanja, druge kartice, ručnog uređivanja, djelomične migracije ili preglednika koji sada odbija pohranu. Ključeve, runtime sheme, zadane vrijednosti i semantičke migracije držite pod jednim vlasnikom.

Članak povezuje **ugrađeno ponašanje startera i povijesni FRED primjer**. Starter posjeduje `appLocalStorage`, tipiziranu shemu i zadane vrijednosti te izričitu migraciju značenja veličine fonta. FRED provjerava vrijednosti prema shemi ključa, ali pregledani servis ne štiti `JSON.parse` ni pristup storageu. Nemojte kopirati ograničenje ni iz starter omotača zaključiti neprovjerena jamstva biblioteke.

## Okidač i vlasništvo

Trajne postavke koristite za male neosjetljive izbore prikaza koji trebaju preživjeti reload: jezik, gustoću, temu ili način uređivača. Aplikacijski vlasnik postavki definira dopuštene vrijednosti i značenje. Komponente koriste namjerno sučelje umjesto vlastitih ključeva i parsiranja sirovog JSON-a.

Ovu pohranu nemojte koristiti kao poslužiteljsku istinu, autentikaciju, privatni poslovni nacrt ni trajni outbox. Oni imaju drukčije potrebe privatnosti, dosljednosti i oporavka. Storage browser origina može biti dostupan aplikacijskom JavaScriptu i zajednički sesijama uređaja; naziv ključa nije granica autorizacije.

Starter zajedno deklarira ključeve, Zod object shemu i zadane vrijednosti pa ih predaje `RgoLocalStorageService`. Više shell postavki ima zadani `null`, odnosno nema izričitog korisničkog nadjačavanja. Sačuvajte tu semantiku: odsutnost može značiti sistemsko ili aplikacijsko pravilo, ne nužno konkretnu svijetlu temu, gustoću ili uključenu mogućnost.

## Odvojite oblik od semantičke migracije

Runtime shema može dopustiti `"big"` iako se njegovo značenje promijenilo među izdanjima. Starter taj slučaj izričito obrađuje: stari `big` bez verzije skale 2 čita se kao `medium`, čuvajući prijašnjih 112.5% umjesto prešutnog prelaska na novih 125%.

Migracija pretvara stari `big` u `medium` pa zapisuje verziju 2. Preskače rad kada oznaka već postoji i hvata pogrešku pohrane kako bi živa postavka ostala upotrebljiva. Kompatibilno čitanje bitno je kada trajni upis ne završi. To je jače od promjene enuma i nade da će stare vrijednosti nestati.

Neutralni **predloženi recept migracije**:

```ts
type DensityPreference = {
  version: 2;
  value: "comfortable" | "compact" | null;
};

// Sigurno pročitajte nepoznate sirove podatke.
// Dekodirajte JSON, provjerite poznatu staru ili aktualnu verziju.
// Pretvorite staro značenje u aktualnu vrijednost.
// Objavite upotrebljivu živu vrijednost i bez dostupne pohrane.
// Spremite nakon uspješne pretvorbe; oporavak neka bude idempotentan.
```

To nije ugrađeni format omotnice startera. Namjerno odaberite verzioniranu omotnicu ili oznaku pojedine postavke. Obični localStorage upisi odvojene su operacije; oznaka i vrijednost nisu automatski transakcija više ključeva. Prekinutu migraciju učinite sigurnom za ponavljanje i nemojte označiti dovršetak prije zadržavanja pretvorene vrijednosti.

Nepoznata buduća verzija također treba pravilo. Starija kartica ne smije slijepo zamijeniti noviji oblik zadanim. Nepodržane podatke sigurno sačuvajte ili zanemarite, bez destruktivnog downgradea ako nije izričito namjeravan.

## Odluke o pogreškama i oporavku

| Spremljeno stanje                | Čitanje                                      | Trajni upis                                                     |
| -------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Ključ ne postoji                 | Dokumentirana zadana ili sistemska semantika | Samo prema namjernoj politici                                   |
| Valjana aktualna vrijednost      | Koristite provjerenu vrijednost              | Prepisivanje nije potrebno                                      |
| Poznata valjana stara vrijednost | Deterministička pretvorba značenja           | Idempotentna migracija                                          |
| Neispravan JSON                  | Sigurno oporavite ovu postavku               | Uklonite ili resetirajte samo zahvaćeni ključ gdje je dopušteno |
| Pogrešan oblik ili enum          | Sigurno zadano ili podržana migracija        | Bez povjerenja TypeScript castu                                 |
| Sigurnosna ili quota pogreška    | Živa postavka ostaje upotrebljiva            | Obrada bez rušenja shella                                       |
| Nepodržana buduća verzija        | Politika kompatibilnosti                     | Bez slijepog prepisivanja novijeg stanja                        |

FRED servis provjerava zadane i parsirane vrijednosti, resetira nevaljanu shemu i validira zapisivanje. Ali neispravan JSON baca prije `safeParse`, a `getItem` i `setItem` mogu zakazati. Nova implementacija mora zaštititi dekodiranje i pristup pohrani; sama schema validacija ne pokriva nijedno.

Starter također uklanja određeni popis starih shell ključeva uz pojedinačnu obradu pogreške. To je ciljano čišćenje, a ne dopuštenje za `localStorage.clear()` i brisanje nepovezanih podataka. Migracije i uklanjanje starih ključeva dokumentirajte kod vlasnika postavki.

## Životni vijek i usklađivanje

Odredite pripada li postavka uređaju, računu ili prostoru. Tema može biti uređajska; druga postavka treba opseg vlasnika. Generičkim ključem nemojte slučajno prenositi privatnu postavku zadatka ili nacrt među korisnicima. U ovaj sloj ne spremajte vjerodajnice sesije, lozinke ni privatni sadržaj datoteka.

Promjene među karticama traže namjerno usklađivanje ako ih proizvod obećava. Tipizirani getter ne dokazuje da React reagira na tuđi storage event. Sama promjena spremljene vrijednosti također možda ne ažurira živo stanje providera. Koristite postojeći preference API da pohrana i prikaz ostanu dosljedni.

## Scenariji prihvaćanja

Učitajte valjanu postavku i sačuvajte je nakon reloada. Spremite neispravan JSON: shell radi sa sigurnom vrijednošću. Spremite stari `big` bez oznake: kompatibilnost startera čuva prijašnju vizualnu veličinu. Prekinite migraciju između vrijednosti i oznake: ponavljanje ne umnaža pretvorbu. Neka upis baci pogrešku: živi izbor i dalje radi. Oštetite jedan ključ: ostale postavke ostaju. Stariji klijent susretne buduću verziju: slijedi kompatibilnost umjesto uništavanja novijeg sadržaja.

Lokalizirajte nazive i opise, ne trajne ključeve. Sistemske i zadane izbore objasnite, a žive accessibility postavke moraju raditi i bez trajne pohrane.

## Izbjegnite ove prečace

Nemojte vjerovati `JSON.parse(...) as T`, validirati samo upis, promijeniti značenje enuma bez migracije, resetirati sve zbog jednog ključa, ovdje spremati autentikacijske tajne ni pretpostaviti stalnu dostupnost storagea. Oblik, semantička verzija, živa vrijednost i trajnost zapisivanja odvojene su odgovornosti.

## Izvori i podrijetlo

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/data/storage/appLocalStorage.ts` — ugrađene tipizirane postavke, nullable nadjačavanje, font kompatibilnost i migracija te ciljano čišćenje.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/services/LocalStorageService.ts` — provjera po ključu i oporavak uz nezaštićeni JSON i pristup storageu.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/services/localStorageSchemas.ts` — središnji rječnik trajnih vrijednosti i izvedeni tipovi.
