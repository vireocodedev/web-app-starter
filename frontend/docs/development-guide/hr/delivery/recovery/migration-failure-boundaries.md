# Oporavak ovisi o granici na kojoj je migracija stala

Razlikuj neuspjeh prije mutacije od neuspjeha nakon mogućeg pokretanja kandidatskog backenda i promjene baze. Sačuvaj dokaze i utvrdi stvarno stanje prije odluke o ponavljanju, forward fixu ili zasebno odobrenom restoreu.

**Ugrađeni obrazac s izričitom preporukom dizajna.** `infrastructure/release/runtime.py` upravlja produkcijskim backup gateom i transakcijom zamjene. Controller upravlja request journalima i staging receiptima. Additive expand/migrate/contract evolucija sheme preporuka je za buduće migracije, ne postojeći automatski rollback.

## Okidač, vlasnik i ugovor

Primijeni kod deployment timeouta, neuspjelog backupa, problema pri startupu kandidata, Flyway pogreške, nesklada javnih probeova i healtha ili nedostajućeg završnog GitHub statusa. Operater dijagnosticira pod lockom odgovarajućeg okruženja. Održavatelj odgovara za kompatibilnost koda i sheme te pregledani popravak. Čitanje vodiča ne daje ovlast za restore ili brisanje podataka.

Ugovor zahtijeva svježi, provjereni i trajno zapisani produkcijski backup prije startupa kandidata koji može pokrenuti Flyway. Neuspjeh nakon zamjene čuva blokirajuću transakciju. Baza se ne vraća automatski. Postojanje stare slike ne dokazuje da stari kod sigurno radi s novom shemom.

## Stvarni prijelazi stanja

Runtime validira zaštićenu konfiguraciju i par, provjerava privatnu vidljivost paketa, uzima environment lock i pregledava prethodnu transakciju. Stanje koje nije `success` ili `backup-failed` blokira sljedeću mutaciju do izričitog operaterskog usklađivanja.

Prije aplikacijske mutacije provjerava prethodno aktivne slike/rute i spremnost baze te povlači i pregledava točne kandidatske digeste. Stvara nepromjenjivi snapshot izdanja i zapisuje `prepared` transakciju s parom, snapshotom, prethodnim aktivnim zapisom i run/attempt identitetom.

U produkciji zaustavlja prethodni backend ako postoji. Tek tada stvara i provjerava svježi backup. Ako backup padne, pokušava pokrenuti prethodni backend; nakon uspjeha tog recovery koraka zapisuje `backup-failed` i prijavljuje pogrešku. Ako sam oporavak padne ili proces ranije nestane, zapis može ostati blokirajući. Treba pregledati stvarno stanje, ne pretpostaviti da je očekivani recovery završio.

Nakon uspješnog backupa zapisuje `replacing`, podiže backend i frontend, čeka kontejnere i provjerava točne image ID-eve, health i javne granice. Tek nakon uspjeha objavljuje novi `active.json` i uspješnu transakciju.

```text
prepared
   |
   +-- produkcija: stop starog backenda -> provjeren backup
   |                                          |
   |                                backup pad -> pokušaj starog starta
   |                                          |
   |                                    backup-failed
   |
replacing -> stvarne slike + health + javne provjere
   |                              |
   |                              +-> success + active pokazivač
   |
 pad / prekid -> sačuvana transakcija -> usklađivanje prije nove mutacije
```

Dijagram objašnjava stanje. Nije recept za ručno uređivanje pokazivača ili ledgera radi ponavljanja.

## Što ovdje znači provjeren backup

Helper piše `pg_dump -Fc` u isključivo stvorenu zaštićenu `.partial` datoteku, flush/fsynca sadržaj, zahtijeva minimalnu veličinu i provjerava tablicu sadržaja arhive kroz `pg_restore --list`.

