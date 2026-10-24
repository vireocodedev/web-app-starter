# Povežite tipkovnicu, responzivnu geometriju i dokaze pristupačnosti

Screenshot može izgledati dobro dok je fokus zarobljen, izbornik prelazi mobitel ili kontrola nema dostupno ime. Automatizirani scan otkriva pravila, ali ne dokazuje upotrebljivost cijelog zadatka. Komplementarne dokaze gradite oko stvarne interakcije.

Ovo je **ugrađeni starter browser obrazac**. Izvor povezuje tipkovnicu, fokus, viewport geometriju, prijevode i axe. Samo je pročitan; za članak nije pokrenut browser, axe, assertion harness ni screenshot provjera.

## Okidač i vlasništvo

Browser dokaz koristite za navigaciju, modalni fokus, uske izbornike, velik tekst, motion i kontrole ovisne o CSS-u. Komponenta posjeduje semantiku, a scenarij viewport, jezik, ulaz i tvrdnje. Pristupačnost ostaje odgovornost proizvoda izvan jednog alata.

Starter tipkovnicom dolazi do skip linka, provjerava outline, aktivira ga i provjerava fokus sadržaja. Otvara Settings i nepostojeću rutu te skenira sastavljena stanja. Compact Settings otvara selector, provjerava aktivne poveznice, zatvara Escapeom i vraća fokus okidaču. Odabir druge stranice fokusira glavni sadržaj.

## Definirajte interakciju i povratak

Ovo je **neizvršeni neutralni scenarij**, a ne novi helper:

```text
Na širini mobitela:
  tipkovnicom otvoriti izbor stranice
  provjeriti imenovan dijalog i aktivni link
  Escape -> dijalog uklonjen, okidač fokusiran
  otvoriti i odabrati drugu stranicu -> smislen fokus odredišta
  promijeniti na desktop -> stari modal oslobođen, bez overflowa
```

Izvor provjerava granice kontrola i izbornika prema viewportu te horizontalni overflow, uključujući EN/HR i veliki tekst. Geometrija treba dokazati dosegljivu radnju, ne zamrznuti svaki nebitan piksel.

| Dokaz              | Potvrđuje                          | Sam ne potvrđuje                   |
| ------------------ | ---------------------------------- | ---------------------------------- |
| Role/name locator  | Semantički cilj u tom stanju       | Cijeli screen-reader tok           |
| Tipkovnica i fokus | Operabilan put i povratak          | Svaki uređaj i ulaz                |
| Bounds i overflow  | Dosegljiv raspored viewporta       | Sve fontove i širine               |
| Axe                | Nema detektiranih pravila u opsegu | Potpunu usklađenost pristupačnosti |
| Screenshot         | Izgled zabilježenog stanja         | Red fokusa ili točnu naredbu       |

## Odaberite korisnu matricu

Uključite usko i široko, podržane jezike i smislen velik tekst ili reduced motion. Jedna petlja tema nije potpuna kombinatorna pokrivenost. Prednost dajte rizičnim spojevima poput dugog prijevoda na uskom ekranu s velikim tekstom.

Documentation izvor skenira cijele stranice i odabrane kontekste. Opseg navedite točno: drawer scan ne dokazuje ostatak. Dijalog koji treba nestati provjerite kao uklonjen, ne samo izvan slike. Aktivni link treba točan `aria-current`.

## Pogreške i održavanje

Čekajte vidljive prijelaze, ne fiksno vrijeme. Nakon izlaska modala provjerite fokus po stvarnom lifecycleu. Reduced motion mijenja vrijeme; tvrdnja treba pratiti ishod, ne duljinu animacije.

Dijagnostika treba axe ID i broj čvorova, dimenzije, nevaljane granice i fokus. Nemojte potisnuti široke kategorije pravila radi zelenog rezultata bez razumijevanja. Namjerna iznimka treba točan opseg i održavan razlog kroz redovitu politiku pregleda.

Ručni pregled koristan je za red čitanja, upute, jasnoću, zoom/reflow i pomoćne tehnologije koje automatika ne dokazuje. Prisutnost izvora i lint/build nisu dokaz browser izvršenja.

## Scenariji prihvaćanja

Korisnik tipkovnicom doseže main kroz skip link. Otkazivanje vraća fokus, a druga stranica dobiva smislen fokus. Uski prevedeni bulk menu ostaje u viewportu s imenovanim radnjama. Velik tekst ne skriva kontrole. Reduced motion čuva upotrebljiv prijelaz. Axe skenira namjeravano stanje i daje korisnu dijagnostiku. Slike dopunjuju interakciju i ručni pregled.

## Izbjegnite ove prečace

Nemojte axeom jamčiti pristupačnost, slikom provjeravati fokus, koristiti samo desktop EN ni provjeriti modal bez izlaza i fokusa. Imenujte stvarni dokaz i granice.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/application.spec.ts` — skip, fokus, izlaz, bounds, tekst/motion i axe dijagnostika.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/documentation.development.spec.ts` — lokalizirana uska navigacija, kontekst i overflow.
