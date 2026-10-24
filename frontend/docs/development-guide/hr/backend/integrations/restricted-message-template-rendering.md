# Renderiraj mali allowlisted plain-text jezik

Reviewed tekst ne treba expression evaluaciju, rekurziju ni implicitni HTML. Točan template/body identitet omogućuje da naknadni dokaz opisuje stvarno proizvedene bajtove.

**Source-backed reference recept.** `ServiceNoticeService` iz Client Discoveryja ima ograničeni interpolator, strict template UTF-8 i retained artefakte. Nije opći engine ni starter API. Varijable i limite potrošač definira izričito.

## Okidač, vlasnik i ugovor

Koristi kad odobreni template dobiva immutable resource činjenice. Template owner određuje jezik/plain-text, resource owner vrijednosti, intent owner čuva digest i primatelja.

Ugovor je poznati `{{name}}`, prisutna vrijednost, jedan prolaz i plain text. Markup ne pretvara body u izvršivi sadržaj.

## Stvarna gramatika

Placeholder počinje ASCII slovom i nastavlja alfanumerički. Ime mora biti u fiksnom allowlistu i vrijednost nonnull. Neparne zagrade u literalima odbijaju se; nema expressiona, nested struktura ili property traversala.

Neutralni primjer sa source imenima:

```text
Resource: {{serviceTitle}}
Window: {{periodStartOn}} to {{periodEndExclusiveOn}}
Reference: {{packageDigest}}
```

To nije univerzalni DTO. Vrijednosti ovise o intent kindu. Missing period nije tihi prazni string.

| Input                             | Odluka                     |
| --------------------------------- | -------------------------- |
| Poznat placeholder/value          | Jednom zamijeni.           |
| Nepoznat ili missing              | Odbij.                     |
| Neparna brace/expression sintaksa | Nepodržano.                |
| Value s `{{` ili `}}`             | Odbij, ne rekurziraj.      |
| Template s tag-shaped `<...>`     | Uski regex odbija.         |
| Template control osim CR/LF/tab   | Codepoint provjera odbija. |

Matcher čita originalni template. Value se ne izvršava kao novi program. To je nonrecursive substitution, ne escaping.

## Decode, sadržaj i prikaz odvojeno

Template UTF-8 koristi REPORT za malformed/unmappable. To je jače od operator-file replacement konverzije; nije svaka source tekstna putanja jednaka.

Regex nije HTML sanitizer. Provjerava template, ne svaki value, i ne dopušta unsafe HTML sink. Control provjera također vrijedi za template; vrijednosti trebaju vlastitu validaciju.

Spremi/posluži plain text i koristi text-safe UI. Body nije automatski siguran HTML, mail header, URL, shell ili SQL. Content type ne popravlja kasniji unsafe renderer.

## Resursi i točni artefakti

Source odbija finalni body preko 10 MiB UTF-8 bajtova nakon sastavljanja i enkodiranja stringa. To nije streaming allocation limit ni neovisni bound svih vrijednosti.

Adaptation treba unaprijed/tijekom rada ograničiti template/value bytes, broj i ukupni rad. Finalna granica ne dokazuje zaštitu od svakog memory/CPU inputa.

Intent uzima reviewed template/digest, renderira odabrane činjenice i sprema `text/plain` body. Retained notice veže template/message, package/version, locale i route. Delivery koristi te bytes bez rerendera novim podacima.

## Pogreške i odluke

| Opažanje                 | Odluka                              |
| ------------------------ | ----------------------------------- |
| Nova varijabla           | Review allowlista i value izvora.   |
| Missing mijenja značenje | Fail prije intenta.                 |
| Markup/control u valueu  | Value policy i text-safe sink.      |
| Prevelik body            | Odbij bez tihog truncatea.          |
| Činjenice naknadno druge | Novi reviewed intent.               |
| Treba rich HTML          | Zaseban renderer/security contract. |

## Prilagodba i prihvat

Treba UTF-8, value validacija, preconstruction limit, immutable storage, locale i safe sink. Pregledaj unknown/missing/brace, nonrecursive value, byte boundary i digest.

Neovisan security/source review prije integracije. Članak ne renderira niti šalje stvarnu poruku.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java`
