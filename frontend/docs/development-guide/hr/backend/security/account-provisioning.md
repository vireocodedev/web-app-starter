# Lokalno stvaranje korisnika i jednokratni provisioning

**Status podrške: ugrađen obrazac predloška.** Predložak ima dvije namjerno različite putanje stvaranja korisnika: lokalnu razvojnu inicijalizaciju i eksplicitnu jednokratnu operatorsku naredbu. Nema javnu registraciju, administratorski životni ciklus računa, reset lozinke ni servis sinkronizacije korisnika.

Koristite ovaj obrazac pri pripremi prve prijave generiranog projekta, dijagnostici zašto promjena okruženja nije resetirala račun ili pregledu deployment bootstrapa. Stvaranje korisnika mijenja stanje: ponavljanje mora imati dokumentirano značenje i ne smije prešutno dobiti pravo promjene postojećeg identiteta.

## Vlasništvo i dvije ulazne točke

`LocalUserInitializer` radi pod `local & !provision-user`. Validirani `LocalUserProperties` dolaze iz `app.bootstrap-user` konfiguracije lokalnog profila. Lokalna skripta ekskluzivnim stvaranjem priprema ignoriranu datoteku okruženja s nasumičnim lozinkama; postojeću datoteku čuva. Skripte posjeduju pripremu, a initializer stvaranje identiteta koji nedostaje u bazi.

`ProvisionUserRunner` radi samo pod `provision-user`. Main metoda prepoznaje argument `--provision-user` bez vrijednosti, dodaje profil, pokreće aplikaciju i zatvara kontekst nakon runnera. Provisioning profil veže privremeni poslužitelj na loopback i privremeni port. To nije profil normalnog dugotrajnog servisa.

| Ponašanje                 | Lokalna inicijalizacija            | Jednokratni provisioning                                    |
| ------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| Okidač                    | Lokalni profil, bez provision-user | Eksplicitna zastavica bez vrijednosti i provisioning profil |
| Postojeće korisničko ime  | Bez promjena                       | Točno podudaranje aktivnog identiteta i lozinke             |
| Izvor pristupnih podataka | Ignorirana lokalna konfiguracija   | Zaštićeno operatorsko okruženje                             |
| Profil local              | Obvezan                            | Eksplicitno zabranjen                                       |
| Reset postojeće lozinke   | Nikada                             | Nikada                                                      |

Normalno pokretanje backenda ne stvara korisnika samo zato što postoje provisioning varijable. Zastavica i provjere runnera namjerne su zaštite koje automatizacija treba sačuvati.

## Validacija prethodi persistenciji

Obje putanje koriste ista ograničenja: korisničko ime nije prazno i ima najviše 100 znakova; email je neprazan, valjan i do 254 znaka; naziv za prikaz neprazan je i do 200 znakova; lozinka ima 12 do 72 znaka. Oba initializera dodatno odbijaju lozinke duže od 72 UTF-8 bajta. Drugi uvjet bitan je za BCrypt i ne-ASCII unos: broj znakova nije dovoljan.

```java
// Ugrađeno dodatno ograničenje; pri objašnjavanju greške ne logirati lozinku.
if (properties.password().getBytes(StandardCharsets.UTF_8).length > 72) {
    throw new IllegalStateException(
        "PROVISION_USER_PASSWORD must be at most 72 UTF-8 bytes.");
}
```

Provisioning runner skuplja Bean Validation povrede i izvještava samo sortirane nazive svojstava, bez poslanih vrijednosti. Istu suzdržanost zadržite u skriptama i izvještajima pogrešaka. Lozinke ne stavljajte u CLI argumente, workflow varijable, screenshotove, primjere vodiča ili logove naredbi.

Lozinke se pohranjuju preko konfiguriranog `PasswordEncoder`, trenutačno BCrypt s troškom 12. Konstruktor `AppUser` stvara UUID i aktivan račun. Naziv korisnika koji zvuči privilegirano ne stvara administratorske mogućnosti: ugrađeni sigurnosni adapter dodjeljuje `USER` i nema administratorsku domensku politiku.

