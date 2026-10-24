# Pošalji šifrirani ticket fiksnom pouzdanom host kodu

Release runner može zatražiti usku deployment operaciju bez SSH ključa ili host Docker socketa. Host neovisno autentificira zahtjev i izvršava instalirani pregledani kod, ne naredbe iz artefakta.

**Ugrađeni obrazac predloška.** Handoff pripada `infrastructure/release/client.py`, `protocol.py` i `controller.py`. Instalacija i aktivacija ostaju u `infrastructure/release/README.md` i `install.py`. Članak ne daje niti izvršava deployment ovlast.

## Okidač, vlasnik i ugovor

Primijeni pri promjeni transporta, tokena, artifact downloada ili controller validacije. Release održavatelj upravlja pregledanim workflow/client bajtovima. Operater upravlja instaliranim kodom, pinovima, privatnim ključem, dopuštenim identitetima i host konfiguracijom.

Ugovor je šifrirani ticket fiksne sheme, bez proizvoljnih host naredbi. Javni certifikat može u Actions varijablu. Privatni ključ i trajna App vjerodajnica ostaju na zaštićenom hostu. Kratkotrajni request token prihvatljiv je samo unutar neovisno validiranog konteksta.

## Identitet prije runner oznake

Client validira immutable par prema odabranom repozitoriju i SHA. Stvara GitHub Deployment za točan source/environment uz isključen auto-merge. Payload veže run, attempt, par i staging origin kod promocije.

Ticket dodaje environment, Deployment ID i token request posla. Konceptualna polja su:

```text
run_id, run_attempt, environment, deployment_id,
pair, staging_run_id, token
```

To nije primjer s tajnim vrijednostima. Stvarni decoder odbija nepoznata polja i ponovljene JSON ključeve. Oznaka runnera ili zeleni build ne autoriziraju ticket.

OpenSSL CMS koristi AES-256-GCM i RSA-OAEP/SHA-256 prema instaliranom javnom certifikatu. Upload sadrži samo `request.cms` ciphertext. Plaintext token ne smije u log, sliku, chat, Git ili dodatni nešifrirani artefakt.

## Transport provjeri prije sadržaja

Host reader otkriva zahtjeve repository-scoped Actions-read installation tokenom. On je odvojen od request tokena za package pull i Deployment status. Controller ne proširuje CI App ovlasti kako bi PR poslovi dobili host pristup.

Download ograničava inventar, odbija nepostojeći, dvosmislen, istekao ili prevelik artefakt, provjerava digest arhive i traži točno jednog očekivanog člana. Potpisani URL mora biti HTTPS na dopuštenoj storage domeni, bez user/password dijela i neočekivanog porta. GitHub Authorization ne prosljeđuje se na storage.

Decryption nije autorizacija: svatko s javnim certifikatom može stvoriti ciphertext. Dekodirani sadržaj i dalje prolazi neovisne provjere.

## Autentificiraj stvarni aktivni zahtjev

| Sloj        | Ugovor                                                              |
| ----------- | ------------------------------------------------------------------- |
| Run         | Aktivni manual dispatch, dopuštena starost, točan SHA i attempt.    |
| Repozitorij | Točan zaštićeni numerički identitet, privatnost i head repozitorij. |
| Akteri      | Originalni i triggering actor su dopušteni.                         |
| Workflow    | Očekivani ID/putanja i instalirani hash pouzdanih bajtova.          |
| Deployment  | Točan source/environment/payload i Actions creator.                 |
| Job         | Točno jedan aktivni request posao očekivanog naziva.                |
| Promocija   | Uspješni staging workflow i trajni host receipt identičnog para.    |

Pinovi pokrivaju workflow, client, protocol, smoke i kanonski App transport. Branch može mijenjati aplikaciju, ne tiho zamijeniti privilegirani handoff. Pregledani host update odvojen je od aplikacijskog pusha.

## Fiksno izvršavanje i stvarni rezultat

Nakon provjere identiteta i payloada ticketa controller zapisuje zaštićeni journal u stanju `validating`. Zatim provjerava hash pouzdanog izvora, stvarno aktivni request posao i, za promociju, staging workflow/host receipt. Tek nakon uspjeha tih provjera zapisuje `started` i poziva instalirani runtime. Samo postojanje journala zato ne dokazuje potpunu autorizaciju ni pokretanje runtimea. Artefakt ne može zadati shell, Compose, mount, executable putanju ili host postavku. Servisi nastaju iz zaštićene konfiguracije pod environment lockom.

Client čeka završni Deployment rezultat dok token vrijedi. Timeout je moguć nakon mutacije pa prije retrya treba pregledati journal i stvarne slike. Produkcija traži staging prihvat, ne samo registry objavu.

## Pogreške i odluke

| Opažanje                                | Odluka                                             |
| --------------------------------------- | -------------------------------------------------- |
| Decryption prolazi, akter nije dopušten | Odbij; šifriranje ne daje ovlast.                  |
| Naziv odgovara, digest/član ne          | Odbij transport bez proizvoljnog extracta.         |
| Branch mijenja source pin               | Potreban je pregledani operator update.            |
| Request job više nije aktivan           | Odbij zastarjelu ovlast i istraži ranije mutacije. |
| Artefakt šalje host naredbe             | Odbij; podržana je samo fiksna shema.              |
| Wait padne nakon mogućeg deploya        | Uskladi stanje prije novog zahtjeva.               |

## Prihvat i inspekcija

Provjeri ciphertext-only artefakte, privatne putanje ključa, odvojene tokene i header izolaciju downloada. Identitet run/attempt/joba i repozitorija mora se provjeravati, ne zaključivati iz labela.

Za stvarni prihvat zadrži netajni source/run/attempt/pair i host rezultat. Plaintext ticket ne pripada javnom dokazu. Setup ostaje u runbooku; članak ne šalje zahtjev niti mijenja host.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/install.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-staging.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-production.yaml`
