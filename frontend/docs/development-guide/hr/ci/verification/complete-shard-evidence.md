# Dokaži potpuno izvršavanje testova kroz shardove

Podijeli skup testova u ograničene poslove i dokaži jednokratan obuhvat konfiguriranih frontend datoteka i prikupljenih backend klasa. Frontend izvješća moraju imati uspješne assertione i valjane brojeve; backend dodatno uspoređuje rezultate s neovisnim inventarom pojedinačnih testnih slučajeva. Više zelenih poslova samo po sebi ne dokazuje te ugovore.

**Ugrađeni obrazac predloška.** Protokol pripada helperu `infrastructure/ci/test_shards.py`, konfiguraciji težina, glavnom workflowu i Gradle zadatku za inventar. Trenutačno postoje tri frontend i tri backend sharda. Taj broj nije uputa za povećanje unutarnjih worker poolova.

## Okidač, vlasnik i ugovor

Primijeni kada trajanje ili potrošnja resursa zahtijevaju odvojene poslove. Održavatelj koji mijenja kolekciju, konfiguraciju ili dodjelu odgovara za potpun obuhvat. Operater odgovara za raspoloživi kapacitet. Težine utječu samo na raspored.

Ugovor je `prikupi konfigurirane jedinice → deterministički dodijeli → izvrši datoteke/klase → dokaži jednokratan obuhvat jedinica i validiraj prijavljene slučajeve`. Nove odgovarajuće frontend datoteke i prikupljene backend klase ulaze bez ručno održavane allowliste. Težina ih ne može izbaciti. Affinity može zadržati povezane klase zajedno, ali ih ne smije ukloniti.

Frontend browser testovi pod `tests/browser` nisu dio ovog inventara. Završni dokaz zato ne znači da su izvršeni svi browser scenariji. Njihova provjera ostaje zaseban ugovor.

## Inventar nastaje prije dodjele

Vitest popisuje frontend datoteke, a helper ga uspoređuje s izvornim testnim datotekama u `frontend/tests`, bez browser direktorija. Named Vitest projects zasad se odbijaju jer njihovo spajanje bez zasebnog identiteta može izgubiti ili duplicirati jedinice.

Dokaz nije jednak na obje strane. Frontend koristi `vitest list --filesOnly` i zapisuje `inventory: null`: neovisno dokazuje potpun obuhvat datoteka, a zatim validira assertione i zbrojeve koje je prijavilo izvršavanje. Prije izvršavanja ne prikuplja neovisan inventar identiteta frontend testnih slučajeva. Uvjetno izostali assertion koji se uopće ne pojavi u runtime izvješću zato nije obuhvaćen tim dokazom; valjani prijavljeni zbrojevi sami ga ne mogu otkriti. Backend dry-run daje neovisan inventar identiteta slučajeva pa omogućuje jaču provjeru njihova obuhvata.

Backend koristi `ciTestInventory` nad cjelovitim skupom testnih izvora i čita JUnit XML iz dry-run izvršavanja. Potpuna kompilacija ostaje potrebna jer dodijeljena klasa može koristiti fixture iz druge datoteke. Preskočeni slučaj očekivan je tijekom inventara; u stvarnom izvršavanju isti skip predstavlja neuspjeh.

Dodjela sortira affinity grupe prema zbroju težina, uz stabilno razrješavanje izjednačenja, pa grupu stavlja u najmanje opterećen shard. Nepoznata težina je jedan. Početne vrijednosti predstavljaju planiranje, ne mjerenje. Isti checkout i iste težine moraju proizvesti istu dodjelu u svakom poslu i završnoj provjeri.

## Identitet je dio dokaza

Ovo je djelomična ilustracija, ne valjana potpuna shema izvješća:

```json
{
  "schemaVersion": 1,
  "kind": "frontend",
  "sourceSha": "<tocan-checkout-sha-od-40-znakova>",
  "runId": "<trenutni-workflow-run>",
  "runAttempt": "<trenutni-pokusaj>",
  "shard": 1,
  "total": 3,
  "selected": ["tests/features/example.test.tsx"]
}
```

