# Odvojeno upravljajte fixture stanjem, timerima i poslovnim satom

Determinizam ne znači zamijeniti svu raznolikost jednim globalnim mockom. Znači kontrolirati bitne ulaze: vijek fixturea, poredak odgovora, odgođeni rad, poslovno vrijeme, jezik i zonu. Svaki treba vlasnika da scenarij ne promijeni svijet susjednog.

Ovo je **ugrađeni starter obrazac s backend referencama**. Lookup API koristi neovisne fixturee i fake timere, formatter točne trenutke, locale i zone. CDA servisu daje fixed Clock, a kalendaru izričite granice. To su dizajni izvora, ne rezultati izvršenja.

## Okidač i vlasništvo

Koristite za prve pogreške, odgodu, istek, kalendarske granice, ID-eve i lokalizirani izlaz. Test posjeduje sintetičke ulaze i cleanup. Produkcijska apstrakcija određuje znači li vrijeme trajanje, datum ili aktualnu ovlast.

Starter lookup stvara zasebne API instance i provjerava njihovu prvu kontroliranu pogrešku. Jedan ne troši brojač drugog. Cancellation slučaj koristi fake timere, prekida pending i već prekinute zahtjeve, provjerava da timera nema i da abort nije potrošio namjerni prvi stvarni neuspjeh.

## Odaberite pravu kontrolu

Ovo je **neizvršeni dizajnerski pseudokod**, a ne ugrađeni helper:

```text
Odgođeni lookup:
  fake timer za transportnu odgodu
  promatrati odbijanje prije aborta ili otpuštanja
  pomaknuti samo rad scenarija
  vratiti stvarne timere

Pravilo isteka:
  injektirati fixed poslovni Clock
  provjeriti prije, na i nakon granice
  izričit locale i vremenska zona
```

Lažni JS timer ne kontrolira backend sat ili transakciju. Zadržani promise kontrolira poredak, ne proteklo vrijeme. Alat birajte prema tvrdnji umjesto globalnog zamrzavanja svega.

Lookup suite vraća real timere u `afterEach`. Vraćanje mora raditi i nakon odbijene tvrdnje. Nemojte slijepo pokrenuti sve timere uz ponavljajući schedule ili retry petlju; pomak i cleanup ograničite prema vijeku.

| Ulaz                      | Dizajn                          | Ograničenje                                |
| ------------------------- | ------------------------------- | ------------------------------------------ |
| Kontrolirana API pogreška | Novi fixture                    | Mock reset ne briše nužno closure brojač   |
| Mrežni poredak            | Start/release vrata             | Spavanje ne utvrđuje slijed                |
| Odgoda                    | Vlastiti fake timeri            | Stvarni I/O može trebati drugu granicu     |
| Poslovno sada             | Clock ili fixed instant         | Inače curi host sat                        |
| Kalendarsko razdoblje     | Zona, datum i sidro             | Sati nisu uvijek kalendarski dani          |
| ID                        | Sintetički identitet gdje treba | Globalni UUID mock može sakriti vlasništvo |
| Formatiranje              | Izričit jezik i zona            | Runtime i Intl verzija još utječu          |

## Datumi i fixturei trebaju semantiku

Starter formatter razlikuje UTC i Europe/Zagreb istog trenutka i traži valutu umjesto zaključivanja iz jezika. CDA kalendar uključuje prijestupnu obljetnicu, kraj mjeseca i DST. Zato sutra nije univerzalno sada plus 24 sata.

CDA attention fixture izravno daje fixed Clock suradnicima. Za novo poslovno pravilo birajte namjernu injekciju vremena umjesto refleksije i realnog čekanja. To ne znači da svaki povijesni servis već ima isti konstruktor.

Jedinstveni ID-evi mogu izolirati bazu bez nasumičnog očekivanja. Provjerite odnose i vraćene ID-eve gdje odgovara, a točan sintetički ID kada je identitet ugovor. Ne kopirajte prave skupove podataka radi uvjerljivosti.

## Pogreške i scenariji prihvaćanja

Dva fixturea neovisno ne uspijevaju. Abort ne ostavlja timer ni troši sljedeći scenarijski ishod. Odbijena tvrdnja i dalje vraća timer i spy. Vrijeme radi prije, na i poslije isteka pod istim satom. Mjesec, prijestupna i DST granica čuvaju dogovorenu semantiku. Locale i zona su izričiti. Promjena poretka slučajeva ne nasljeđuje brojače, storage ni sat.

Nemojte snapshotima fiksirati nebitne timestampove. Točnost tražite kada je ugovor točan, a odnos ili raspon kada je to stvarni ugovor. Nemojte povećavati toleranciju samo da pogrešna pretpostavka prestane padati.

## Izbjegnite ove prečace

Nemojte spavati za poslovni istek, dijeliti scripted singleton, ostaviti fake timere, pretpostaviti zonu računala ni globalno ukloniti randomness bez razmatranja skrivenih problema. Determinizam dolazi iz smislenih ulaza s vlasnikom.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/features/development-guide/patterns/forms/api/asyncLookup.api.test.ts` — instancne pogreške, timeri, abort i vraćanje.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/app/localization/formatters.test.ts` — instant, locale, zona i valuta.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/discovery/AttentionServiceTests.java` — injektirani fixed Clock fixture.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/discovery/ServiceCalendarTests.java` — kraj mjeseca, prijestupna, točan trigger i DST.
