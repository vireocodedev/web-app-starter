# Prikazujte stranice i radnje prema izričitim ovlastima

Skrivena stavka izbornika ne štiti izravnu poveznicu ni API. Koristite jedan namjeran frontend rječnik ovlasti za prikaz, zasebno zaštitite ulazak na rutu i prepustite backendu autorizaciju svakog dohvata i naredbe prema trenutačnim činjenicama.

Ovo je **referentni recept uz kontekst ugrađenog startera**. Starterov `AppAuthGate` obrađuje učitavanje autentikacije i preusmjeravanje anonimnog korisnika. Ne ugrađuje LMS dopuštenja ni ovlasti resursa iz client-discovery-app. LMS je povijesni primjer centraliziranog tipiziranog kataloga dopuštenja, a CDA pokazuje projekcije resursa s ovlastima i dodjelama za pojedine radnje. Njihove poslovne uloge i dodjele nisu zadane postavke startera.

## Okidač i vlasništvo

Prikaz prema ovlastima koristite kada ljudi vide različite stranice ili izvršavaju različite radnje ovisno o identitetu, zaduženju, stanju resursa ili izričitoj dodjeli. Poslužitelj upravlja živom autorizacijom i dopuštenom projekcijom podataka. Frontend upravlja razumljivim prikazom opaženih ovlasti, uključujući učitavanje, zabranu, zastarjelost ovlasti i nedostupne radnje.

Odvojite opću mogućnost ulaska na stranicu od dopuštenja za pojedini resurs. Osoba može otvoriti Dokumente, a ipak ne smije arhivirati dokument A. Izbornik može koristiti ovlast stranice; radnja zapisa koristi poslužiteljsku ovlast za taj zapis. Nemojte ponovno konstruirati poslužiteljsku politiku iz naziva uloge i lokalnih pretpostavki.

U LMS-u `LMS_PERMISSIONS` povezuje tipizirane ključeve s ulogama, `lmsCan` je čista funkcija, a `useLmsCan` čita React autentikacijski kontekst. Route guard zasebno šalje anonimne korisnike na prijavu, a prijavljene bez dopuštenja na početnu stranicu njihove uloge. Time se centraliziraju odluke prikaza; to ne dokazuje poslužiteljsku provedbu ni opravdanost kopiranja povijesnih dodjela uloga.

## Povežite prikaz i provedbu

Za neutralni zapis ovo je **konceptualni ugovor featurea**, a ne ugrađeni API:

```ts
type DocumentView = {
  id: string;
  title: string;
  capabilities: {
    view: boolean;
    edit: boolean;
    archive: boolean;
  };
};

// Izbornik: prikažite odjeljak nakon utvrđene ovlasti stranice.
// Ruta: razriješite učitavanje, anonimnost i zabranu prije zaštićenog sadržaja.
// Radnja: zahtijevajte svježu ovlast arhiviranja prije potvrde.
// Poslužitelj: ponovno autorizirajte arhiviranje pri izvršenju naredbe.
```

CDA uređivač prima ovlasti i dodjele radnji iz dopuštene projekcije radnog prostora. Uočena ograničenja tretira i kao promjenu životnog ciklusa: poništava stare radnje i uklanja ograničene podatke. Ovlast nije vječan token dopuštenja, nego opažanje čija su svježina i vlasnik bitni. Poslužiteljska provedba nužna je i odmah nakon uspješnog dohvata.

Izgradnju ruta zadržite čistom. Provjere dopuštenja pripadaju kompoziciji ruta, vlasniku ovlasti stranice ili API operaciji, a ne graditelju URL-a. Tako nedopuštena izravna poveznica ostaje valjan URL s izričitim stanjem zabrane umjesto parsera koji prešutno mijenja odredište korisnika.

## Namjerno odaberite vidljivo stanje