## Idempotentnost je usporedba, ne ažuriranje

Jednokratni runner najprije traži korisničko ime. Postojeći račun mora biti aktivan, email i naziv za prikaz moraju se točno podudarati, a encoder mora potvrditi podudaranje lozinke sa spremljenim hashom. Tek tada prijavljuje uspješan no-op. Inače prekida bez promjene retka.

Novi BCrypt salt zato nije razlog ponovnog hashiranja ili pisanja postojećeg računa. Naredba također nije oporavak onemogućenog korisnika ili zaboravljene lozinke. Za to treba zasebno dizajniran i autoriziran tok oporavka. Lokalni initializer drukčije tretira ponavljanje: svako postojeće korisničko ime ostavlja nepromijenjeno bez usporedbe drugih polja. Dvije putanje nisu zamjenjive.

Transakcija runnera obuhvaća rad s bazom, ali slijed pronalaženja i stvaranja nije opći distribuirani provisioning lock. Konkurentni insert može dosegnuti ograničenje jedinstvenosti korisničkog imena. Dokumentirano operatorsko zaključavanje serializira namjeravani operativni postupak; nemojte proizvoljne konkurentne pozive predstavljati kao zajamčeno uspješnu idempotentnost.

## Operativni scenarij i oporavak

Operater priprema prvi račun novog okruženja kroz mjerodavnu release proceduru. Naredba koristi trenutačno deployed backend image digest, postojeću mrežu baze i zasebnu zaštićenu datoteku okruženja. Release vodič traži operatorski lock i svjež provjeren produkcijski backup, posebno zato što pokretanje aplikacije izvršava i Flyway migracije i Hibernate validaciju. Privremeni poslužitelj ne smije objaviti container port.

Pristupne podatke staginga i produkcije držite zasebno i ne montirajte ih u normalni servis. Ovaj članak nije autorizacija za provisioning okruženja, nego objašnjenje ugrađenog ugovora. Mjerodavna naredba i zaštite hosta ostaju u `infrastructure/release/README.md`.

Ako ponavljanje s promijenjenim nazivom ili lozinkom zakaže, ne brišite korisnika, ne slabite usporedbu i ne pretvarajte runner u upsert. Potvrdite namjeravano okruženje i korisničko ime bez otkrivanja vrijednosti, a stvarnu promjenu provedite autoriziranom putanjom upravljanja računima. Promjena lokalne datoteke nakon prvog pokretanja također ne mijenja postojeću korisničku lozinku ni postojeće pristupne podatke database containera.

## Kriteriji prihvata buduće implementacije

Ovim slučajevima definirajte granicu prihvata implementacije:

- Obično pokretanje ignorira provisioning vrijednosti i ne stvara produkcijskog korisnika.
- `--provision-user=value` odbija se; gola zastavica aktivira tok koji po uspjehu zatvara kontekst.
- Kombinacija s lokalnim profilom prekida prije promjene računa.
- Valjano nedostajuće ime stvara jedan aktivan BCrypt račun; plaintext ne dolazi u logove ili pohranu.
- Identično ponavljanje ne mijenja ništa; drukčiji identitet, lozinka ili onemogućen račun prekidaju bez promjene.
- Višebajtna lozinka preko 72 UTF-8 bajta odbija se i kad ima manje od 72 znaka.
- Lokalna inicijalizacija čuva postojeći račun, a setup skripta postojeću ignoriranu datoteku okruženja.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/BackendApplication.java` — validacija zastavice, aktivacija profila i zatvaranje konteksta.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/ProvisionUserRunner.java` — operatorska validacija i točno podudaranje pri ponavljanju.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java` — lokalni insert bez ažuriranja.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java` — zajednička validacija.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/scripts/setup-local.mjs` — ekskluzivno stvaranje datoteke okruženja.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md` — deployed-user provisioning i operativne zaštite.
