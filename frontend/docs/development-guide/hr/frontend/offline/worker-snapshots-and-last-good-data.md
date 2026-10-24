# Sačuvajte posljednji valjan snimak nakon pogreške pozadinskog osvježavanja

Osvježavanje offline predmemorije često preuzima više povezanih kolekcija. Zamjena nekih storeova uz neuspjeh drugog može stvoriti miješani snimak koji nikad nije postojao na poslužitelju. Posljednji upotrebljiv snimak zadržite dok kandidat nije potpun i spreman za promociju prema ugovoru vlasnika pohrane.

Ovo je **referentni recept povijesnog LMS koda**, a ne ugrađeni starter worker. LMS worker prikuplja sve rezultate i ne šalje zamjensku predmemoriju ako bilo koji dohvat ne uspije. UI most zadržava prethodne podatke i razlikuje očekivani prekid veze od problema koji traži radnju. To dokazuje uvjet potpunosti preuzimanja, ali ne runtime validaciju, poslužiteljski dosljedan snimak ni atomsku lokalnu promociju.

## Okidač i vlasništvo

Worker koristite kada obrada osvježavanja ili velik prijenos koristi izolaciju od UI dretve. Worker upravlja zahtjevima i obradom jednog pokušaja. Vlasnik predmemorije upravlja trajnom shemom, promocijom, privatnošću zadržanih podataka i invalidacijom queryja. UI upravlja istinitim stanjima čekanja, zastarjelosti, pogreške i spremnosti.

Nemojte uvoditi worker samo da sakrijete nejasan životni vijek predmemorije. Definirajte korisnika i prostor, izvornu reviziju ili token snimka gdje postoji, potrebne entitete i učinak na lokalne naredbe. Worker koji obrađuje odgovor starog vlasnika ne smije prepisati predmemoriju novog.

Pregledani worker s vjerodajnicama dohvaća konfigurirane kolekcije i čeka sve rezultate. Ako bilo koji zahtjev ne uspije, šalje događaj pogreške i ne šalje zamjensku predmemoriju. Komentar objašnjava da kasniji loader čisti storeove prije skupnog spremanja pa bi djelomičan download uništio koristan sadržaj. Taj uvjet cjelovitog preuzimanja prenosiva je zaštita.

## Pripremite, validirajte pa promovirajte

Ovo je **predloženi jači protokol**, a ne ugrađeni LMS oblik poruke:

```ts
type SnapshotCandidate = {
  owner: { viewerId: string; workspaceId: string };
  requestId: string;
  schemaVersion: 1;
  snapshotToken: string;
  entities: unknown;
};

// Preuzmite potpun kandidat -> validirajte sve obvezne kolekcije.
// Ponovno provjerite vlasnika i generaciju zahtjeva.
// Promovirajte transakcijom ili oporavljivim pokazivačem generacije.
// Invalidirajte projekcije tek nakon uspješne promocije.
```

TypeScript tipovi worker poruka ne provjeravaju proizvoljne runtime poruke ni preuzeti JSON. Pregledani LMS worker provjerava status odgovora, ali JSON castom pretvara u očekivanu kolekciju. Nova implementacija treba zaštićeno dekodiranje poruka i runtime sheme entiteta na stvarnoj granici povjerenja. Mora odbiti i stare generacije i pogrešnog vlasnika.

Uspjeh svih endpointa ne jamči da kolekcije opisuju jedan poslužiteljski trenutak. Ako feature treba dosljednost među kolekcijama, dogovorite token snimka, reviziju ili export endpoint. Inače dokumentirajte slabiju dosljednost umjesto opisivanja istodobnih zahtjeva kao transakcijskog snimka.

Lokalna promocija treba vlastitu granicu pogreške. Mrežni uvjet ne sprječava kvotu usred čišćenja i ponovnog punjenja. Koristite IndexedDB transakciju potrebnih storeova ili pripremite novu generaciju i atomski promijenite aktivni pokazivač nakon validacije. Zadržite dovoljno prethodnog stanja za oporavak prekinute promocije. Prije tvrdnje o jamstvima pregledajte stvarnu pohranu.

