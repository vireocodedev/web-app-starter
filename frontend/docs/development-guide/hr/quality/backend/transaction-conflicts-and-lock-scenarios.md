# Dokažite serijalizaciju sukobljenih naredbi oko zajedničkog invarianta

Dvije zasebno valjane naredbe mogu u utrci prekršiti pravilo. Scenarij treba uspostaviti preklapanje transakcija, kontrolirati prvi commit i provjeriti dopušten ishod i trajnu odsutnost zabranjenog. Dvije pokrenute dretve bez rasporeda slab su dokaz.

Ovo je **potrošački referentni obrazac** CDA PostgreSQL testova. Oni zovu stvarne Spring servise te TransactionTemplateom i latchovima kontroliraju utrku kontakta. To je service/database granica, ne HTTP security-filter scenarij. Testovi su pročitani, ne izvršeni za članak.

## Okidač i vlasništvo

Koristite za zajedničke kvote, vlasništvo, ovlasti, revizije, potvrde i invariante više vlasnika naredbi. Produkcijski servisi posjeduju lock i autorizaciju. Test sudionike, neovisne dretve, barijere, ograničena čekanja i sigurno oslobađanje.

Fixture gradi sintetičke aktere, povezane projekte, dokaze i stvarne servisne prijelaze. Relevantno zaključano stanje ne preskače umetanjem lažnog završnog retka. Velik produktni fixture nije starter API; pripremite samo legitimne preduvjete neutralnog invarianta.

## Zadržite transakciju promjene

Ovo je **neizvršeni raspored**, a ne ugrađeni helper:

```text
writer transakcija:
  promijeniti zajednički kontakt
  signalizirati "promjena pripremljena"
  čekati "dopusti commit"

test:
  čekati pripremu
  pokrenuti naredbu ovisnu o aktualnom kontaktu
  opažati nedovršenost unutar ograničenog intervala
  otpustiti commit u finally
  čekati oba radnika
  provjeriti aktualnu ovlast i odsutnost zabranjenog retka
```

CDA mijenja korisnika kontakta kroz drugi projekt iste stranke dok točan review ovisi o kontaktu. Writer ostaje otvoren u TransactionTemplateu. Nakon otpuštanja review dobiva 403, a broj njegovih redaka ostaje nula. To pokazuje poslovnu posljedicu zajedničke serijalizacije.

Nedovršeni future unutar kratkog intervala nije sam dokaz database locka; raspoređivanje dretve također može kasniti. Za jači dokaz dodajte signal da je sudionik počeo ili promatranje DB čekanja prema namjernom dizajnu. Timeout tvrdnju nemojte preuveličati kao potpun dokaz locka.

## Provjerite staru namjeru i trajne činjenice

| Scenarij                             | Ugovor                  | Dodatni dokaz                          |
| ------------------------------------ | ----------------------- | -------------------------------------- |
| Stara revizija ili token             | Odbijanje               | Nema nedopuštene promjene ili potvrde  |
| Ovlast promijenjena prije nastavka   | Aktualna provjera       | Zabranjeni redak ne postoji            |
| Isti zahtjev ponovno                 | Dokumentirani replay    | Jedan poslovni učinak                  |
| Isti ID, drugi sadržaj ili namespace | Sukob                   | Stara potvrda nepromijenjena           |
| Konkurentske naredbe dijele kvotu    | Invariant ostaje        | Završni broj ili ukupno unutar pravila |
| Neuspjeli sudionik                   | Oslobađanje i završetak | Bez skrivene otvorene transakcije      |

Suite ima replay, namespace sukob, stare i tuđe tokene te nepromjenjive bajtove uz utrku kontakta. Kvota je proširenje dizajna za feature koji je ima, ne tvrdnja da ta datoteka pokriva sve kvote.

Status nije dovoljan kada su djelomični upisi štetni. Provjerite autoritativne retke, potvrde, audit, bajtove ili zbrojeve atomske naredbe. SQL broj istodobno ne dokazuje javni odgovor; za to koristite HTTP granicu.

## Pogreške i čišćenje

Otpustite latch u `finally`, ograničite svaki wait i future te završite executor i pri pogrešci. Izbjegnite testnu transakciju koja skriva commit među vezama. Radnik treba proći stvarni transakcijski servis, ne zaobići Spring proxy.

Scenarij dokazuje svoj raspored i invariant, ne sve deadlockove, opterećenje, lock redoslijede ni anomalije izolacije. Prema riziku dodajte obrnuti redoslijed i rollback. Nemojte radi fixturea slabiti domensku politiku ili isključiti autorizaciju.

## Scenariji prihvaćanja

Ovisna naredba ne smije potvrditi staru ovlast kroz prijelaz s kojim se mora serijalizirati. Nakon commita koristi se aktualna odluka i nema zabranjenog efekta. Isti replay ne duplicira; promijenjen zahtjev ne kvari potvrdu. Pogreška oslobađa sve sudionike. Uklonjen produkcijski lock treba otkriti scenarij, umjesto slučajnog sekvencijalnog prolaza.

## Izbjegnite ove prečace

Nemojte koristiti spavanje, dvije brze predaje radnika, mock repozitorije, samo status ni transakcije koje ne commitaju izvan testne dretve. Kontrolirajte preklapanje i stvarni invariant.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/SpecificationIntegrationTests.java` — utrka kontakta, trajna zabrana, tokeni, replay i receipt sukob.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/LC03IntegrationSupport.java` — Spring/PostgreSQL fixture, sintetički identiteti i servisni preduvjeti.
