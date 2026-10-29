# Razvoj API-ja i kompatibilnost

**Status podrške: ugrađena politika kompatibilnosti i frontend potrošački fixturei, uz razrađen postupak isporuke.** Trenutačni Spring-session adapter validira ulazne transportne odgovore i zapisuje eksplicitne naredbe. Njegovi fixturei kompatibilnosti provjeravaju taj klijent kroz MSW, a backend HTTP testovi zasebno provjeravaju proizvođača. Runtime-generirani OpenAPI opisuje trenutačna mapiranja i DTO-e prema workspace `README.md` uputama, odjeljak „Generated API documentation”. Ni generiranje sheme ni ovi fixturei ne dokazuju da su stare isporučene binarne verzije zajedno testirane.

Koristite ovu politiku prije promjene postojećeg zahtjeva, odgovora, ponašanja endpointa, validacijskog pravila, odluke autorizacije ili značenja pogreške. Frontend/backend vlasnici dijele pregled kompatibilnosti; Bruno odobrava nekompatibilne promjene i uvjete uklanjanja prije implementacije.

## Aditivna CRUD osnova

[Zajednički vlasnik pogrešaka](../foundation/validation-and-error-contracts.md) dodaje tri namjerna CRUD koda, a PageResponse je zasebna objavljena wire granica. Login/session/CSRF DTO-i, šest točnih auth ovisnosti i AppUser schema ostaju isti. Izvršivi Contacts endpointi postoje samo u testu; nisu novi deployed business endpointi ni dokaz mixed-version production matrice. Novi resursi dijele Request za POST/puni PUT, nose verziju u obveznom headeru i čuvaju tu namjeru pisanja.

## Namjerno sačuvajte ugrađeni ugovor

Trenutačne autentikacijske putanje ostaju pod `/api/auth`, bez segmenta verzije. Ovaj članak ne uvodi konvenciju `/v1` ni opću politiku imenovanja resursa. Zabilježite pogođenu metodu/putanju i stvarne pozivatelje umjesto prešutnog preimenovanja endpointa.

[AppAuthUser](../../../../../../frontend/src/app/auth/models/AppAuthUser.ts) validira neprazan tekst `id`, neprazan `displayName` i valjan `email`, uz uklanjanje dodatnih polja odgovora. [Spring-session adapter](../../../../../../frontend/src/app/auth/api/appAuth.api.springSession.ts) slično validira CSRF `headerName: "X-CSRF-TOKEN"` i neprazan token. Dodatni metapodaci mogu se zanemariti; nevaljane poznate vrijednosti ne mogu se tretirati kao uspješan odgovor.

Login serializer namjerno zapisuje samo `username` i `password`, čak i kada strukturno kompatibilan objekt pozivatelja sadrži dodatna svojstva. Odvojite dodatke odgovoru od namjere pisanja: nemojte širiti primljeni odgovor ili proizvoljan objekt forme u naredbu. Backend DTO validacija, autorizacija i ograničenja persistencije ostaju mjerodavni i kada frontend sužava svoje pisanje.

[Zajednički ugovor pogrešaka](../foundation/validation-and-error-contracts.md) također nosi ponašanje: podudaranje statusa/koda, dopuštena validacijska polja i klasifikacija autentikacije činjenice su ugovora. Tekst UI-ja dolazi iz lokalnih prijevoda; poslužiteljski `message` ne tumači se radi odabira ponašanja niti prikazuje. Sigurna promjena teksta unutar dokumentiranih granica razlikuje se od promjene strojnog koda, HTTP statusa ili vrste zahtjeva koji se klasificira kao nevaljani podaci za prijavu.

## Klasificirajte cijelu promjenu

