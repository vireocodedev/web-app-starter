# Vežite pretplate na poslužiteljske događaje uz autentificiranog vlasnika

Veza poslužiteljskih događaja ima životni vijek: prijavljenog korisnika, mogući radni prostor, listenere, pokušaje povezivanja i poruke koje stižu tijekom gašenja. Tom životnom vijeku dodijelite jednog vlasnika. Inače odjava može ostaviti privatni tok živim, promjena prostora primijeniti stare događaje na novi prikaz ili ponovljeno mountanje dodati dvostruke handlere.

Ovo je **referentna mogućnost**, a ne ugrađena starter usluga. FRED koristi nativni `EventSource` s vjerodajnicama, a LMS povijesni `useRgoSseEmitter`. Dodavanje članka starteru ne daje njihove endpointe, rječnik događaja ni offline pravila. Prije uključivanja stvarnog toka definirajte backend ugovor događaja.

## Okidač i vlasnik

Poslužiteljske događaje koristite kada poslužitelj treba obavijestiti preglednik o promjeni bez stalnih ponovljenih upita za svaku izmjenu. Autentificirana kompozicija aplikacije upravlja vezom kada događaji obuhvaćaju više featurea. Feature radnog prostora može imati užu pretplatu ako backend podržava taj opseg. Widgeti koriste projekcije pod vlasništvom umjesto da svaki otvara isti globalni tok.

FRED otvara `/api/sse` s vjerodajnicama samo uz autentikaciju i zatvara izvor u effectu pri cleanupu. LMS isključuje tok kada autentikacija ili uloga proizvoda ne zadovoljava uvjete, centralno registrira imenovane handlere i ponovno se povezuje pri promjeni konteksta specifičnog proizvodu. Prenesite pravilo životnog vijeka, a ne nazive uloga ni poslovne prijelaze.

Izričito odaberite cijeli identitet veze. Boolean autentikacije dovoljan je samo kada promjena korisnika ili prostora ne može nastati bez završetka tog životnog vijeka. Novi proizvod s promjenom računa na istoj stranici treba čišćenje prema identitetu i odbijanje starih poruka čak i kada `isAuthenticated` ostaje true.

## Odvojite transportno stanje od ovlasti

Ovo je **predloženi neutralni protokol**, a ne ugrađeni API:

```ts
type StreamOwner = {
  viewerId: string;
  workspaceId: string;
  generation: number;
};
type StreamState = "disabled" | "connecting" | "connected" | "recovering" | "session-check-required";

// Otvorite samo za zabilježenog vlasnika.
// Validirajte svaku poruku i odbijte je ako je vlasnik zastario.
// Cleanup: zatvorite izvor, uklonite listenere i otkažite zakazana povezivanja.
```

Povezan transport ne dokazuje pravo izvršenja naredbe. Backend zasebno autorizira tok i svaku operaciju. Heartbeat potvrđuje samo dokumentirane činjenice živosti. Nije potvrda pojedinog zapisivanja u tijeku ni dokaz svježine cijele predmemorije.

LMS dokumentira da EventSource pogreška ne daje HTTP status neuspješnog handshakea. Njegov handler pogreške sprječava istodobne provjere trenutačnog korisnika kako bi autentikacijskim API-jem razlikovao istek sesije od mrežne pogreške. To je preciznije od proglašavanja svake pogreške odjavom ili dopuštenim offline radom. Nova aplikacija treba vlastite izričite ishode session API-ja.

## Odluke o oporavku

