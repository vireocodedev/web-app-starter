# Razdvojite potvrđeno zapisivanje od pogrešaka promatrača

Nakon uspješne naredbe može zakazati osvježavanje predmemorije, obavijest, analitički callback ili promatrač roditeljske komponente. Ti problemi ne poništavaju poslužiteljski commit. Ishod naredbe modelirajte zasebno kako UI ne bi pozvao korisnika na ponavljanje već dovršene radnje.

Ovo je **referentni obrazac potrošačke aplikacije uz usporedbu dokumentacijske Contacts reference**. client-discovery-app ima mali `notifyMutationCommitted` utility koji izolira pogreške promatrača. Contacts referenca pod `docs/storybook/examples/Contacts/` koristi ciljanu invalidaciju kolekcije u `onSuccess`; ne ugrađuje taj utility ni opći protokol ishoda trajnih naredbi. Odlučite što feature treba umjesto pretpostavke da svaki omotač mutacije ima jače jamstvo.

## Okidač i vlasnik

Razdvajanje koristite kada zapisivanje ima bitne nepovratne učinke ili rizik duplikata, odnosno kada više UI promatrača treba reagirati na potvrdu. Vlasnik naredbe bilježi je li poslužitelj potvrdio rezultat. Svaki promatrač upravlja vlastitim nastavkom i oporavkom. Osvježavanje query predmemorije pripada projekciji čitanja, a ne transakciji koja je već završila udaljeno.

Imenujte barem tri faze: slanje naredbe, primitak potvrde i ažuriranje sekundarnih prikaza. Poslužiteljsko odbijanje pripada prvom ishodu. Pogreška osvježavanja nakon valjane potvrde pripada trećoj fazi. Izgubljen odgovor ili odgovor koji se ne može parsirati može ostaviti ishod neizvjesnim; nije automatski poznat poslužiteljski neuspjeh ni potvrđeni uspjeh.

Pregledani helper prima neobvezan callback. Hvata sinkrono bacanje pogreške i dodaje obradu odbijanja ako callback pri izvođenju vrati promise. Ne čeka promatrača i namjerno potiskuje njegove pogreške. Uređivač specifikacija poziva ga nakon uspješnog API rezultata, prije odluke je li generacija lokalnog uređivača još aktualna i prije prihvaćanja novog radnog prostora u taj uređivač.

## Učinite faze vidljivima u kodu

Slijedi **konceptualni pseudokod**, a ne starter API:

```ts
let result;
try {
  result = await commands.save(capturedEnvelope);
} catch (failure) {
  presentCommandFailureOrUncertainty(failure);
  return;
}

recordAcknowledgedResult(result);
acceptForCurrentOwner(result);
void refreshReadModel().catch(reportRefreshFailure);
void notifyOtherOwner(result).catch(reportObserverFailure);
```

Bitna granica jest uski `catch` naredbe. Kasnija pogreška promatrača ne smije završiti u grani koja zapisivanje označava neuspjelim i nudi novo slanje. Problem nastavka opišite točno, primjerice: „Spremljeno; popis se nije mogao osvježiti. Osvježite popis.” Trajni rezultat može dati identitet spremljenog zapisa ili sljedeću radnju dok se projekcija usklađuje.

Primjer pretpostavlja da je API vratio validiranu potvrdu. Ako parsiranje odgovora zakaže nakon mogućeg commita, sačuvajte neizvjesnost i koristite ugovor potvrde zahtjeva ili usklađivanja tog endpointa. Taj slučaj nemojte proglasiti spremljenim samo zato što je zahtjev napustio preglednik.

Izolacija nije dopuštenje za zanemarivanje opažljivosti. Referentni helper namjerno ignorira pogrešku promatrača; to može biti prikladno za neobveznu obavijest. Obvezna naknadna radnja treba vlastito stanje, ponavljanje i izvještavanje. Ako mora biti atomska s poslovnim zapisivanjem, pripada poslužiteljskoj transakciji ili pouzdanom poslužiteljskom procesu, a ne callbacku preglednika koji se predstavlja dijelom commita.

## Odredite značenje pogreške