| Predložena promjena                                                                                       | Odluka o kompatibilnosti                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dodavanje nepoznatog svojstva odgovoru                                                                    | Kompatibilno s oblikom trenutačnog tolerantnog čitača ako značenje poznatih vrijednosti i sigurnost ostanu isti. Novi potrošači i dalje trebaju politiku nedostajućeg polja na starijem backendu. |
| Preimenovanje/uklanjanje poznatog polja; promjena tipa, nullabilityja ili značenja skalara                | Nekompatibilno za postojeće potrošače osim ako eksplicitni prijelaz čuva njihov ugovor. Nedostajuća vrijednost i eksplicitni null zasebni su slučajevi.                                           |
| Dodavanje enum/kod vrijednosti                                                                            | Nekompatibilno osim ako je svaki podržani stariji čitač već obrađuje sigurno i namjerno; generički fallback ne dokazuje jednako poslovno ponašanje.                                               |
| Dodavanje obveznog polja zahtjeva, stroža validacija ili promjena značenja izostavljanja/nulla            | Nekompatibilno za pisače koji su prije stvarali valjane zahtjeve. Tijekom odobrenog prijelaza podržite stare naredbe.                                                                             |
| Promjena metode/putanje, statusa, koda pogreške, autorizacije, CSRF dohvata/rotacije ili ponašanja sesije | Pregledajte kao semantičku kompatibilnost čak i ako su nazivi JSON polja isti. Sigurnosna poboljšanja također zahtijevaju eksplicitnu migracijsku odluku.                                         |
| Pretvaranje projekcije odgovora u vraćanje svih polja kroz pisanje                                        | Odbijeno: dodatna polja odgovora ne daju dopuštenje za pisanje podataka u vlasništvu poslužitelja.                                                                                                |

[Recept tolerantnog čitača](tolerant-readers-and-exact-write-intent.md) i [referencu generiranog ugovora](generated-wire-contracts-and-schema-compatibility.md) koristite zbog njihovih načela, ne zbog nepostojećih API-ja. Ovaj predložak time ne dobiva Vireo generiranje, JsonNullable DTO-e ni sustav verzioniranih endpointa.

## Pregledajte čitače i pisače

Za konkretnu promjenu zabilježite podržane stare/nove verzije proizvođača i potrošača. Za dodatno polje odgovora i prijelazni ugovor zahtjeva:

| Kombinacija                   | Obveza čitača odgovora                                                                                                                             | Obveza pisača zahtjeva                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Stari klijent / stari backend | Sačuvati utvrđenu polaznu verziju.                                                                                                                 | Utvrđene naredbe i dalje rade.                                                        |
| Stari klijent / novi backend  | Poznata polja zadržavaju značenje; nepoznati dodaci ostaju sigurno zanemarivi.                                                                     | Novi backend i dalje prihvaća odobreni stari oblik naredbe.                           |
| Novi klijent / stari backend  | Izričito obraditi odsutnost novog polja pregledanim prijelaznim čitačem ili preduvjetom isporuke. Obvezno polje koje dopušta null nije opcionalno. | Slati samo polja koja stariji backend prihvaća dok nova mogućnost nije uspostavljena. |
| Novi klijent / novi backend   | Validirati predviđeni novi ugovor bez slabljenja poznatih polja.                                                                                   | Slati namjernu novu naredbu; poslužitelj je i dalje validira i autorizira.            |

Ova je tablica obveza pregleda, a ne dokaz izvršene matrice binarnih verzija. Navedite nepodržane kombinacije i preduvjet koji ih sprječava. Uparena isporuka imageova ne zamjenjuje trenutačno stare kartice preglednika, klijente u predmemoriji ni potrebne kandidate za rollback.

## Proširi → isporuči → suzi

