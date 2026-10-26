# Vlasništvo nad runtimeom i konfiguracijom

**Status podrške: ugrađen obrazac predloška.** Primjeri opisuju trenutačnu konfiguraciju predloška: Java 21, Spring Boot 4.1.1 i PostgreSQL. Generirani projekt prije prilagodbe mora provjeriti vlastiti build; ovisnosti drugog projekta ne postaju dostupne samim navođenjem njegova koda u vodiču.

Ovaj obrazac koristite pri dodavanju backend mogućnosti, dijagnostici pokretanja ovisnog o profilu ili odluci pripada li postavka izvornom kodu, lokalnom razvoju ili deployment okruženju. Konfiguracija je dio ugovora aplikacije: nova postavka zahtijeva vlasnika, ponašanje pri nedostatku vrijednosti i odgovarajuću promjenu deploymenta.

## Build i aplikacija imaju različite odgovornosti

`backend/build.gradle` odabire Javu 21 toolchainom i deklarira Spring Boot 4.1.1. Ugrađene mogućnosti uključuju WebMVC, Bean Validation, Security, JPA, Flyway, JDBC Spring Session, Actuator i PostgreSQL driver. Gradle verziju određuje wrapper. MapStruct, Lombok, MQTT ili drugi JSON paket iz susjednog projekta ovdje nisu automatski dostupni.

Osnovni `application.yaml` određuje zajedničko ponašanje deployment okruženja. Lokacija i pristup bazi dolaze preko `DATABASE_URL`, `DATABASE_USERNAME` i `DATABASE_PASSWORD`. `SERVER_PORT` ima zadanu vrijednost 8080. Nazivi tih varijabli ugovor su s operaterom; novi naziv mora dobiti upute u mjerodavnom runbooku, a ne ostati neobjašnjena ovisnost o okruženju.

Servlet kontekst je `/api`. Mapiranja kontrolera relativna su prema tom kontekstu:

```java
// Oblik ugrađenog mapiranja; javni URL je GET /api/auth/session.
@RestController
@RequestMapping("/auth")
class AuthController {
    @GetMapping("/session")
    public SessionUser session(Authentication authentication) {
        // Predložak dohvaća aktivnog korisnika i vraća javni DTO.
    }
}
```

Isječak prikazuje samo mapiranje; skraćeno tijelo nije zamjenska implementacija. Dodavanje `/api` u `@RequestMapping` udvostručilo bi prefiks. Proxy i frontend konfiguracija API-ja moraju odgovarati vanjskom URL-u bez slučajne promjene ugovora kontrolera.

## Profil sužava ponašanje određenog okruženja

Profil `local` opcionalno učitava `.env` kao properties datoteku, veže poslužitelj na loopback, gradi JDBC URL iz lokalnih PostgreSQL varijabli i dopušta cookie bez oznake secure za lokalni HTTP. Osnovni cookie ostaje HTTP-only, secure i SameSite=Lax. Kopiranje lokalne iznimke u osnovnu konfiguraciju slabi sva deployment okruženja i ne rješava pogrešan proxy ili HTTPS postavke.

Profil `provision-user` koristi loopback i privremeni port. Njegov runner ima dodatne eksplicitne zaštite i ne smije se kombinirati s profilom `local`. Profil je zato granica dopuštenih mogućnosti, a ne samo praktičan skup razvojnih postavki.

| Područje                                | Vlasnik                              | Posljedica promjene                                          |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Java i ovisnosti                        | Build i wrapper                      | Provjeriti kompatibilnost i kompilaciju projekta             |
| Zajednička pravila sigurnosti i pohrane | Osnovna konfiguracija                | Razmotriti sva deployment okruženja                          |
| Lokalna baza i početni korisnik         | Skripte za pripremu i lokalni profil | Sačuvati postojeću ignoriranu datoteku okruženja             |
| Produkcijske tajne                      | Deployment okruženje                 | Koristiti odobreni mehanizam tajni; ne commitati vrijednosti |
| Novi preduvjet projekta                 | Runbook za postavljanje              | Zajedno dokumentirati unos, zaštite i provjeru               |

Za lokalno postavljanje slijedite workspace `README.md` i povezani runbook inicijalizacije. Oni su vlasnici naredbi i pripreme pristupnih podataka. Članak vodiča ne treba postati druga, različita procedura provisioninga.

## Persistencija i dijagnostika imaju namjerne granice

Hibernate koristi `ddl-auto: validate`, a Flyway mijenja shemu. `open-in-view: false` sprječava da web sloj postane implicitna persistence sesija. Ako novi odgovor zahtijeva povezane podatke, treba ih dohvatiti i mapirati unutar eksplicitne aplikacijske granice. Uključivanje `update` ili Open Session in View skriva problem migracije ili dizajna upita.

Inicijalizacija JDBC session sheme postavljena je na `never`, jer i tim tablicama upravlja Flyway. Trajanje sesije je 30 minuta. Actuator objavljuje samo `health` bez detalja. Zadani odgovori poslužitelja skrivaju poruke iznimki i stack trace. Ove postavke ne zamjenjuju internu dijagnostiku; sprječavaju objavu internih detalja kroz javni API.

## Scenarij kvara i oporavka

Generirana aplikacija lokalno se pokreće, ali deployment javlja neusklađenost sheme. Najprije razdvojite povezivanje s bazom, izvršavanje migracija i slaganje entiteta sa shemom. Provjerite aktivni profil i postojanje potrebnih naziva varijabli bez ispisivanja vrijednosti. Pogrešku migracije i deployment logove pregledajte odobrenim operativnim putem. Nedostajuću migraciju ili pogrešan entitet ispravite u izvornom kodu; automatski DDL nije prečac za oporavak.

Ako preglednik na deployment HTTP-u ne zadržava sesiju, problem je transport ili konfiguracija: secure cookie očekuje HTTPS. Popravite odobrenu HTTPS/proxy putanju umjesto isključivanja produkcijske zaštite. Sukob lokalnog porta pripada pripremi baze, ne autentikaciji ili mapiranju entiteta.

## Kriteriji prihvata buduće implementacije

Ovo su očekivanja za budući pregled, a ne upute za trenutačno pokretanje testova.

- Javni `/api/auth/session` prolazi kroz mapiranje `/auth/session` uz točno jedan prefiks.
- Nedostatak obvezne postavke baze jasno prekida pokretanje bez otkrivanja njezine vrijednosti.
- Flyway priprema novu bazu prije Hibernate validacije; nekompatibilna shema ne prepisuje se prešutno.
- Lokalni HTTP koristi usku lokalnu iznimku, a osnovna konfiguracija zadržava secure cookie.
- Nova konfiguracijska ovisnost ima izvorni kod i pripadajuće upute u mjerodavnom runbooku projekta.
- Health i redoviti odgovori o pogreškama ne otkrivaju podatke baze, tajne ili stack trace.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — runtime i ugrađene ovisnosti.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml` — zajednička pravila persistencije, konteksta, cookieja i dijagnostike.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application-local.yaml` — lokalne varijable i HTTP iznimka.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application-provision-user.yaml` — povezivanje jednokratnog provisioninga.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:README.md` — mjerodavan ulaz za lokalni razvoj.
