# Backup je dovršen tek nakon trajne provjere artefakta

Backup je finalizirana arhiva s provjerenim metapodacima, ne samo naziv datoteke ili uspješan dump proces. Produkcijski migration gate treba dokaz da se trajno spremljeni artefakt može identificirati i pregledati nakon prekida.

**Ugrađeni obrazac predloška.** `infrastructure/release/runtime.py` upravlja dumpom, provjerom, retencijom i lockom. `controller.py` trajno objavljuje JSON. Timer i uvjeti aktivacije pripadaju `install.py` i release README-u.

## Okidač, vlasnik i ugovor

Primijeni prije produkcijske zamjene backenda, za scheduled/manual backup i analizu prekida. Operater upravlja spremištem i recovery politikom. Aplikacijski vlasnik odgovara za kompatibilnost sheme; backup sam ne čini image rollback sigurnim.

Ugovor je zaštićeni custom dump koji je prošao archive provjeru, trajnu objavu i ponovno čitanje checksuma. Kandidatski startup čeka taj rezultat. `.partial`, metadata bez dumpa ili nulti exit kod nisu dovoljni.

## Stvarni redoslijed objave

Runtime uzima produkcijski environment lock koji dijeli s deploymentom. Stvara nepredvidivi UTC naziv i ekskluzivnu `.partial` datoteku. `pg_dump -Fc` ide izravno u datoteku bez sadržaja baze u logovima.

Nakon dumpa radi flush/fsync, traži uspješan subprocess i minimalnu veličinu pa poziva `pg_restore --list`. To potvrđuje prepoznatljivu tablicu sadržaja, ne puni restore i upite nad podacima.

Zatim trajno zapisuje checksum, veličinu, initialization dokaz, broj korisnika i vrijeme. Dump se atomarno preimenuje, fsynca se direktorij, a checksum se ponovno čita iz odredišta. Retencija završava prije uspješnog povratka helpera.

```text
ekskluzivni .partial
      |
dump -> flush/fsync -> veličina + archive TOC
      |
SHA-256 + metadata -> konačni naziv -> fsync direktorija
      |
ponovno čitanje checksuma -> vlastita retencija -> dovršen artefakt
```

Metadata oblik bez stvarnih vrijednosti:

```json
{
  "sha256": "<archive-sha256>",
  "bytes": "<broj-bajtova>",
  "initialized": "<boolean>",
  "users": "<ocekivani-broj>",
  "created_at": "<UTC-vrijeme>"
}
```

String placeholderi predstavljaju tipizirane vrijednosti; primjer nije valjana metadata datoteka. Initialization/count pomažu odbiti pre-initialization praznu bazu, ali ne zamjenjuju aplikacijski restore acceptance ugovor.

## Trajnost uključuje naziv datoteke

Fsync sadržaja ne jamči trajnost rename directory entryja. Helper zato fsynca direktorij i ponovno čita checksum konačnog odredišta. JSON writer slično fsynca privremeni sadržaj, replacea ga i fsynca parent.

Prekid može ostaviti metadata bez dumpa, partial ili finalizirani artefakt za koji pozivatelj nije dobio success. Pregledaj točan par i transakciju. Crveni workflow nije razlog za brisanje konačnih dokaza.

CLI/service ulazi nameću restriktivni umask i provjeru zaštićenih putanja. Ad-hoc import interne funkcije preskače dio ugovora. Stvarnu operaciju izvršavaj postupkom vlasnika, ne kopiranjem nekoliko redaka iz članka.

## Retencija nije oporavak od gubitka servera

Odabrana politika čuva produkciju trideset dana na istom serveru. Timer je 03:00 Europe/Zagreb dnevno i instalira se disabled. Aktivira se tek nakon probe restorea preuzete inicijalizirane kopije. Staging nema scheduled timer, a backup helper ga izričito odbija.

Same-server storage ne može oporaviti gubitak cijelog servera. Deklariran raspored ne dokazuje firing, a enabled unit ne jamči sve buduće backupe. Dokaz su stvarni dovršeni artefakti. Offsite retencija zasebna je odluka.

Prune prepoznaje samo vlastite timestamp/token dump nazive i njihove metapodatke te stare orphan partial/metadata datoteke. Nije proizvoljni directory cleanup. `finally` uklanja neuspjeli partial; neuspjelo uklanjanje također ostaje pogreška.

## Pogreške i odluke

| Opažanje                              | Odluka                                               |
| ------------------------------------- | ---------------------------------------------------- |
| Dump pada ili je premalen             | Odbij backup; kandidat ostaje blokiran.              |
| TOC provjera pada                     | Arhiva nije prihvatljiv dokaz; istraži privatno.     |
| Checksum se promijenio                | Ne koristi niti tiho prihvaćaj artefakt.             |
| Metadata bez finalnog dumpa           | Nedovršena objava; pronađi granicu prekida.          |
| Arhiva valjana, initialized false     | Nije dokaz inicijalizirane recovery spremnosti.      |
| Kopija je samo na izgubljenom serveru | Priznaj ograničenje; retencija nije offsite zaštita. |

## Prihvat i inspekcija

Zabilježi konačni naziv, metadata identitet, bytes/checksum, initialization i vrijeme bez sadržaja podataka. Prije deployment retrya poveži backup pad s transactionom i stanjem starog backenda.

**Izolirana restore proba** nastavlja dokaz nad preuzetom provjerenom kopijom. Dumpovi, tajne i obnovljeni podaci ostaju izvan Gita i workflow artefakata. Članak ne izvršava backup ni retenciju.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/install.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
