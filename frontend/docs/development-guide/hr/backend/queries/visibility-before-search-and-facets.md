# Primijenite vidljivost prije pretrage, faceta i brojeva

**Status podrške: referentni recept potkrijepljen izvorom.** Client Discovery browse servis projicira dopuštene retke i redigira zaštićeni povezani identitet prije pretrage, brojanja, izrade opcija i paginacije. Predložak nema opći visibility-projection framework; projekt implementira vlastite ovlasti, upit i ugovor odgovora.

Koristite obrazac kad korisnik vidi zapis, ali ne svaki povezani identitet, ili lista nudi pretragu, dropdown filtre i ukupne brojeve. Uklanjanje privatnog polja tek pri serijalizaciji konačnog DTO-a ostavlja ranijim izračunima mogućnost neizravnog otkrivanja.

## Odvojite ovlast retka od vidljivosti polja

U pregledanom browse izvoru neadministratori najprije prolaze članstvo projekta. Zasebna current-profile-access projekcija određuje smije li se prikazati povezani identitet. Autorizirani red zato može ostati vidljiv uz uskraćen povezani profil. Autorizacija i projekcija odgovaraju na različita pitanja: koji redci pripadaju korisničkoj kolekciji i koje informacije smiju opisivati ili pretraživati te retke?

Servis gradi sljedeće faze:

```text
autorizirani redci
  -> projekcija povezanog identiteta prema ovlastima
  -> statusni i tekstualni filtri projiciranih polja
  -> predikat odabrane facete
  -> broj i stranica
```

Opcije facete dolaze iz iste dopuštene bazne projekcije uz eksplicitnu semantiku filtara. Ovdje opcije povezanog identiteta poštuju status i pretragu, ali namjerno izostavljaju trenutačno odabrani identity filtar kako bi alternative ostale dostupne. „Ista projekcija” ne znači da svaki metadata upit mora imati potpuno iste predikate.

## Stanjima odsutnosti dajte značenje

Discovery razlikuje WITHHELD, UNLINKED, UNAVAILABLE i LINKED. Tako „nije dopušteno znati”, „veza ne postoji” i „vezu trenutačno nije moguće razriješiti” ne postaju isto stanje. Samo dopušten povezani identitet svojim nazivom doprinosi tekstualnom podudaranju ili opcijama.

| Stanje      | Što UI smije zaključiti                          |
| ----------- | ------------------------------------------------ |
| WITHHELD    | Projekcija namjerno ne objavljuje identitet      |
| UNLINKED    | Prema ugovoru nije povezan identitet             |
| UNAVAILABLE | Veza trenutačno ne daje uporabljiv profil        |
| LINKED      | Dopuštena polja i verzija identiteta dostupni su |

Nemojte „radi praktičnosti” vraćati uskraćeni raw ID, privatni naziv ili dijagnostički razlog. Mogu procuriti kroz URL, filter vrijednost, command palette ili telemetriju i kad je ćelija tablice redigirana.

## Praktičan recept projekcije

Korisnici pregledavaju dopuštene workspace zapise, ali samo neki vide povezani party naziv. Slijedi **SQL pseudokod**, ne ugrađena migracija ili upit. Projekt implementira članstvo/current-grant politiku, tablice, projekcijski DTO, binding i indekse.

```sql
WITH authorized AS (
    SELECT r.*, permission.may_view_party
    FROM record r
    JOIN permitted_record_for_actor permission ON permission.record_id = r.id
    WHERE permission.actor_id = ?
), visible AS (
    SELECT id, title,
           CASE WHEN may_view_party THEN party_label END AS party_label
    FROM authorized
), filtered AS (
    SELECT * FROM visible
    WHERE position(lower(?) in lower(title)) > 0
       OR position(lower(?) in lower(party_label)) > 0
)
SELECT id, title, party_label
FROM filtered
ORDER BY id
LIMIT ?;
```

Ključan je redoslijed: projekcija prije podudaranja. Predikat nad neredigiranom party tablicom uz kasnije skrivanje rezultata dopušta pogađanje privatnog naziva i opažanje pogotka. Brojanje skrivenog pogotka ili njegova ponuda kao facete isto je otkrivanje.

Sve caller vrijednosti u izvornom browse upitu bindaju se placeholderima. Strukturne klauzule bira poslužitelj iz provjerenih stanja, ne preuzima caller SQL fragment. Smjer i stupac sortiranja zahtijevaju zaseban allowlist; bindanje search vrijednosti ne osigurava proizvoljnu konkatenaciju SQL-a.

## Čitanje neka bude read-only i po značenju

Browse servis izričito je projekcija: ne inicijalizira nedostajuće lifecycle zapise radi lakšeg prikaza. Posjet stranici ne treba stvarati identitet, članstvo ili domenski prijelaz. Legitimni nedostatak predstavite stanjem, a potrebni popravak izdvojenom autoriziranom naredbom.

Kontroler postavlja `Cache-Control: no-store` prije validacije filtara i poziva servisa, pa kvarovi dosegnuti tom putanjom dijele cache politiku. To je izvorna zaštita identity-bearing odgovora, ne zamjena cache pravilima ostalih endpointa ili backend autorizaciji.

## Kvar i oporavak

Nakon opoziva sljedeća projekcija mora koristiti trenutačni ugovor ovlasti. Cacheirane opcije, brojevi i row snapshotovi ne smiju oglašavati stari privatni identitet. Neuspjeli lookup treba sačuvati razliku UNAVAILABLE i WITHHELD umjesto izmišljanja praznog povezanog naziva.

Opasan anti-pattern je „dohvati sve, paginiraj pa filtriraj neovlaštene retke”. Otkriva count/facete i daje nepotpune stranice. Drugi je zaseban count SQL koji s vremenom odstupi od row vidljivosti. Dijelite dopuštenu baznu projekciju i namjerne facet iznimke jasno pokažite u kodu i dokumentaciji.

## Kriteriji za buduću implementaciju

- Skriven povezani naziv ne uzrokuje search pogodak, opciju ili promjenu broja.
- Autorizirani red ostaje dostupan uz ugovorena withheld/unlinked/unavailable stanja.
- Redci, total i opcije imaju istu politiku vidljivosti; namjerne razlike predikata eksplicitne su.
- Tekst i ID-jevi bindani su parametri; strukturu bira server allowlist.
- Pregledavanje ne stvara ni popravlja domensko stanje.
- Opoziv uklanja privatne informacije iz sljedećeg odgovora i metapodataka, ne samo ćelija.
- Pogreške i cache ponašanje ne otkrivaju privatni identitet.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseService.java` — faze authorized/projected/base-filtered, povezana vidljivost, binding i semantika opcija/broja/stranice.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseController.java` — no-store prije validacije i poziva servisa.
