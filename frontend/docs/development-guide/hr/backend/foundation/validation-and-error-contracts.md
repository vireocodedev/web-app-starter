# Validacija i javni ugovori pogrešaka

**Status podrške: ugrađena autentikacijska validacija i pogreške; referentni recept za širi domenski protokol.** Predložak ima Bean Validation, autentikacijski handler ograničen kontrolerom i Security filter handlere. Nema univerzalni oblik field-error odgovora, biblioteku iznimki s prijevodnim ključevima ni opću aplikacijsku ProblemDetail politiku.

Koristite ovaj obrazac pri definiranju request DTO-a, povezivanju forme s endpointom ili odluci kako frontend razlikuje nevaljan unos, isteklu autentikaciju i konflikt poslovnog stanja. Status, sigurni javni podaci i stabilno strojno značenje pripadaju ugovoru endpointa prije nego UI počne granati ponašanje prema pogreškama.

## Što predložak stvarno jamči

`AuthController.LoginRequest` request je record validiran s `@Valid @RequestBody`. Korisničko ime ne smije biti prazno i ima najviše 100 znakova; lozinka ne smije biti prazna i ima najviše 72 znaka. To je ugovor prijave, ne politika lozinke pri provisioningu: provisioning zasebno zahtijeva barem 12 znakova i izričito provjerava najviše 72 UTF-8 bajta za BCrypt. Anotacija broja znakova ne može osigurati granicu bajtova za ne-ASCII tekst.

Odgovor sesije zaseban je record s poljima `id`, `displayName` i `email`. Entitet i hash lozinke ne objavljuju se. Validacija zahtjeva također je odvojena od autorizacije: ispravan UUID ili valjan tekst ne daje pravo korištenja resursa.

| Ugrađena putanja obrade                   | Status | Javno tijelo                                           |
| ----------------------------------------- | ------ | ------------------------------------------------------ |
| Security authentication entry point       | 401    | `{"message":"Authentication required"}`                |
| Security access-denied handler            | 403    | `{"message":"Request not permitted"}`                  |
| AuthenticationException za AuthController | 401    | `{"message":"Invalid credentials or expired session"}` |

Posljednji handler ograničen je s `assignableTypes = AuthController.class`. Nije globalni handler budućih poslovnih kontrolera. Nedostajući CSRF token obrađuje Security i može vratiti access-denied odgovor prije kontrolera. Klijent zato ne smije svaki 403 smatrati dokazom nedostajuće domenske uloge.

Osnovna konfiguracija poslužitelja skriva poruke iznimki i stack trace u zadanim odgovorima. Framework obrada nevaljanog JSON-a ili Bean Validation pogrešaka ovdje nije ugrađena frontend-stabilna shema pogrešaka polja. Nemojte tvrditi da ti slučajevi već proizvode recept u nastavku.

## Namjerno definirajte protokol projekta

LMS daje usporedbu sa starijom implementacijom: njegov advice razlikuje validaciju tijela zahtjeva, constraint violations, zabranu pristupa i iznimku s prijevodnim ključem. `ErrorResponse` sadrži timestamp, status, error, message, path i opcionalni translationKey. To pokazuje središnju granicu prevođenja, ali payload i Spring API-je starog projekta ne treba kopirati kao da su ugrađeni u Boot 4 predložak. Prosljeđivanje proizvoljne poruke iznimke posebno nije opća politika javnih podataka.

