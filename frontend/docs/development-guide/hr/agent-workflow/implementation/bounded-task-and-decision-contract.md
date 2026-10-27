# Preuzmi jedan ograničen ishod i sačuvaj decision gateove

Prije izmjene pretvori issue ili zahtjev u provjerljiv implementacijski opseg. Razlikuj činjenice, delegirane tehničke odluke i nedostajuće ljudske odgovore bez izmišljanja zahtjeva.

**Dokumentirani workflow s receptom.** V1 workflow i repozitorijske agentske upute definiraju ograničene ishode, izvore, odluke i prihvat. Kratki radni zapis je preporučeno pomagalo, ne nova shema ni automatizirano odobrenje.

## Okidač, vlasnik i ugovor

Koristi pri claimu leafa, nejasnom zahtjevu ili promjeni više capabilityja. Implementator upravlja code boundaryjem, a product/client vlasnik poslovnim odlukama. Tehničku delegaciju možeš riješiti u razvojnoj ovlasti; pretpostavljeni odgovor ostaje prijedlog.

Ugovor je opažljiv ishod s vlasnikom, prihvatom, ovisnostima, decision gateom i ovlaštenom isporukom. Parent nije automatska izvršna ovisnost. Zahtjevi pripremljeni za review još trebaju dogovor prije ovisne implementacije.

## Pročitaj izvršni ugovor

Za rad iz issuea pročitaj stvarni issue, dogovorene izvorne zahtjeve, ovisnosti, otvorene odluke i granicu vlasništva. Progress prati u aktualnom issue/PR zapisu, ne kroz setup status. Generirana shema paketa ni datoteka implementacijskog workflowa nisu preduvjet.

Za izravni zahtjev koristan je ekvivalent:

```text
Ishod: kategorija je dostupna i postojeći URL-ovi rade.
Vlasnik: presentation input i route kompozicija.
Prihvat: oba jezika, direct URL, breadcrumb, odredišta.
Ovisnosti: postojeći katalog i shared navigacija.
Odluke: nema nove poslovne politike; API migracija je izričita.
Dokaz: dopuštene provjere kandidata i navedeni izostanci.
Isporuka: samo stvarno zatražene publish radnje.
```

To su neutralni primjeri, ne dozvola za push, deploy, podatkovnu promjenu ili refaktor izvan opsega.

## Odluke bez brisanja neizvjesnosti

| Stanje               | Značenje                                   | Posljedica                                                  |
| -------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `RESOLVED_TECHNICAL` | Obrazloženo rješenje unutar ovlasti        | Zapiši rationale/source/tasks bez lažnog otvorenog blokera. |
| `PROPOSED`           | Pretpostavka za pregled                    | Prikaži učinak i blokiraj posljedični ovisni rad.           |
| `REQUIRES_INPUT`     | Nedostajuća politika, pristup ili konflikt | Zadrži ciljanu odluku, vlasnika i gate.                     |

Delegirani tehnički detalj riješi, ne ostavljaj sve otvoreno. Locked baseline može sadržavati neriješene ulaze; lock ih ne odgovara.

Pri reviewu poveži kriterije prihvata s izvorima i odredi koji rad ovisi o svakoj otvorenoj odluci. Mehanički potpun zapis ne pretvara analitičku pretpostavku u suglasnost klijenta.

## Najmanji cjeloviti zahvat

Prije odabira datoteka prati pozivatelje i registracije. Mali javni prop može tražiti više potrošača; naslov ne mora. Dovrši ishod s jezicima, linkovima i lifecycleom umjesto jednog izoliranog filea.

Ako otkriješ veću migraciju, izričito opiši boundary. Čuvaj public contract bez odobrene migracije i tuđe nepovezane izmjene.

Neovisan ready posao može nastaviti dok odluka blokira drugi leaf. Zapiši točan ovisni acceptance case. Ne blokiraj cijeli projekt bez potrebe i ne implementiraj nedostajući policy iz intuicije.

## Pogreške i odluke

| Opažanje                      | Odluka                                       |
| ----------------------------- | -------------------------------------------- |
| Parent postoji, blocker ne    | Ne zaključuj redoslijed samo iz hijerarhije. |
| Zahtjevi čekaju review        | Prvo semantički review i ovlast.             |
| UI naziv implicira permission | Prijedlog/input gap, ne potvrđeni policy.    |
| Tehnička odluka delegirana    | Riješi uz izvor i rationale.                 |
| Pojavi se nepovezani cleanup  | Odvoji osim nužne koherentne promjene.       |
| Nova baseline tijekom rada    | Sačuvaj source; refresh je zaseban task.     |

## Prihvat i handoff

Dovršen task ima ponašanje, traceability, dopuštene provjere i delivery zapis. Blokiran task ima konkretan owner/question/boundary.

Povezane teme su **Capability vlasnici** i **Source-bound handoff**. Vodič ne claima issue, ne odobrava zahtjeve i ne objavljuje izmjene.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
