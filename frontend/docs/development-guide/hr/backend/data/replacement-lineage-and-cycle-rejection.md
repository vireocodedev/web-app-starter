# Podrijetlo zamjena i odbijanje ciklusa

Izričit graf podrijetla koristite kada zamjena zadržava neke identitete prethodnog izvora, ali uvodi nove lokalne identifikatore. Preimenovani redak, kopirani dokument ili najnoviji broj verzije ne dokazuju podrijetlo. Naredba koja koristi povijesni dokaz mora razriješiti točno podrijetlo i utvrditi dopušta li svaka međuzamjena takvu uporabu.

Ovaj referentni obrazac opisuje `DeliveryTimeLineage` iz Client Discoveryja; nije instaliran u starteru. Grane za vrijeme i fiksni iznos domenski su primjeri zadržanih veza zamjene. Prilagodite ugovor grafa umjesto kopiranja komercijalnih pravila prihvatljivosti.

## Razriješite veze umjesto nagađanja podrijetla

Vremenski `resolve` čita autorizaciju u opsegu projekta, zahtijeva podržanu vrstu izračuna odabranog retka i pamti posjećene UUID-jeve autorizacija. Ponovni posjet autorizaciji odbija obilazak. Nedostatak nastavka valjan je prvi korijen samo kada izvor pripada dopuštenoj korijenskoj vrsti i ne navodi zamjenu. Nedostatak dokaza za deklariranu zamjenu konflikt je, a ne dozvola za izmišljanje novog korijena.

Za zamjenu mora postojati točno jedan zadržani nastavak i točno jedno mapiranje zamjenskog retka. Zadržana referenca zamjene mora kanonski odgovarati predanoj referenci. Resolver prati mapirani prethodni redak, izvodi njegov korijen i zahtijeva podudaranje zadržanog korijenskog ključa veze. Postojeće činjenice podrijetla moraju se slagati i u korijenskom ključu, izvornom retku te kanonskom izvornom ugovoru.

`fixedOrigin` prati istu opću ideju, ali uspoređuje izvorni redak i izvorni ugovor umjesto stvaranja istog vremenskog korijenskog ključa. Ne pretpostavljajte da su sve provjere tih metoda jednake. `historicalAllowed` ide naprijed kroz zamjene te na svakom odabranom mapiranju traži izričitu dozvolu i jednak korijen. Za otkrivene cikluse, nedostajuća ili dvosmislena mapiranja i nedopuštenu povijesnu uporabu vraća false; druge pogreške čitanja izvora mogu se i dalje propagirati.

Ključno je odvojiti identitet od prihvatljivosti. Poznavanje izvornog izvora ne dokazuje da ga nova naredba još smije koristiti.

## Ograničite rad i odredite vlasnika snimke

Pregledani resolver odbija cikluse skupom posjećenih čvorova, ali nema izričitu maksimalnu dubinu acikličkog lanca ni proračun čitanja. Dug valjan lanac i dalje može iscrpiti stack, vrijeme ili kapacitet baze. Prilagodba treba ograničen iterativni obilazak, maksimalan broj čitanja i jasan ishod usklađivanja pri prekoračenju. Prekoračenje nije dokaz ciklusa ni nevaljanog podrijetla.

Konceptualni pseudokod, ne instalirani helper:

```text
while source declares a predecessor:
  require remainingBudget > 0
  require authorizationId not in visited
  remember authorizationId; consume one budget unit
  edge = requireExactlyOneScopedRetainedEdge(source)
  mapping = requireExactlyOneLineMapping(edge, selectedLine)
  require mapping agrees with retained root evidence
  source, selectedLine = mapping.predecessor
return validatedOrigin
```

Pozivatelj posjeduje granicu konzistentnog čitanja i upisa te brave potrebne pri zadržavanju rezultata. Helperov `retain` ponovno razrješava podrijetlo, provjerava označava li ID dokaza točno jednu prepoznatu vrstu dokaza, pa umeće uz izbjegavanje konflikta u opsegu. Sami ti koraci ne dokazuju transakcijsku izolaciju svakog pozivatelja. Pratite [transakcijske naredbe](../application-services/transactional-commands.md) i [zajedničke revizijske brave](revision-conflicts-and-shared-locks.md).

## Pogreške i oporavak

| Nalaz                                              | Odgovor                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| Deklarirana zamjena nema zadržanu vezu             | Blokirajte i uskladite dokaz; ne proglašavajte je korijenom.           |
| Podudaraju se dvije veze ili dva mapiranja         | Odbijte dvosmislenost; ne birajte najnoviji ili prvi redak.            |
| Ponovno se pojavljuje posjećena autorizacija       | Odbijte ciklus i sačuvajte dokaz za popravak.                          |
| Korijenski ključ ili izvorni ugovor odstupaju      | Odbijte naredbu bez prepisivanja starog podrijetla.                    |
| Na jednoj vezi nedostaje dozvola povijesne uporabe | Odbijte uporabu iako je korijen moguće razriješiti.                    |
| Aciklički obilazak prekorači proračun              | Prijavite nepotpuno razrješenje i koristite izričit postupak popravka. |

Tijekom popravka zadržite stare činjenice. Ispravljena veza treba dokaz s poznatim podrijetlom i izričitu politiku za consumere koji već navode stari lanac. Prepisivanje svih redaka podrijetla samo radi prolaska trenutačne naredbe uništava odnos koji graf treba očuvati.

## Scenariji prihvata i antiobrasci

Obuhvatite valjan korijen, više zamjena, samociklus, dulji ciklus, nedostajuću vezu, duplicirana mapiranja, referencu drugog projekta i odstupanje zadržanog korijena. Zasebno obuhvatite valjano podrijetlo s odbijenom povijesnom uporabom te predug aciklički lanac. To su željeni ishodi; čitanje izvora ne dokazuje izvršenje tih scenarija.

Izbjegavajte podrijetlo izvedeno iz naziva, uzimanje prvog podudaranja, rekurziju bez proračuna i tumačenje zamjene kao opće dozvole za sve stare dokaze. [Determinističke identitete s namespaceom](namespaced-deterministic-identities.md) koristite samo za imenovanje dokazanog korijena; imenovanje ne popravlja nedostajuće podrijetlo.

## Izvor

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryTimeLineage.java`
