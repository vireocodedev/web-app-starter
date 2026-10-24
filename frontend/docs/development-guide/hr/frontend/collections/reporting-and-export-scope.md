# Izvještajima i izvozu dajte isti izričit opseg podataka

Gumb Izvezi mora objasniti izvozi li vidljivu stranicu, odabrane zapise ili sva podudaranja trenutačnih filtara. Dijelite definicije podataka i formatiranja između ekrana i datoteke, uz prikladan zaseban raspored svakog renderera.

Ovo je **referentni recept** LMS izvještavanja. Kartica prima filtre, retke, stupce, opis razdoblja, stabilne ključeve i callback izvoza vlasnika. Zasebne PDF komponente prikazuju podatke. Ti povijesni helperi nisu ugrađeni starter API-ji, a kartica ne zaključuje opseg ni jamči poslužiteljski snimak.

## Okidač i vlasništvo

Vlasnika izvještaja koristite kada filtri, navigacija razdoblja, zbrojevi i datoteka opisuju jedan skup. On definira normalizirane filtre, vremensku zonu i identitet rezultata. Ekranska tablica upravlja interakcijama. Izvoz upravlja dopuštenim dohvatom, granicama, formatiranjem i preuzimanjem.

LMS kartica ima klijentsku paginaciju dobivenih redaka i prepušta izvoz `onExport`. Bez posebne odluke vlasnika onemogućuje ga za prazne podatke. To je granica prikaza, ne dokaz da se izvozi trenutačna stranica. Callback mora odabrati i imenovati stvarni opseg.

## Definirajte prenosiv zahtjev izvještaja

Ovo je **predloženi neutralni ugovor**, a ne ugrađeni API:

```ts
type ReportRequest = {
  workspaceId: string;
  period: { start: string; endExclusive: string; timeZone: string };
  filters: { status: "active" | "all" };
  scope: "all-matches" | "selected" | "current-page";
  selectedIds?: readonly string[];
};

// Normalizirajte jednom i isto značenje koristite za ekran i izvoz.
// Autorizacija i ograničen dohvat ostaju na poslužitelju.
```

Opis datuma ne dokazuje granice queryja. Izričito odredite uključivost, kalendarsko značenje i zonu. LMS PDF ima lokalne datumske helper funkcije; pokazuje zaseban prikaz, ne univerzalnu normalizaciju zona. Koristite aktualnu politiku aplikacije umjesto slučajnog ponašanja lokalnog preglednika.

Dijelite smisao stupaca, izračune, nazive i vrijednosti bez nužno istog React stabla. PDF paginacija i zaglavlja razlikuju se od responzivne tablice. Gdje odgovara koristite tekstualni izlaz umjesto screenshota koji gubi odabir teksta, strukturu i predvidljivu paginaciju. Ne obećavajte pristupačnost PDF-a bez implementacije.

| Opseg               | Potrebno ponašanje                               |
| ------------------- | ------------------------------------------------ |
| Trenutačna stranica | Izvesti upravo nju i imenovati opseg             |
| Odabrani zapisi     | Provjeriti opseg, uključujući više stranica      |
| Sva podudaranja     | Svi dopušteni rezultati uz izričite granice      |
| Povijesni snimak    | Dogovoreni nepromjenjivi identitet ili revizija  |
| Velik izvještaj     | Ograničen server job ili drugi namjerni protokol |

## Pogreške i oporavak

Pozadinsko osvježavanje može promijeniti rezultate tijekom pripreme. Odlučite predstavlja li izlaz zabilježen zahtjev, nepromjenjiv snimak ili stanje pri generiranju. Gdje treba sljedivost uključite razdoblje, filtre i metapodatke nastanka. Nemojte pomiješane revizije opisati kao točan snimak.

Priprema, prihvaćanje joba, generiranje i download različite su faze. Odgovor 202 nije dovršena datoteka. Neuspjelo preuzimanje ne znači nužno neuspjelo generiranje. Zadržite potvrđeni identitet joba ili rezultata kako ponavljanje ne bi stvaralo nepotrebne duplikate.

Server autorizira izvoz neovisno o vidljivosti ekrana. Ograničite broj redaka, memoriju, vrijeme i datoteku. Nazive i vrijednosti zaštitite prema formatu; CSV, spreadsheet i PDF imaju različita pravila tumačenja. Server filesystem putanja nije javna download referenca.

## Scenariji prihvaćanja

Izvezite filtriranu višestraničnu kolekciju: opseg i razdoblje odgovaraju nazivu. Odaberite retke kroz stranice: izlazi točan odabir. Promijenite filtre tijekom generiranja: rezultat i dalje identificira zabilježeni zahtjev. Bez podudaranja izvoz je onemogućen ili namjerno prazan prema politici. Izgubite download nakon završetka: oporavak koristi poznat rezultat. Opozovite ovlast: preuzimanje ponovno provjerava server. Ekranski i datotečni zbrojevi istog zahtjeva imaju jednake definicije.

Lokalizirajte naslov, razdoblje, opseg, napredak i pogreške. Ekranska tablica mora biti dostupna neovisno o datoteci. Radnja treba imenovati format i opseg bez skrivanja bitnog u tooltip.

## Izbjegnite ove prečace

Nemojte izvesti sva neimenovana data uz filtriranu stranicu, lokalizirane dvosmislene brojeve koristiti kao strojne vrijednosti, paginaciji slučajno prepustiti server opseg ni obećavati točne snimke nepovezanim čitanjima. Značenje izvještaja pripada vlasniku, prikaz se može razlikovati.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/statistics/components/StatisticsReportTableCard/StatisticsReportTableCard.tsx` — filtri, opis, identitet, klijentske stranice, delegirani izvoz i praznina.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/statistics/components/StatisticsDateNavigationButtons/StatisticsDateNavigationButtons.tsx` — zajednički prikaz vlasničke navigacije razdoblja.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/statistics/features/statisticsShiftComments/components/StatisticsShiftCommentsPdfDocument/StatisticsShiftCommentsPdfDocument.tsx` — zaseban PDF, podaci i prijevodi te lokalni format.