Zaštićeni metapodaci sadrže SHA-256, broj bajtova, dokaz inicijalizirane tablice, broj korisnika i vrijeme. Konačni naziv objavljuje se atomarno, direktorij se fsynca, a checksum ponovno čita iz trajno zapisanog odredišta. Neuspjeli partial uklanja se; retencija obrađuje samo vlastitu shemu naziva. Sama datoteka ili uspješan dump subprocess nisu dovoljni.

Odabrana politika čuva produkcijske backupe trideset dana na istom poslužitelju. To ne štiti od gubitka cijelog poslužitelja. Aktivacija dnevnog backupa zahtijeva dokaz restorea inicijaliziranih podataka prema operaterskom vodiču. Staging nema planirane backupe. Ovaj članak ne tvrdi da postoji offsite zaštita.

## Odluka prema granici, ne boji workflowa

| Granica ili opažanje                        | Značenje i odluka                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Zahtjev odbijen prije runtime mutacije      | Ispravi identitet, izvor ili ovlast bez slabljenja provjere.                                |
| Pull/provenance padne prije prepared stanja | Pregledaj stvarne dokaze; ne pretpostavljaj zamjenu aplikacije.                             |
| Produkcijski backup padne                   | Kandidatski startup bio je blokiran; provjeri stari backend i transaction.                  |
| Transakcija je `replacing`                  | Kandidat je možda pokrenuo Flyway; blokiraj automatski retry i pregledaj migration history. |
| Health je zelen, javne rute padaju          | Release prihvat nije završen; provjeri routing i identitet okruženja.                       |
| Host ima success, GitHub čeka ili timeouta  | Možda je izgubljeno izvješće; prije ponavljanja uskladi journal i stvarno stanje.           |
| Stari digest postoji nakon migracije        | Postojanje ne dokazuje kompatibilnost; prednost daj pregledanom forward fixu.               |

Restore odbacuje promjene nastale nakon odabrane recovery točke. To je zasebna odluka o gubitku podataka sa zasebno odobrenim opsegom. Crveni workflow nije dovoljan razlog.

## Pregledaj povezani skup dokaza

Preko točnog run/attempta poveži request journal, environment transakciju, active pokazivač, nepromjenjivi snapshot, stvarne image ID-eve, database health/Flyway povijest i GitHub Deployment status. Started request ne ponavlja se automatski nakon restarta kontrolera. Novi dispatch nije siguran popravak neizvjesne mutacije.

Dijagnostika treba biti ciljana i privatna. Fiksne netajne kategorije pogrešaka pomažu trijaži. Ne objavljuj env vrijednosti, resolved Compose, CMS plaintext, Docker login datoteke, sadržaj baze ili proizvoljne raw logove u chat i CI artefakte. Čuvaj zapise umjesto brisanja journala ili volumena radi prividno čistog pokušaja.

## Buduće migracije oblikuj za kompatibilnost

Prednost daj aditivnom koraku koji podnose stari i novi kod, zasebno promatrivoj migraciji podataka i kasnijem uklanjanju starog oblika kad više nema korisnika tog ugovora. Za svaki korak pregledaj lockove, volumen podataka, nullability/defaults i mogućnost povratka starog koda.

To je preporuka dizajna. Runtime ne dokazuje kompatibilnost svake migracije, ne obrće Flyway automatski i ne vraća backup. Takva automatizacija tražila bi zaseban ugovor, pregled i operativne dokaze.

## Prihvat i inspekcija

Prije proglašenja oporavka utvrdi je li kandidat startao, koja je shema prisutna, koji par stvarno radi, slažu li se javne provjere te odgovaraju li transaction/active zapisi stvarnosti. Zabilježi odluku i preostala ograničenja bez otkrivanja tajni.

Spremnost oporavka dokazuje izolirana restore proba preuzete provjerene kopije prema runbooku, ne restore live baze. Članak ne izvršava backup, restore, deployment ni provjeru.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V1__create_users.sql`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql`
