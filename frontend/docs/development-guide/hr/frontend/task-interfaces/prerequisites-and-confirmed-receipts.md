# Preduvjeti prikazuju dokaze, potvrde priznate ishode

Panel preduvjeta koristite kada operaciju blokiraju činjenice drugih vlasnika, a potvrdu kada je poslužitelj priznao smislen ishod. Prvi objašnjava što nedostaje i kako to riješiti. Druga objašnjava što se dogodilo i koja je sljedeća radnja sada valjana. Nijedan prikaz ne smije izmišljati poslovno dovršenje iz lokalnog UI stanja.

Ovo je **referentni recept** prema Client Discoveryjevim `AppPrerequisiteList` i `AppTaskReceipt`. Komponente su prezentacija potrošačke aplikacije, nisu ugrađeni izvozi predloška. Nova aplikacija mora dati vlastitu mjerodavnu projekciju i rezultat naredbe.

## Dokaz pripada svojem izvoru

Redak preduvjeta ima stabilan ID, naslov te neobavezan opis, odgovornu osobu, rok i radnju rješavanja. Pregledana komponenta prima otvorene i neobavezne dovršene stavke. Dovršene stavke prikazuje u otklopnom odjeljku, dok ukupno stanje i neobavezan tekst pokrivenosti predaje vlasnik.

Komentar izvora namjerno kaže da su retci dokazi/stanje, nikada uređive oznake dovršenja. Kućica koja mijenja samo lokalno stanje ne može potvrditi da je dokument prihvaćen, račun pripremljen ili drugi servis dovršio posao.

Značajka posjeduje dohvat i tumačenje činjenica preduvjeta. Backend posjeduje dopuštenost operacije. Panel koji izgleda spremno nije ovlast za kasniju promjenu: servis mora ponovno provjeriti trenutačne preduvjete pri primitku naredbe.

Razlikujte nepotpuno od nedostupnog. Ako izvor ne uspije, istekne budžet ili korisnik ne smije vidjeti potreban izvor, prikažite odgovarajuće nepoznato/ograničeno stanje prema javnom ugovoru. Nedostajući redak ne smije postati zeleno „Sve je dovršeno”. Broj dovršenih stavki bez granice pokrivenosti može ozbiljno zavaravati.

## Svakoj blokadi dajte precizno rješenje

Koristite radnju koja pripada nedostajućem preduvjetu: otvorite relevantan editor, zatražite imenovani dokaz ili navigirajte na točan izvorni zapis. Sačuvajte vlasnika izvornog zadatka i siguran kontekst povratka. Generička poveznica „Idi na postavke” za svaki problem rijetko je korisna.

Odgovorna osoba i rok opisuju projekciju izvora; panel ne dodjeljuje osobe niti ponovno računa rokove. Datume formatirajte prema jeziku i vremenskim pravilima aplikacije. Dugi opisi trebaju ostati čitljivi, a oznake radnji jasno imenovati promjenu.

Sljedeće je **ilustrativni pseudokod modela prikaza**, ne ugrađeni DTO predloška:

```ts
type PrerequisiteProjection = Readonly<{
  coverage: "complete" | "partial" | "unavailable";
  readiness: "ready" | "blocked" | "unknown";
  checkedAt: string;
  missing: readonly Readonly<{
    id: string;
    reasonCode: string;
    remedy: "edit-document" | "request-evidence";
  }>[];
}>;
```

Značajka pretvara kodove razloga/rješenja u preveden tekst i valjane radnje ruta. Ne treba prihvaćati proizvoljan HTML poslužitelja ni izvršavati tekst naredbe koji poslužitelj vrati. Ponovno izračunajte trenutačnu ovlast prije prikaza radnje i oslonite se na backend nakon navigacije.

## Potvrda počinje priznanjem poslužitelja

