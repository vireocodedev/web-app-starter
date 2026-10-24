# Provjerite prestanak effecta i očuvanje živog stanja pri pogrešci pohrane

Izvedena vrijednost signala i njegov effect pohrane imaju različite ugovore. Promjena može biti valjana i kada storage ne radi. Uklonjeni aplikacijski effect mora prestati spremati kasnije promjene. Granice provjerite neovisno umjesto samog poziva pretplate.

Ovo je **ugrađeni starter obrazac**. Estimate testovi pokrivaju normalizirane izvore, zbroj, tipiziranu hidraciju, status, disposal i quota pogrešku. Bootstrap provjerava hidraciju prije effecta i obrnuti redoslijed oslobađanja. To su pročitane tvrdnje, ne prijava izvršenja.

## Okidač i vlasništvo

Scenarije koristite za reaktivne effecte aplikacije, postavke i signal grupe. Modul posjeduje izvore, izvedeno stanje i akcije. Bootstrap pokreće i uklanja registrirane effecte. Test posjeduje početni storage, reset, vraćanje spyja i dobiveni disposer.

Estimate suite prije slučaja resetira izvore i status te poznatu sintetičku spremljenu vrijednost. Poslije vraća stanje i storage. React unmount sam ne resetira modulne signale.

## Provjerite prije i nakon disposal-a

Ovo je **neizvršeni neutralni pseudokod**, a ne ugrađeni helper:

```ts
const dispose = startPreferencePersistence();
try {
  changePreference("compact");
  expect(readPersistedPreference()).toBe("compact");
} finally {
  dispose();
}

changePreference("comfortable");
expect(readPersistedPreference()).toBe("compact");
```

Stvarni starter test pokrene effect, ukloni ga, promijeni sate i provjeri da default u pohrani ostaje. Tako izravno provjerava negativni ishod životnog vijeka. Brojanje poziva disposera promašilo bi curenje.

Zaseban test spyjem na `Storage.prototype.setItem` baca `QuotaExceededError`. Sati u memoriji se mijenjaju, a status postaje unavailable. Spy i effect vraćaju se u `finally`. To je pogreška upisa, ne dokaz svih JSON, read-security ili migration grana.

| Ugovor             | Korisna tvrdnja                                  |
| ------------------ | ------------------------------------------------ |
| Normalizacija      | Javna akcija daje valjane izvore                 |
| Izvod              | Zbroj prati normalizirane ulaze                  |
| Hidracija          | Oba izvora iz spremljenog tipiziranog zapisa     |
| Persistencija      | Storage i status prate promjenu                  |
| Disposal           | Kasnija promjena ne stiže storageu               |
| Nedostupan storage | Živa promjena i status nedostupnosti             |
| Bootstrap poredak  | Sva hidracija prije effecta, obrnuto oslobađanje |

## Pogreške i čišćenje

Disposere steknite u životnom vijeku testa i oslobodite i nakon pogreške. Vratite storage spy prije pripreme susjednog slučaja. Čistite relevantne ključeve, ne sve zadano. Fixture vrijednost treba odgovarati shemi osim kada je tema oštećenje.

Bootstrap poredak koristi male lažne module sa smislenim događajima. Ovdje je poredak ugovor jer hidracija mora prethoditi opažanju effecta. Nemojte to širiti na nebitan privatni slijed funkcija.

Pri novom modulu razmotrite ponovljenu inicijalizaciju, djelomičan startup i disposer pogrešku. Citirani testovi ne dokazuju univerzalnu idempotentnost ili rollback. Razvojna registracija uspoređuje se s `import.meta.env.DEV`; izostavljanje produkcijskih asseta treba zaseban dokaz.

## Scenariji prihvaćanja

Akcije mijenjaju izvod bez druge spremljene istine. Hidracija vraća točan par. Nakon disposal-a promjena ne dira storage. Upisna pogreška ne poništava valjan unos ni tvrdi saved. Svi moduli hidratiraju prije effecta i oslobađaju se obrnuto. Teardown ne ostavlja signal, spy ili pretplatu susjedu.

Za UI potrošača dodajte vidljivo ponašanje nedostupnosti i oporavka gdje ga feature obećava; sama signal tvrdnja ne dokazuje prijevod ni pristupačnost.

## Izbjegnite ove prečace

Nemojte resetirati samo DOM, pogrešku nazvati saved, nepotrebno spremati izvod ni brojati samo poziv disposal-a. Izvršite promjenu nakon čišćenja da dokažete učinak.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/applicationState/signals/estimate/sigEstimate.test.ts` — izvori, izvod, hidracija, disposal i storage pogreška.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/app/bootstrap/signals/initSignalEffects.test.ts` — poredak i razvojna registracija.
