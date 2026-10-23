# Zajedno zadržite uređivane vrijednosti i tokene konkurentnosti

Pozadinsko osvježavanje ne smije zamijeniti korisnikov nacrt ni neprimjetno povezati noviju reviziju sa starijim vrijednostima. Zadržanu sesiju uređivanja koristite kada se zapis može promijeniti izvana dok je obrazac otvoren, osobito kada naredba šalje očekivanu reviziju ili javni token konkurentnosti.

Ovo je **referentni obrazac potrošačke aplikacije** client-discovery-app. Starterov `AppEntityFormMode` razlikuje stvaranje od ažuriranja i zahtijeva početne vrijednosti pri ažuriranju. Ne ugrađuje `usePinnedRecord`, ne definira pravilo udaljenih sukoba i ne pretvara svaki obrazac u uređivač s revizijama. Protokol prvo uvedite unutar featurea koji posjeduje uređivani zapis, a zajednički helper izdvojite tek kada za njega postoji stvarna potreba.

## Okidač i vlasnik

Vlasnik uređivača u featureu drži identitet odabranog zapisa, početne vrijednosti, tokene konkurentnosti, stanje izmjena i naredbu u tijeku. Obrazac drži trenutačne vrijednosti polja i validaciju. Query upravlja udaljenim opažanjima; novi rezultat ostaje opažanje dok ga uređivač izričito ne prihvati.

Čuvajte dvije reprezentacije: zadržani zapis na kojem je uređivanje počelo i posljednju primljenu projekciju. Potpis opisuje udaljene činjenice zbog kojih osnova uređivanja više nije aktualna. Za jednostavan zapis to može biti revizija. Izvedeni uređivač može ovisiti i o identitetu izvora, tokenu ili uvjetu spremnosti. Potpis mora namjerno predstavljati taj ugovor; identitet objekta nije dovoljan.

Pregledani helper bilježi `record`, `received` i `stale`. Prvo svježe opažanje popunjava zadržani zapis. Sljedeća svježa opažanja ažuriraju `received`, zadržavaju `record` i trajno označavaju `stale` kada se potpisi razlikuju. Operacija `accept` zamjenjuje oba zapisa i uklanja zastarjelost; `conflict` je označava nakon odbijene naredbe; `clear` uklanja sesiju. Zastarjelost ostaje označena čak i ako neko kasnije opažanje odgovara starom potpisu, pa je oporavak uvijek izričit.

## Sačuvajte jednu osnovu uređivanja

Za neutralni uređivač dokumenta ovo je **konceptualni ugovor stanja**, a ne API koji se može uvesti iz startera:

```ts
type DocumentBasis = {
  id: string;
  revision: number;
  title: string;
};
type EditorSession = {
  basis: DocumentBasis;
  values: { title: string };
  latest: DocumentBasis;
  stale: boolean;
};

// Osvježavanje mijenja latest/stale, ali ne basis ni values.
// Spremanje koristi basis.revision i values iz iste sesije.
// Izričito ponovno učitavanje zamjenjuje basis i values nakon odluke o odbacivanju.
```

Ako je obrazac otvoren na reviziji 7, rezultat s revizijom 8 ne smije promijeniti samo skriveno polje revizije na 8. Time bi se tvrdilo da je korisnik uređivao prema činjenicama koje nikad nije vidio. Pošaljite reviziju 7 ili zaustavite slanje i zatražite usklađivanje, prema pravilima naredbe. Poslužitelj i dalje provodi ugovor konkurentnosti; klijentska oznaka zastarjelosti služi prikazu i lokalnoj koordinaciji.

Nije svako osvježavanje razlog za odbacivanje unosa. Bezopasni udaljeni dodatak može sačuvati nacrt i prikazati upozorenje. Stvarni gubitak vidljivosti ili ovlasti ima prednost pred čuvanjem nacrta: uklonite nedopušten sadržaj i poništite zastarjele radnje. Zato pregledani uređivač razlikuje zadržane uređive činjenice od trenutačne projekcije ovlasti i vidljivosti. Njegova pravila projekcije specifična za proizvod nisu univerzalan algoritam spajanja.