Potpuno izvješće sadrži sve jedinice, sve dodjele, backend inventar, identitete izvršenih testova, trajanja i ukupno vrijeme. `sourceSha` mora odgovarati checkoutu i workflowu. Run i attempt razlikuju ponovljena izvršavanja istog izvora.

Frontend koristi jedan Vitest worker. Zahtijeva uspješne module i sve assertione sa statusom passed. Nedostajuća, dvostruka ili neočekivana datoteka, modul bez assertiona, pending/todo/skip i nesklad broja testova uzrokuju pad. Backend dobiva klase kroz generiranu selekcijsku datoteku, koristi standardni `test` zadatak i uspoređuje rezultate s dry-run inventarom.

Ljudski naziv testa nije jedinstveni identitet. Ponavljanja naziva čuvaju redni broj pojavljivanja. Backend uspoređuje multiskupove umjesto skupova. Uklanjanje duplikata naziva moglo bi prikriti izostavljeni parametrizirani test.

## Završna provjera koristi samo trenutni attempt

Gate prvo provjerava stanje svih odabranih poslova. Zatim preuzima artefakte s trenutnim `github.run_attempt` u nazivu. Za svaki dio aplikacije traži točan broj izvješća, jedinstvene brojeve shardova, podudarne schema/kind/source/run/attempt vrijednosti, identičan inventar svih jedinica i jednak backend inventar slučajeva gdje postoji.

Neovisno izračunava dodjelu i uspoređuje svaku selekciju. Spojene dodjele moraju odgovarati multiskupu svih jedinica. Identiteti testova moraju biti jedinstveni među shardovima i pripadati dodijeljenim jedinicama. Backend dodatno mora odgovarati svim identitetima iz dry-runa.

```text
potpun inventar + težine iz istog izvora
                  |
       deterministička dodjela 1..3
                  |
       izvješća izvršavanja attempta N
                  |
       ponovni izračun + provjera identiteta
                  |
       jednokratne jedinice + valjana izvješća slučajeva
```

Matrix fail-fast je isključen kako jedan pad ne bi automatski otkazao ostale shardove. Nakon neuspješnog pokušaja ponovi sve poslove. Ponovno pokretanje samo palih poslova i posuđivanje starih uspješnih izvješća krši ugovor, čak i uz isti commit.

## Pogreške i odluke

| Pogreška                           | Odluka                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Nova datoteka nije u kolekciji     | Uskladi collector i konfiguraciju; ne dodaj iznimku radi zelenog statusa.                                  |
| Pomiješani attempti                | Ponovi sve poslove i prikupi jedan potpun pokušaj.                                                         |
| Neočekivani skip ili todo          | Razriješi slučaj ili uvedi izričito pregledanu politiku. Trenutačno nema deklariranih non-browser iznimki. |
| Dvostruka ili promijenjena dodjela | Ispravi deterministički algoritam ili obradu izvješća.                                                     |
| Jedan shard traje znatno dulje     | Izmjeri nedjeljive jedinice i affinity prije povećanja kapaciteta.                                         |
| Testovi prođu, upload izvješća ne  | Dokaz nedostaje; gate mora pasti.                                                                          |

## Prihvat i inspekcija

Pregledaj automatski ulazak novih odgovarajućih datoteka/klasa u inventar jedinica, upload svih shardova, preuzimanje samo trenutnog attempta i odbijanje neispravnih ili pomiješanih izvješća. Trajanja promatraj odvojeno od obuhvata. Uobičajene lokalne testne naredbe trebaju i dalje izvršavati cijeli skup; CI shardovi nisu dozvola za prešutno lokalno preskakanje.

Izvješća se trenutačno čuvaju sedam dana i sadrže sintetičke testne dokaze. Ne smiju sadržavati aplikacijsku bazu, korisničke podatke ili deployment vjerodajnice. Tvrdnju o prihvatu veži uz stvarni SHA/run/attempt i završni rezultat točno opisanog dokaza. Odvojeno navedi frontend obuhvat datoteka i backend obuhvat pojedinačnih slučajeva.

Članak opisuje normalan CI. Ništa ne izvršava i ne poništava izričitu zabranu testova u konkretnom razvojnom zadatku.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test-timings.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`