| Stanje                                   | Prikaz                                                         | Poslužiteljska odgovornost         |
| ---------------------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| Autentikacija nije razriješena           | Učitavanje bez zaštićenog sadržaja                             | Razriješiti sesiju                 |
| Anoniman korisnik                        | Preusmjeravanje prema autentikacijskom ugovoru                 | Odbiti zaštićene API pozive        |
| Prijavljen korisnik bez ovlasti stranice | Objasniti zabranu ili koristiti sigurno odredište              | Provesti pristup podacima stranice |
| Zapis vidljiv, radnja nedopuštena        | Sakriti ili onemogućiti uz korisno objašnjenje                 | Odbiti nedopuštenu naredbu         |
| Osvježavanje ovlasti traje               | Zadržati siguran sadržaj, blokirati radnje koje traže svježinu | Odlučiti o ovlasti pri izvršenju   |
| Ovlast opozvana                          | Poništiti rad u tijeku i ograničene projekcije                 | Odbiti daljnji pristup             |

Skrivanje nebitne radnje često pojednostavljuje stranicu. Onemogućavanje vidljive radnje može pomoći kada korisnik može ispuniti preduvjet. Objašnjenje treba navesti nedostajući uvjet bez otkrivanja privatnih podataka. Onemogućeni tehnički identifikator dodjele ne smije biti jedino objašnjenje.

## Pogreške i oporavak

Razlikujte zabranu pristupa, prazne podatke i prolaznu transportnu pogrešku. Prazna kolekcija uspješan je autorizirani rezultat, a ne zamjena za 403. Privremeni neuspjeh dohvata također ne znači nužno gubitak ovlasti. API featurea neka stvarni ugovor odgovora prevede u izričita UI stanja.

Promijeni li se ovlast tijekom potvrde, prije slanja ponovno provjerite vlasnika operacije. Ako poslužitelj odbije zahtjev jer se ovlast promijenila kasnije, prikažite aktualnu zabranu i očistite podatke prema pravilima opoziva. Ponovno učitavanje ne smije koristiti predmemoriranu projekciju drugog korisnika.

## Scenariji prihvaćanja

Otvorite zaštićeni URL izravno, bez stavke izbornika: ruta i dalje provodi autentikaciju i zabranu. Dopustite odjeljak, ali ne arhiviranje: zapis ostaje čitljiv, a radnja se ne može izvršiti. Opozovite ovlast dok je potvrda otvorena: stara potvrda ne autorizira naredbu. Promijenite korisnika bez punog reloada: privatna projekcija prethodnog korisnika ne prikazuje se. Izravnim API pozivom izazovite poslužiteljsku zabranu: frontend vidljivost ne utječe na provedbu.

Lokalizirajte učitavanje, zabranu, preduvjete i nazive radnji. Objašnjenja onemogućenih stanja učinite dostupnima tipkovnici i pomoćnim tehnologijama. Nemojte se oslanjati samo na prozirnost ili boju; pri zabrani ostavite jasan naslov ili sigurnu navigacijsku radnju.

## Izbjegnite ove prečace

Nemojte koristiti vidljivost izbornika kao autorizaciju, ponavljati popise uloga po komponentama, izvoditi dopuštenje iz teksta rute, nedostajuću ovlast smatrati dopuštenjem ni svaki 404 pretvoriti u prazan resurs. Nemojte uvoziti povijesne LMS helpere u starter. Prvo definirajte ugovor ovlasti featurea i poslužiteljskog vlasnika pa ga dosljedno koristite kroz izbornike, rute i kontrole.

## Izvori i podrijetlo

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/auth/components/AppAuthGate.tsx` — ugrađena autentikacijska granica, odvojena od autorizacije resursa.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/setup/permissions/lmsPermissions.ts` — tipizirani ključevi, čista odluka i adapter React konteksta.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/setup/route-guards/LmsRouteGuardPermission.tsx` — zaštita prikaza pri ulasku na rutu, neovisna o izborniku.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — ovlasti resursa, dodjele radnji i opaženi prijelazi ovlasti.