## Odvojite lokalnu namjeru

LMS offline cache servisu zabranjuje ponovno učitavanje storeova sync naredbi i korisnika. To pokazuje namjerno razdvajanje preuzetih podataka i dijela lokalnog stanja. Novi feature mora odrediti vlastiti outbox, mapiranja, potvrde i privatnu sesiju; nije svaki store za zamjenu poslužiteljskim osvježavanjem.

Izmijenjen nacrt drugi je vlasnik. Novi snimak može označiti osnovu zastarjelom, ali ne smije prešutno zamijeniti unos ni povezati novi token sa starim vrijednostima. Stvarni gubitak ovlasti može tražiti uklanjanje sadržaja čak i kada bi zadržavanje snimka inače bilo korisno.

## Odluke o pogreškama i oporavku

| Ishod osvježavanja                      | Zadržani podaci                               | Vidljivo stanje                               |
| --------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| Svi obvezni dohvati i validacija uspiju | Promocija prema lokalnom ugovoru dosljednosti | Svježina dokumentiranog snimka ili verzije    |
| Jedan endpoint ne uspije                | Posljednji valjan snimak ostaje               | Zastarjelost i ponovni pokušaj                |
| Očekivan gubitak mreže ili backenda     | Dopušteni cached podaci ostaju                | Offline bez ponovljenih bučnih toastova       |
| Nekompatibilna shema                    | Kandidat odbijen                              | Ažuriranje nedostupno uz sigurnu dijagnostiku |
| Lokalna promocija ne uspije             | Obnovljiva prethodna generacija ili dnevnik   | Pogreška pohrane, ne svježi uspjeh            |
| Promjena vlasnika ili ovlasti           | Stari kandidat odbijen                        | Novi opseg ili zabrana                        |
| Valjana početna predmemorija ne postoji | Nema što zadržati                             | Objasnite nedostatak offline podataka         |

Pregledani UI most prepoznate probleme veze obrađuje tiho, a druge prikazuje kao pogrešku za radnju. Klasifikator koristi tekst poruke pogreške; to je povijesni primjer, ne robustan tipizirani transportni ugovor. Nova granica treba gdje može sačuvati strukturirane kategorije i ne izlagati detalje endpointa ili privatni sadržaj korisniku.

## Scenariji prihvaćanja

Odbijte jednu kolekciju dok druge uspiju: prethodna dosljedna predmemorija ostaje, bez djelomične zamjene. Vratite neispravne podatke s HTTP uspjehom: kandidat se odbija. Prekinite promociju pohranom: prethodna generacija ili oporavljivi dnevnik ostaje. Promijenite korisnika tijekom preuzimanja: stari rezultat ne objavljuje se u novi opseg. Osvježite uz naredbu u redu: outbox preživljava. Počnite bez cachea i veze: prikaz je nedostupan, ne lažno prazno uspješan. Uspješan oporavak invalidira čitanja nakon promocije i uklanja čekanje.

Lokalizirajte zastarjelost, offline, osvježavanje, pogrešku i nedostajuću predmemoriju. Vrijeme ažuriranja neka ima jasno značenje, bez premještanja fokusa pri dolasku pozadinskog snimka.

## Izbjegnite ove prečace

Nemojte valjane podatke zamijeniti djelomičnim downloadom, tipove poruka smatrati runtime validacijom, uspješne endpointe nazvati server transakcijom, obrisati outbox s cacheom ni iz mrežne prisutnosti zaključiti svježinu. Osvježavanje ima odvojene granice preuzimanja, provjere, vlasništva, promocije i prikaza.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/webWorker/webWorker.ts` — uvjet potpunog preuzimanja, događaji pogreške i preskakanja te neprovjeren sadržaj.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/webWorker/webWorkerService.tsx` — UI most, posljednji valjani podaci, završetak čekanja i invalidacija nakon učitavanja.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/webWorker/WebWorkerSchema.ts` — compile-time rječnik ulaza, ne runtime validacija.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/indexedDb/IDBService.ts` — storeovi i namjerna isključenja iz ponovnog učitavanja.
