# Autentikacija i sesija

Autentikacija je aplikacijska infrastruktura u `src/app/auth`. Posjeduje ugovor
sesije, provider, zaštitu ruta, UI prijave, pravila povratne putanje i adapter za
Spring Session backend. Nije produktna značajka i ne pripada u `src/features`.

## Runtime sesije i istek

`createAppAuthRuntime()` prima konfigurirani Axios i Query klijent. Stvara API
sesije, opcije upita i mutacija, pomoć pri prijavi u mock okruženju te jednu
politiku zamjene sesije. Prijava, odjava i istek sesije otkazuju starije čitanje
sesije prije objave nove sesije, uklanjaju ne-auth Query podatke i čuvaju
mjerodavni auth upit za promatrače providera. Prihvaćeno anonimno čitanje sesije
obavlja isto čišćenje podataka vezanih uz identitet bez vlastitog otkazivanja.
HTTP interceptor koji prepoznaje odgovor isteka pripada auth adapteru, ne
generičkoj Axios konfiguraciji.

Prihvaćena sesija čiji se korisnički ID razlikuje od spremljene sesije također
je prijelaz identiteta, uključujući promjenu zajedničkog kolačića u drugoj
kartici. Runtime otkazuje i uklanja ne-auth upite prije objave novog korisnika,
a provider ponovno montira zaštićeno podstablo. Osvježavanje istog korisnika
čuva podstablo i stanje značajki. Neuspjelo pozadinsko osvježavanje također čuva
već prihvaćen identitet i obnovljive nacrte; u fatalnu granicu prikaza ide samo
početno učitavanje bez prihvaćene sesije.

## Provider, zaštita i adapter ljuske

`AppAuthProvider` izlaže runtime auth komponentama i hookovima. `AppAuthGate`
štiti autentificirane rute i čuva sigurnu povratnu putanju.
`AuthenticatedAppShell` usmjerivačev je adapter koji autentikacijski neutralnoj
ljusci daje akcije računa.

## Razvojni mockovi i pravi backend

Razvojni mock način pokreće determinističke MSW auth handlere prije stvaranja
runtimea. Mock vjerodajnice i pomoć pri prijavi pripreme su, a ne produkcijske
zadane vrijednosti. Pokretanje produkcijske aplikacije odbija mock API način, a
produkcijski paket izostavlja pokretanje workera; postavite
`VITE_API_MODE=http` prije pokretanja izgrađene aplikacije.

Za pravi backend prilagodite putanje, serijalizaciju, normalizaciju odgovora,
ponašanje `401` i potvrđeni CSRF ugovor u
`src/app/auth/api/appAuth.api.springSession.ts`. UI prijave privremeno obrađuje
predane vjerodajnice, a adapter ih serijalizira za zahtjev. Aplikacijski
JavaScript ne čita niti upravlja autentikacijskim kolačićima ili tokenima i ne
sprema vjerodajnice ni autentikacijske tokene u pohranu ili Signale.

## Granica ovisnosti

Autentikacija ne uvozi razvojne mockove, Signale ni usluge pohrane. Testovi
mogu instalirati scenarijske MSW handlere kroz vrhunski testni poslužitelj.