1. **Odobrite zapis promjene.** Odredite stare/nove oblike i značenja, pogođene čitače/pisače, promjene sheme/podataka, podržane kombinacije, oporavak i kriterije uklanjanja. Nekompatibilne promjene ili nedostajuće obrasce predstavite Bruni prije implementacije; izmjene fixturea ne mogu dati to odobrenje.
2. **Najprije proširite kompatibilnost.** Sačuvajte stari backend ugovor uz dodavanje odobrene opcionalne mogućnosti ili prijelaznog ponašanja. Novi čitač mora imati eksplicitnu politiku za starije odgovore; nemojte prešutno prihvaćati nevaljana obvezna polja. Migracije uskladite s postojećim vlasnikom sheme.
3. **Isporučite prema postojećem ugovoru izdanja.** Validirajte kandidatski par na stagingu, sačuvajte njegov točan izvor/digeste i prihvaćene dokaze te isti par promovirajte u produkciju. [Postupak uparenog izdanja](../../delivery/releases/staging-and-production-promotion.md) ostaje mjerodavan; ova politika ne odobrava isporuku samo jedne komponente ni pokretanje workflowa.
4. **Provjerite podržani prijelaz.** Provjerite deklarirane kombinacije proizvođača/potrošača i relevantne zadržane podatke, predmemorije, sesije i pretpostavke rollbacka. Izvorni fixturei opisuju očekivanja kompatibilnosti; zasebno zabilježite potrebne stvarne dokaze isporučenih verzija.
5. **Sužavanje tek nakon eksplicitnog odobrenja.** Stara polja/ponašanje uklonite samo kada su odobreni uvjeti podrške potrošača i oporavka dokazivo zadovoljeni, a Bruno odobri uklanjanje. Sačuvajte zapis promjene/dokaza. Ovdje se ne uspostavlja univerzalno razdoblje zadržavanja ni automatsko jamstvo kompatibilnosti rollbacka.

Migracija može učiniti stari image nesigurnim čak i kada se njegov izvorni API fixture i dalje parsira. Koristite vlasnički migracijski/postupak oporavka i eksplicitnu operatorsku ovlast umjesto zaključivanja o sigurnosti rollbacka iz zadržanih digestova imageova.

## Potrošački fixturei i njihove granice

[appAuth.contractCompatibility.test.ts](../../../../../../frontend/tests/integration/auth/api/appAuth.contractCompatibility.test.ts) čuva zamrznute doslovne polazne fixturee sesije, CSRF-a i prijave neovisno o produkcijskim serializerima. Koristi stvarni Axios/klijentski adapter s HTTP handlerima u vlasništvu scenarija za pokrivanje:

- Utvrđenih session payloada i dodatnih polja odgovora; nedostajuća, null i nevaljana poznata polja identiteta ostaju pogreške.
- Postojećih CSRF metapodataka uz bezopasne dodatke; nevaljani poznati metapodaci blokiraju zaštićeni POST.
- Stabilnih kodova pogrešaka/klasifikacije unatoč promjeni poslužiteljskog teksta; nekompatibilni status ne skriva se poznatim kodom pogreške.
- Točne login serijalizacije `username`/`password`, content typea i CSRF zaglavlja, uz izostavljene dodatne strukturne podatke.

Postojeći [skup adapter testova](../../../../../../frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts) zasebno pokriva neuspjeli dohvat CSRF-a, uključujući preflight 401: ne slijedi login POST, a pogreška dohvata ne označava se pogrešno kao nevaljani podaci za prijavu.

Zadržite polazne literale neovisnima. Promjena očekivanja pregledana je promjena ugovora, a ne način brisanja regresije kompatibilnosti ili naknadnog odobravanja nekompatibilne promjene. Dodaci ugovoru trebaju nove kriterije prihvata bez prešutnog prepisivanja stare polazne verzije.

To su frontend potrošačke provjere nad sintetičkim HTTP odgovorima. [AuthIntegrationTests](../../../../../../backend/src/test/java/com/vireocode/backend/AuthIntegrationTests.java) zasebno provjerava backend proizvođača kroz stvarni HTTP/PostgreSQL. Zajedno daju komplementarne dokaze; ne pokreću frontend nad tim backendom niti izvode matricu starih isporučenih binarnih verzija. Za odobreno izvršavanje slijedite [MSW vlasništvo transporta](../../quality/frontend/http-contract-mocks-and-handler-lifetimes.md) i upute provjere repozitorija.

## Točni izvori

Izvori vezani uz reviziju utvrđuju postojeću osnovu proizvođača, životnog vijeka fixturea i isporuke; trenutačni codec i nove provjere kompatibilnosti povezani su ranije bez izmišljenih revizija.

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — polazni proizvođač prijave, CSRF-a i sesije.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/setup.ts` — životni vijek transportnih fixturea u vlasništvu scenarija.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md` — uparena nepromjenjiva izdanja i operatorsko vlasništvo oporavka.
