# Provjerite ishod na granici koja ga posjeduje

Koristan scenarij navodi što se mijenja, što mora ostati isto i koja granica to može dokazati. Broj klikova ne dokazuje persistenciju, a HTTP status sam ne dokazuje odsutnost zabranjenog retka. Tvrdnje odaberite iz ugovora prije odabira mockova.

Ovo je **ugrađeni obrazac testiranja s potrošačkim primjerima**. Starter Contacts testovi gledaju zahvaćenu i nepovezanu query predmemoriju; autentikacijski API preduvjete zahtjeva i klasifikaciju pogreške. CDA dodaje trajne negativne ishode točnih naredbi. Datoteke su pročitane kao izvor; članak ne prijavljuje izvršenje ni prolaz testova.

## Okidač i vlasništvo

Dizajn prema granici koristite pri novom ponašanju, popravku regresije i odabiru pokrivenosti. Feature posjeduje vidljive ishode, a test pripremu i kontrolirani scenarij. Odaberite najmanju stvarnu granicu koja otkriva problem bez zamjene ponašanja koje provjeravate.

Starter Contacts suite priprema svoju i nepovezanu kolekciju, izvršava mutaciju i provjerava da je invalidiran samo Contacts. Pri odbijenom zapisivanju nijedna nije invalidirana. To je jače od poziva internog helpera: namjerni učinak i izolacija vidljivi su u QueryClient stanju.

Auth API suite provjerava da neuspjeli CSRF dohvat znači nula slanja prijave. Razlikuje i 503 od nevaljanih vjerodajnica. Negativne tvrdnje štite ugovor od testa koji bi prihvatio bilo kakvu pogrešku.

## Prvo napišite ugovor scenarija

Ovo je **neizvršeni dizajnerski pseudokod**, a ne ugrađeni helper:

```ts
// Dano: vidljiv dokument i nepovezana cached kolekcija.
// Kada: naredba se odbije zbog stare revizije.
// Tada: nacrt ostaje, nema uspjeha,
//       promatrač potvrđenog rezultata ne poziva se,
//       nepovezana predmemorija ostaje ista.
```

Pozitivan slučaj i susjedno odbijanje često otkrivaju pravu granicu. Za naredbu pitajte o potvrdi, trajnim činjenicama, identitetu potvrde i odsutnosti nedopuštenog. Za UI o prikazu, fokusu, navigaciji i unosu. Za cleanup o tome što prestaje nakon uklanjanja.

| Tvrdnja               | Koristan dokaz                                 | Samo po sebi nedovoljno |
| --------------------- | ---------------------------------------------- | ----------------------- |
| HTTP ugovor           | Stvarno mapiranje zahtjeva i odgovora klijenta | Mock callback featurea  |
| Ciljani refresh       | Stanje ciljnog i nepovezanog ključa            | Pozvana invalidacija    |
| Odbijena autorizacija | Zabrana i nema trajnog učinka                  | Skriven gumb            |
| Sigurno otkazivanje   | Abort i odbijen zakašnjeli rezultat            | Postoji kontroler       |
| Završetak uređivača   | Potvrđeno stanje i namjerno zatvaranje         | Pozvan toast            |

## Granice mockova ostavite poštenima

Spy je koristan kada je sam poziv ugovor, primjerice promatrač commita. Slab je dokaz ponašanja koje zamjenjuje. Frontend mock ne dokazuje server autorizaciju. Mock dijalog ne dokazuje fokus stvarnog browser modala.

CDA scenariji provjeravaju nepromjenjive bajtove, privatne projekcije, replay i brojeve nakon zabrane. Pokazuju dublje granice, ali produktni fixturei nisu opći starter API-ji. Prilagodite neutralni ishod, ne cijelu poslovnu priču.

Nemojte tvrdnjama ponoviti svaki privatni korak. Refaktor treba smjeti promijeniti internu strukturu ako redoslijed nije ugovor. Kada je hydrate-prije-effecta ili lock-prije-odluke sigurnosno svojstvo, ciljano provjerite poredak i objasnite razlog.

## Pogreške i scenariji prihvaćanja

Namjerno odbijen write ne smije zadovoljiti uspjeh samo jer je promise završio. Stara ili zabranjena radnja ne smije ostaviti nedopušten učinak. Nepovezan vlasnik ostaje isti. Cleanup provjerite novom radnjom nakon disposal-a i odsutnošću učinka. Poruka neuspjeha treba imenovati granicu, ne nejasan snapshot.

Izvor testa opisuje namjeravani dokaz, a ne aktualno izvršenje. Kada je provjera odobrena, točno prijavite naredbe, rezultate, ograničenja i neizvršene slučajeve. Čitanje ne zamjenjuje izvršenje, a privremena zabrana pokretanja ne mijenja redovitu politiku repozitorija.

## Izbjegnite ove prečace

Nemojte provjeravati samo render, široku pogrešku, mock poziv kao bazu ni preslikavati implementaciju. Krenite od smislenog vanjskog invarianta i najbližeg zabranjenog ishoda.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/features/development-guide/contacts/api/contact.mutation.test.ts` — pozitivna i negativna ciljana invalidacija.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts` — nula slanja bez preduvjeta i različiti ugovori pogreške.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/SpecificationIntegrationTests.java` — trajna odsutnost, nepromjenjiv izlaz, privatnost i replay.