## Odluke o svježini i oporavku

Sesiju popunjavajte samo opažanjem koje vlasnik smatra svježim i dopuštenim. Zadržani rezultat iz predmemorije može pomoći prikazu tijekom učitavanja, ali ne postaje automatski dokaz trenutačnih ovlasti. Referentni uređivač za svježu projekciju zahtijeva uspješan dohvat nakon mountanja i odsutnost aktivnog dohvata.

| Događaj                                | Lokalno ponašanje                                       | Sljedeća radnja                               |
| -------------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| Isti potpis, novi query objekt         | Zadržite vrijednosti i osnovu                           | Nastavite uređivati                           |
| Novi potpis uz izmjene                 | Sačuvajte nacrt, označite zastarjelost                  | Objasnite ponovno učitavanje ili usklađivanje |
| Poslužiteljski sukob                   | Zadržite koristan dopušten nacrt, označite zastarjelost | Dohvatite i izričito odaberite novu osnovu    |
| Ponovno učitavanje uz nespremljen unos | Zatražite odluku o odbacivanju                          | Zajedno prihvatite svježe vrijednosti i token |
| Gubitak ovlasti                        | Uklonite ograničeni sadržaj i stare naredbe             | Prikažite zabranu ili dopušteno odredište     |

Ponovno učitavanje zasebna je naredba sa svojim stanjem zauzetosti, a ne nuspojava prikaza upozorenja. Ako dohvat ne uspije, zadržite prethodni dopušteni nacrt i prikažite pogrešku s oporavkom. Uspješan dohvat resetira izmjene i identitet ponovnog pokušaja vezan uz staru osnovu. Ako biblioteka obrasca inicijalizira vrijednosti samo pri mountanju, koristite njezin izričit reset ili epohu uređivača pod nadzorom vlasnika; proizvoljna promjena propa nije dovoljna.

## Scenariji prihvaćanja

Provjerite obrazac s izmjenama na reviziji 7 i pozadinskim rezultatom revizije 8: uneseni tekst ostaje vidljiv, pojavljuje se upozorenje, a sljedeće spremanje nikad prešutno ne koristi reviziju 8. Osvježavanje s istim potpisom ne resetira fokus ni polja. Otkazivanje odbacivanja čuva vrijednosti i reviziju; potvrđeno ponovno učitavanje ažurira oboje. Sukob ne prikazuje uspjeh. Opoziv ovlasti uklanja ograničen sadržaj i uz nespremljene izmjene, a zakašnjeli odgovor ne smije ga ponovno popuniti.

Lokalizirajte upozorenja, ponovno učitavanje, odbacivanje i zabranu. Učinak objasnite vidljivim tekstom, ne samo bojom. Radnju oporavka smjestite uz upozorenje, a nakon izričitog resetiranja sačuvajte upotrebljiv fokus validacije i pogrešaka.

## Izbjegnite ove prečace

Nemojte resetirati obrazac pri svakoj promjeni queryja, osvježavati samo skrivene tokene, uspoređivati cijele transportne objekte bez razumijevanja njihove semantike ili koristiti upozorenje kao autorizaciju. Referentni hook nemojte pretvoriti u globalnu pohranu koja prenosi nacrte između korisnika. Najmanja korisna apstrakcija čuva jednu dosljednu osnovu uređivanja i izlaže izričite prijelaze prihvaćanja, sukoba i čišćenja.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/usePinnedRecord.ts` — zadržani zapis, primljena projekcija, usporedba potpisa i izričiti prijelazi.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — svježa opažanja, podaci konkurentnosti, ograničene ovlasti i ponovno učitavanje.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/forms/types/AppEntityForm.ts` — ugrađeni ugovor entitetskog obrasca bez protokola zadržanog zapisa.
