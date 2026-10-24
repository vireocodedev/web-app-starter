# Početni identitet provisioniraj zasebnom naredbom nakon deploymenta

Ovlašteni prvi račun stvori izričito nakon prihvaćenog backenda, bez pretvaranja svakog restarta u identity mutaciju. Provisioning ulazi moraju biti odvojeni od servisa, a ponavljanje mora čuvati postojeći račun.

**Ugrađeni obrazac predloška.** `BackendApplication`, `ProvisionUserRunner`, local-user properties i zaseban profil upravljaju ponašanjem. `infrastructure/release/README.md` upravlja operator postupkom s privatnim env ulazima i aktivnim backend digestom.

## Okidač, vlasnik i ugovor

Koristi kad deployano okruženje nema početni identitet i operater ima ovlast za stvaranje. Operater upravlja ulazima, okruženjem, aktivnom slikom i produkcijskim backupom. Backend vlasnik odgovara za validaciju, encoding i repeat pravila.

Ugovor je eksplicitno jednokratno stvaranje, ne startup seed ni password recovery. Normalni startup ne stvara račune, čak ni uz provisioning postavke. Isti repeat je no-op; konflikt je pogreška bez reseta, enablea ili updatea.

## Aktivacija izričitim flagom

Main parsira `--provision-user` kao flag bez vrijednosti. Dodaje profil `provision-user`, pokreće aplikaciju i zatvara context po završetku. Profil privremeni server veže samo na loopback i ephemeral port. Container port ne smije biti objavljen.

Runner također traži flag i odbija `local` profil. Lokalni seed ima drugi lifetime i vlasnika; nije produkcijski prečac.

```text
prihvaćeni deployani backend digest
              |
zaštićeni DB env + zaseban provisioning env
              |
--provision-user bez objavljenog porta
              |
Flyway + Hibernate -> identity transakcija -> izlaz
```

Startup naredbe može pokrenuti migracije prije identity logike. Koristi aktualni prihvaćeni digest i svježi provjereni produkcijski backup pod environment lockom. Novija neprihvaćena slika radi računa mogla bi izmijeniti shemu izvan namjeravanog releasea.

## Validacija bez objave ulaza

Nazivi su `PROVISION_USER_USERNAME`, `PROVISION_USER_EMAIL`, `PROVISION_USER_DISPLAY_NAME` i `PROVISION_USER_PASSWORD`. Vrijednosti idu u zasebni `0600` env ispod root-only direktorija, ne argv, Actions varijablu ili Git. Staging i produkcija imaju različite tajne.

Property validacija traži neprazne username/display name/password vrijednosti, valjani ograničeni email i lozinku od najmanje dvanaest znakova. Runner dodatno ograničava na 72 UTF-8 bajta jer znakovi nisu isto što i bajtovi. Pogreška navodi nazive fieldova, ne odbijenu tajnu.

Novi korisnik je enabled s BCrypt zapisom. Username koji zvuči administrativno ne uvodi administratorsku ulogu. Starter trenutačno dodjeljuje `USER`; buduće role i ovlasti trebaju zaseban domenski i sigurnosni ugovor.

## Ponovljeni poziv čuva identitet

| Postojeće stanje                                  | Rezultat                                    |
| ------------------------------------------------- | ------------------------------------------- |
| Username ne postoji, ulazi valjani                | Jedan enabled identitet s encoded lozinkom. |
| Enabled, isti email/display name i password match | Uspjeh bez promjena.                        |
| Drugi email ili display name                      | Pad bez updatea.                            |
| Druga lozinka                                     | Pad bez promjene hasha.                     |
| Disabled račun                                    | Pad bez ponovnog enablea.                   |
| Local profil aktivan                              | Odbij deployed provisioning.                |

Namjerno nije account maintenance. Izmijenjeni display name ili nova lozinka nisu idempotentni repeat. Budući management/recovery zahtjev treba vlastiti ovlašten tok.

Runner je transakcijski, ali nije opći paralelni provisioning API. Koristi dokumentirani environment/operator lock umjesto više istodobnih naredbi.

## Pravi dokaz za pravo okruženje

Image smoke provjerava prazan scratch user skup nakon običnog startupa, završetak naredbe, očuvan red nakon istog ponavljanja i pad password konflikta bez izmjene. To ne dokazuje stvarni račun u generiranom projektu.

Za post-deployment prihvat pregledaj privatni netajni rezultat i zasebno potvrdi stvarni HTTPS login/session/logout. Lozinke, BCrypt hashovi, cookieji, CSRF tokeni i korisnički redovi ne pripadaju chatu ili GitHub dokazu.

Normalni app container ne smije mountati provisioning env ni zadržati flag/profil. Restart mora ostati siguran bez stvaranja računa ili resetiranja tajni.

## Pogreške i odluke

| Opažanje                               | Odluka                                              |
| -------------------------------------- | --------------------------------------------------- |
| Postojeći identitet konfliktan         | Stani bez mutacije kroz provisioning.               |
| Traži se password reset                | Potreban je zaseban recovery tok.                   |
| Slika nije aktivni digest              | Prvo razriješi identitet i migracije.               |
| Normalni servis ima provisioning tajne | Odvoji lifetime i ulaze.                            |
| Command uspije, login ne               | Privatno pregledaj HTTPS/auth i odabrani identitet. |
| Admin naziv i dalje ima USER           | Ako treba, implementiraj stvarni authority model.   |

## Prihvat i inspekcija

Zabilježi okruženje, backend identitet, potreban backup, završetak naredbe i privatni login/session dokaz. Potvrdi odsutnost neželjenog updatea ili dodatnog dugotrajnog servisa.

Runbook upravlja stvarnim pozivom i zaštitama. Članak ne stvara račun, ne migrira bazu i ne prikazuje stvarne tajne.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/BackendApplication.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/ProvisionUserRunner.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application-provision-user.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