| Ishod                                     | Činjenica za korisnika                          | Siguran oporavak                                           |
| ----------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Poslužitelj odbije validaciju             | Nema prihvaćenog rezultata naredbe              | Zadržite nacrt i ispravite polja                           |
| Poslužitelj prijavi zastarjelu osnovu     | Naredba odbijena zbog sukoba                    | Ponovno učitajte i uskladite                               |
| Potvrda se izgubi                         | Ishod commita neizvjestan                       | Koristite podržani identitet zahtjeva ili uskladite stanje |
| Potvrda postoji, osvježavanje ne uspije   | Zapisivanje dovršeno, prikaz možda zastario     | Ponovite dohvat                                            |
| Potvrda postoji, promatrač baci pogrešku  | Zapisivanje dovršeno, promatrač zakazao         | Oporavite promatrača zasebno                               |
| Vlasnik se promijeni prije obrade potvrde | Poslužiteljska činjenica može i dalje vrijediti | Preskočite stare učinke lokalnog uređivača                 |

Invalidaciju predmemorije tretirajte kao namjernu asinkronu granicu. Čekanje invalidacije u mutation callbacku može biti korisno ako feature namjerno zadržava pokazatelj spremanja dok novi prikaz nije spreman. Taj izbor prikaza ipak ne smije izbrisati razliku između potvrđene persistencije i neuspjelog osvježavanja. Pregledajte stvarno ponašanje biblioteke mutacija i ugovor callbacka prije obećavanja načina propagacije pogrešaka.

Dokumentacijska tvornica Contacts invalidira samo `ContactQueryKey.collection()`, što je korisno pravilo opsega. Sačuvajte to vlasništvo pri dodavanju razdvajanja ishoda; invalidacija svega povećava površinu pogrešaka i ne poboljšava semantiku potvrde.

## Oporavak i povratna informacija

Stanje ponovnog pokušaja osjetljivo na duplikate čistite prema ugovoru potvrđene naredbe. Ako je dovršetak poznat, nemojte zadržati generičku radnju ponovnog spremanja samo zato što je callback toasta bacio pogrešku. Ako je ishod neizvjestan, nemojte ukloniti identitet samo zato što je promise odbijen.

Roditeljski promatrač može trebati obavijest i nakon odlaska s uređivača, ako još ima valjanog vlasnika. Zakašnjeli rezultat djeteta istodobno ne smije resetirati zamjenski obrazac. Te učinke usmjerite zasebno i provjerite aktualnog vlasnika pri lokalnom prihvaćanju i prikazu povratne informacije.

Uspjeh, neizvjesnost i pogrešku osvježavanja lokalizirajte odvojeno. Važnu neizvjesnost prikažite trajnom porukom uz sadržaj kada bi je prolazni toast sakrio. Radnja ponovnog dohvata treba biti dostupna tipkovnicom i nazvana prema stvarnom učinku. Izbjegnite generički error banner koji proturječi trajnoj potvrdi uspjeha na drugom dijelu stranice.

## Scenariji prihvaćanja

Nakon uspješnog API poziva izazovite sinkronu pogrešku promatrača: naredba ostaje potvrđena. Ponovite s odbijenim promiseom promatrača: nema neobrađenog odbijanja ni poziva na dvostruko spremanje. Prekinite osvježavanje kolekcije nakon potvrde: nacrt se ne šalje ponovno, a korisnik može ponoviti dohvat. Odbijte stvarno zapisivanje: uspjeh se ne bilježi. Izgubite odgovor nakon mogućeg commita: prikažite neizvjesnost i siguran put usklađivanja. Promijenite rutu tijekom završetka: novi uređivač ostaje netaknut.

## Izbjegnite ove prečace

Nemojte poslužiteljsku naredbu i sve nastavke staviti u jedan nerazlikovan `try/catch`, svako odbijanje proglasiti neuspjelim spremanjem, sakriti stvarnu pogrešku zapisivanja ni premjestiti obvezni poslovni rad u neobvezne callbackove. Mali helper za izolaciju promatrača koristan je tek kada je granica ishoda već izričita.

## Izvori i podrijetlo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/utils/notifyMutationCommitted.ts` — izolacija sinkronih i asinkronih pogrešaka promatrača bez čekanja dovršetka.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — obavijest nakon potvrde, prije prihvaćanja u aktualni uređivač.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.mutation.ts` — ugrađena ciljana invalidacija kolekcije u mutation callbackovima.