Za novi domenski modul odaberite najmanji ugovor koji frontend može pouzdano koristiti. Slijedi **JSON recept, a ne trenutačni odgovor predloška**:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Some fields need attention",
  "fieldErrors": [{ "field": "displayName", "code": "REQUIRED" }],
  "requestId": "example-correlation-id"
}
```

Prije objave backend vlasnik mora implementirati DTO, ograničeno mapiranje putanja polja, prevođenje iznimki i izvor correlation ID-a. Frontend vlasnik mora implementirati tipizirani decoder, lokalizirano mapiranje kodova i fallback nepoznatih kodova. Bean Validation već postoji; zajednički registar kodova, globalni advice i tracing sustav ne nastaju samim ovim člankom. O ProblemDetailu odlučite zasebnim dizajnom; ne miješajte nepregledane formate odgovora po endpointima.

Strojni kodovi upravljaju ponašanjem, a lokalizirane frontend poruke prikazom. Poslužiteljska poruka može biti siguran fallback, ali UI ne treba parsirati englesku rečenicu kako bi razlikovao zastarjelu reviziju od validacije. Ne uključujte odbijene lozinke, credential zaglavlja, SQL, stack trace ili cijeli poslani payload. Metapodaci validacije moraju koristiti dopušteni skup polja i kodova.

## Cjelovit scenarij forme

Uređivač zapisa šalje naziv i očekivanu reviziju. Prazan naziv pogreška je zahtjeva; sintaktički ispravan naziv zabranjen trenutačnim domenskim stanjem poslovna je pogreška; starija revizija predstavlja konflikt. Forma zahtijeva različit oporavak:

| Pogreška                                 | Odluka ugovora projekta                         | Oporavak                                               |
| ---------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Nevaljan JSON ili polje                  | Obično 400 sa sigurnim strukturiranim detaljima | Sačuvati nacrt; označiti podržana polja                |
| Nedostajuća ili istekla autentikacija    | 401                                             | Ponovna prijava bez otkrivanja tajni                   |
| Autentikacija postoji, radnja zabranjena | 403 ili dokumentirano skrivanje resursa         | Objasniti granicu; bez slijepog ponavljanja            |
| Skriven ili nepostojeći resurs           | Dokumentirani 404                               | Sigurno napustiti uređivač; ne zaključivati postojanje |
| Zastarjela očekivana revizija            | 409                                             | Sačuvati nacrt; osvježiti i uskladiti                  |
| Neočekivani kvar poslužitelja            | Siguran 5xx                                     | Sačuvati nacrt; ograničen retry i korelacija           |

Ovo su preporučene odluke projekta, ne dokaz da predložak već implementira svaki red. Skrivanje resursa mora biti dosljedno u čitanju, pisanju i pogreškama. Utrka ograničenja jedinstvenosti također zahtijeva eksplicitno prevođenje ako odgovara korisničkom konfliktu; prethodna provjera ne jamči uspjeh uz konkurenciju.

## Kvar, oporavak i kriteriji prihvata

Handler koji hvata sve i vraća 200 uništava razliku uspjeha i neuspjeha. Handler koji vraća svaku poruku iznimke stvara nekontroliran informacijski kanal. Zadržite uska poznata prevođenja, sigurno ponašanje neočekivanih pogrešaka i internu dijagnostiku povezanu correlation identifikatorom kad projekt ima tu mogućnost.

Budući kriteriji prihvata, ovdje samo dokumentirani:

- Prazno korisničko ime odbija se prije autentikacije; pogrešni podaci daju kontrolirani odgovor.
- Nedostajući CSRF zaustavlja promjenu i ne prikazuje se kao obmanjujuća pogreška polja.
- Forma razlikuje 400, 401, 403 i konflikt revizije 409 te čuva nespremljeni rad.
- Ne-ASCII lozinke provisioninga provjeravaju se u UTF-8 bajtovima i znakovima.
- Neočekivana iznimka ne otkriva tajne, SQL ili stack trace.
- Nepoznat strojni kod prelazi na siguran lokaliziran fallback umjesto rušenja prikaza pogreške.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — validirani login record i session DTO.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java` — generički 401 ograničen kontrolerom.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — filter odgovori 401 i 403.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java` — ograničenja provisioning polja.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/RestResponseEntityExceptionHandler.java` — starija granica prevođenja pogrešaka.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/ErrorResponse.java` — stariji oblik odgovora, nije API predloška.