Referentni `AppTaskReceipt` jest obavijest izgleda uspjeha s naslovom, sadržajem, detaljima i sljedećom radnjom vlasnika. Ne zaključuje rezultat iz rute, vrijednosti forme ili montiranja komponente. Takav prikaz uspjeha koristite samo kada je ugovor vlasnika potvrdio opisanu činjenicu.

HTTP 202 može značiti da je zahtjev prihvaćen za obradu. Ne dokazuje završetak obrade. Potvrda može opravdati „Izvoz je zatražen” dok izvoz čeka, ali ne „Izvoz je dovršen” ili poveznicu na preuzimanje koje još ne postoji. Tekst i prikaz birajte prema točno potvrđenom stanju.

Koristan trajan prikaz potvrde identificira nastali objekt ili operaciju te, kada je relevantno, potvrđenu reviziju/vrijeme. Sljedeća radnja izvodi se iz potvrđenog stanja i trenutačne ovlasti. Ne zaključujte je iz položaja sljedeće stranice u čarobnjaku.

Kratka toast obavijest može pratiti rezultat, ali ne treba biti njegov jedini dostupan zapis kada korisnik mora kopirati identifikator, nastaviti operaciju ili razlikovati neizvjesno slanje od završetka. Ne prikazujte interne payloadove pružatelja ili osjetljive dokaze samo zato što ih rezultat sadrži.

## Odluke o neuspjehu i oporavku

| Situacija                                 | Odgovor prikaza i protokola                                             |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Nedostaje jedan preduvjet                 | Objasnite činjenicu izvora i točno rješenje                             |
| Pokrivenost je djelomična                 | Zadržite nepoznatu pokrivenost; izostanak nije spremnost                |
| Preduvjeti se promijene tijekom potvrde   | Backend ponovno provjerava; frontend prikazuje konkretno odbijanje      |
| Izgubljen je odgovor zapisa               | Prikažite neizvjesnost i koristite izvorni protokol potvrde/ponavljanja |
| Zapis je potvrđen, osvježavanje ne uspije | Sačuvajte potvrdu i ponudite oporavak osvježavanja                      |
| Pozadinska operacija je prihvaćena        | Prikažite prihvaćeno/čekanje do mjerodavnog završetka                   |
| Pristup je opozvan                        | Uklonite ograničene činjenice i poništite zastarjele radnje             |

Nakon provedbe rješenja osvježite odgovarajuću projekciju preduvjeta. Ne postavljajte lokalnu oznaku dovršenja samo zato što se korisnik vratio s druge rute. Uspješan upload i dalje može zahtijevati zaseban pregled, vezivanje ili prihvat.

## Prihvat i prečaci koje treba izbjeći

Otvorite blokiran zadatak: svaka stavka objašnjava izvor, stanje i provedivo rješenje. Učinite jedan izvor nedostupnim: panel prikazuje nepotpunu pokrivenost umjesto uspjeha. Riješite stavku i vratite se: samo osvježen mjerodavan dokaz mijenja spremnost. Naredba vrati prihvaćeno/čekanje: tekst ne tvrdi završni učinak. Izgubite odgovor nakon zapisa na poslužitelju: protokol potvrde sprječava dvostruku operaciju. Ne uspije kasnije osvježavanje: potvrđeni rezultat ostaje vidljiv.

Izbjegavajte uređive lokalne oznake dovršenja, zeleno stanje iz praznog polja, uspjeh izveden samo iz HTTP statusa, zavaravajuće brojeve djelomične pokrivenosti i generičke sljedeće radnje nevezane uz rezultat. Prikaz pomaže razumjeti činjenice; ne proizvodi ih.

## Izvori i porijeklo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppPrerequisiteList.tsx` — dokazni retci, pokrivenost, odgovorna osoba/rok/radnja i prikaz dovršenih stavki.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppTaskReceipt.tsx` — potvrđene činjenice i sljedeća radnja vlasnika; izgled uspjeha.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/AppTaskPresentation.ts` — prezentacijski ugovor preduvjeta.
