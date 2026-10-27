# Veži obvezni status uz politiku koja ga je proizvela

Spajanje mora ovisiti o određenoj pouzdanoj provjeri i aktualnom kandidatu, ne samo o zelenom statusu poznatog naziva. Workflow i zaštita repozitorija zasebni su vlasnici s povezanim dokazima.

**Ugrađeni obrazac predloška.** Politika je u `docs/template-initialization/github-ci.md`; rezultat proizvode `infrastructure/ci/ci_scope.py` i `.github/workflows/ci.yml`. Svaki novi projekt mora postaviti i provjeriti vlastitu zaštitu. Stvaranje iz predloška ne kopira udaljene postavke grane.

## Okidač, vlasnik i ugovor

Primijeni pri aktivaciji projekta, promjeni naziva obveznih provjera, selektora poslova ili dijagnostici PR-a koji se može spojiti bez očekivanih dokaza. Održavatelj upravlja gate implementacijom. Administrator upravlja efektivnom zaštitom i kompatibilnim organizacijskim pravilima. Registracija runnera ostaje operaterska odgovornost.

Ugovor je stroži od tvrdnje da nijedan posao nije pao. Klasifikacija mora uspjeti. Svaki odabrani posao mora uspjeti, a svaki neodabrani mora biti preskočen. Failure, cancelled, nedostajući rezultat i neočekivano izvršavanje različita su stanja. Gate odbija ono koje ne odgovara politici.

## Jedna obvezna provjera, izričite unutarnje obveze

`CI gate` koristi `if: always()` i ovisi o klasifikaciji te svim aplikacijskim/foundation poslovima. Zato izvijesti i nakon pada ranije ovisnosti. Filtri na razini cijelog workflowa ne smiju spriječiti nastanak jedinog obveznog statusa.

Helper validira booleove izlaze prije određivanja očekivanog ishoda za svakog vlasnika. Workflow zatim provjerava shard izvješća vezana uz source/run/attempt odabranih aplikacija. Zelena testna matrica nije dovoljna ako dokaz članstva nedostaje ili potječe iz drugog pokušaja.

```text
pouzdani workflow + točan kandidat
               |
      odabrani poslovi i dokazi
               |
        CI gate check-run
               |
     obvezni context + izvorni App
               |
      efektivna zaštita grane
```

Proizvođač statusa i odluka o spajanju različiti su slojevi. Source promjena ne ažurira automatski zaštitu ni host registracije.

## Identitet nije samo tekst naziva

Pročitaj stvarni check-run workflowa. Zabilježi opaženi naziv i source App te taj identitet zahtijevaj u zaštiti. Sam tekst `CI gate` može ostaviti nejasnim koja je integracija proizvela status. U novi projekt ne kopiraj numeričke App ili repository ID-eve predloška.

Odabrana politika traži PR, uspješni gate vezan uz GitHub Actions, ažuriranu granu, primjenu i na administratore te zabranu force pusha i brisanja. Predložak ima nula obveznih approving reviewa i ne zahtijeva code-owner ili last-push approval. To je njegova politika, ne ovlast za slabljenje strožeg kompatibilnog organizacijskog pravila.

Ažurnost je važna jer zeleni rezultat na staroj bazi nije dokaz aktualnog integracijskog kandidata. Pregledaj točan checkout i event usporedbu; naziv grane nije nepromjenjivi identitet.

## Postavljanje i read-back nisu isto

Za ovlaštenu aktivaciju prvo dokaži stvarni uspješni CI i pročitaj identitet provjere. Zatim konfiguriraj zaštitu odobrenim administratorskim postupkom. Na kraju pročitaj efektivnu politiku, uključujući naslijeđena pravila i ponašanje prema administratorima.

Kontrolirani bezazleni PR može pokazati da neuspjeli ili nedostajući dokaz blokira merge, a popravljeni dokaz dopušta merge uz željeni prag reviewa. Ne spajaj neuspjeli fixture i ne uklanjaj obvezne provjere da bi prihvat izgledao uspješno. To su radnje samo za zasebno ovlašten zadatak; članak ih ne izvršava.

Ograničenje privatnog plana i konflikt naslijeđenih pravila nalaz su za prijaviti. Objavljivanje privatnog repozitorija, bypass ili uklanjanje provjera nisu prihvatljivi prečaci.

## Pogreške i odluke

| Opažanje                                  | Tumačenje i odluka                                                 |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Naziv je ispravan, source App nije        | Provjeri vezivanje izvora prije prihvata statusa.                  |
| Dokumentacijski PR čeka gate              | Pregledaj triggere i always-reporting ugovor, ne uklanjaj zaštitu. |
| Posao je otkazan, aggregate zelen         | Provjeri točna očekivana stanja; implementacija gatea je preslaba. |
| PR baza promijenjena nakon zelenog CI-ja  | Zahtijevaj dokaz za aktualnog kandidata.                           |
| Novi projekt dopušta izravni push na main | Pravila nisu naslijeđena; administrator treba postaviti zaštitu.   |
| Organizacija traži više reviewa           | Sačuvaj strožu kompatibilnu politiku i opiši stvarni konflikt.     |

## Prihvat i inspekcija

Pregledaj stvarni naziv/izvor provjere, selekciju i preskakanja, dokaz trenutnog attempta, required contexte i ažurnost grane. Read-backom potvrdi primjenu na administratore te zabranu force pusha i brisanja. Slika namjeravanih postavki nije dovoljna.

Zabilježi repozitorij, reviziju, run i opaženu politiku bez tokena i bez pretvaranja numeričkih identiteta u opće zadane vrijednosti. Povijesni prihvat vrijedi za taj repozitorij. Povezane teme su **Odabir provjera prema vlasniku** i **Dokaz shardova**; stvarni aktivacijski postupak ostaje u `docs/template-initialization/github-ci.md`.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci_scope.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