| Događaj                         | Vlasnik veze                               | Vlasnik podataka                               |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| Dovršena prijava                | Otvara dopušteni tok                       | Uspostavlja svježu dopuštenu projekciju        |
| Promjena korisnika ili prostora | Završava staru i otvara novu sesiju opsega | Odbija stare poruke i čisti ograničene podatke |
| Prolazna pogreška veze          | Slijedi ograničenu politiku povezivanja    | Označava svježinu i potrebu usklađivanja       |
| Provjera sesije odbije pristup  | Zatvara tok i poništava vlasnika           | Provodi čišćenje autentikacije i opoziva       |
| Ponovno povezivanje             | Nastavlja samo prema ugovoru kursora       | Usklađuje propušteno prije tvrdnje o svježini  |
| Unmount kompozicije             | Zatvara i uklanja zakazani rad             | Sprječava zakašnjele lokalne učinke            |

Povijesni FRED provider zatvara EventSource pri svakoj pogrešci. Time završava vezu, ali sam ne zakazuje oporavak. Nemojte ga prikazati kao cjelovitu otpornu strategiju. Listener također koristi neprovjereni `JSON.parse(...) as T`; neispravna ili nekompatibilna poruka može baciti pogrešku. Nove integracije trebaju zaštićeno dekodiranje i runtime shemu prije handlera aplikacije.

Pouzdan protokol ponavljanja i rupa dodatni je rad, a ne jamstvo ovih providera. S backendom dogovorite ID-eve ili kursore događaja, zadržavanje, ponašanje pri povezivanju, opseg vlasnika i fallback punog dohvata. Ako oporavak koristi aplikacijski timer, ograničite backoff i otkažite ga pri promjeni vlasnika. Izbjegnite nekontroliranu drugu petlju ponavljanja preko životnog ciklusa odabranog transporta.

## Pogreške i povratna informacija

Razlikujte oporavak, zabranu i trajno nepodržanu mogućnost. Sačuvajte dopuštene posljednje podatke uz poštenu oznaku svježine kada politika proizvoda to dopušta. Nemojte prikazivati toast pri svakoj očekivanoj rupi heartbeata ni ispisivati privatne poruke u dijagnostiku. Ponavljanu nekompatibilnost sheme i neoporavljive probleme prijavite sigurnim metapodacima vrste i verzije događaja.

Radnja ponovnog pokušaja treba povezati tok trenutačnog vlasnika i uskladiti stanje. Ne treba ponavljati proizvoljna zapisivanja, oživjeti odjavljenu sesiju ni preuzeti poruke drugog prostora. Pozadinski oporavak u pravilu ne smije premjestiti fokus s korisnikova zadatka.

## Scenariji prihvaćanja

Ponovite mount i cleanup autentificirane kompozicije: ostaju samo namjeravane veze i listeneri. Promijenite korisnika uz zadržanu autentikaciju: stare poruke ne mijenjaju novog vlasnika. Završite sesiju: tok i zakazano povezivanje prestaju. Izazovite prolaznu pogrešku: stranica razlikuje oporavak i zabranu. Pošaljite neispravan JSON: nepovezani UI ne pada. Povežite se nakon propuštenih događaja: aplikacija koristi izričit poslužiteljski podržan oporavak umjesto pretpostavke da se ništa nije promijenilo.

Lokalizirajte vezu, oporavak, zastarjelost i poruke sesije. Boju dopunite tekstom, a nametljive objave čuvajte za promjene koje traže radnju.

## Izbjegnite ove prečace

Nemojte otvarati globalnu vezu po widgetu, ostaviti retry timere nakon odjave, heartbeat proglasiti uspjehom naredbe, izravno pretvoriti dekodirani JSON u pouzdan tip ni kopirati FRED zatvaranje pri pogrešci kao punu politiku oporavka. Tok je kanal s vlasnikom i dokumentiranim oporavkom.

## Izvori i podrijetlo

- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/providers/SseProvider/SseProvider.tsx` — autentificirana veza s vjerodajnicama i cleanup; ograničenja neprovjerenog dekodiranja i zatvaranja pri pogrešci.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/providers/LmsSseProvider.tsx` — središnji handleri, uvjeti, ponovno povezivanje konteksta i provjera sesije bez paralelnih duplikata.
