# Prikažite čitljive dokaze prije točne odluke

Stranicu pregleda koristite kada osoba odlučuje na temelju određenog skupa vrijednosti, dokumenata ili verzioniranih dokaza. Koristan pregled čini te dokaze čitljivima i imenuje učinak odluke. Ne zaključuje pristanak iz pomicanja stranice, vremena čitanja, posjeta ruti ili otvaranja dijaloga.

Ovo je **referentni recept** prema Client Discoveryjevu `AppReadableReview`. Komponenta je prezentacijsko sučelje, nije ugrađeni izvoz predloška ni mehanizam odobravanja. Značajka i backend i dalje posjeduju protokol odluke.

## Odvojite prikaz pregleda od ovlasti odluke

Referenca prima naslov, neobavezan kontekst, uređene sekcije, neobaveznu oznaku sadržaja, dodatne detalje i odluku koju predaje vlasnik. Svaka sekcija ima stabilan ID, naslov, čitljiv sadržaj i neobaveznu lokalnu radnju. Prikazuje sve sekcije, neobavezne sidrene gumbe, zatim detalje i odluku nakon razdjelnika.

Komentar komponente izričito odbacuje potvrdu čitanja kao preduvjet odobrenja. Nema stanje dokaza čitanja, postotak pomicanja ni izračun ovlasti. To je korisna granica: ponovna uporaba prikaza pregleda ne smije izmišljati poslovne ovlasti.

Značajka posjeduje točan zapis/verziju koji se pregledava, trenutačne ovlasti, učitavanje, neuspjeh i naredbu. Backend mora pri primitku naredbe provjeriti žive ovlasti i očekivanu reviziju ili token dokaza. Prikaz dopuštene projekcije ne zamrzava ovlasti za budući klik.

## Vežite odluku uz nepromjenjivu osnovicu

Neutralan model odluke može odnos učiniti eksplicitnim. Sljedeće je **ilustrativni pseudokod protokola**, ne DTO koji predložak već isporučuje:

```ts
type ReviewBasis = Readonly<{
  documentId: string;
  expectedRevision: number;
  evidenceToken: string;
}>;

type PublishCommand = Readonly<{
  requestId: string;
  basis: ReviewBasis;
}>;
```

Zabilježite pregledanu osnovicu zajedno s prikazanim vrijednostima. Ne spajajte stari tekst s upravo osvježenim tokenom samo kako bi naredba uspjela. Kada se dokaz promijeni, prikažite zastarjelost i provedite prijelaz osvježavanja/pregleda koji definira vlasnik. Sačuvajte identitet ponavljanja nepromijenjene naredbe kada je potvrda neizvjesna, ako backend pruža podršku za potvrde.

Oznaka radnje treba imenovati stvarni učinak: „Objavi dokument”, „Prihvati reviziju” ili „Vrati na doradu”. „Nastavi” može biti navigacijska oznaka, ali ne smije skrivati poslovnu promjenu. Lokalizirajte oznake kroz vlasnika aplikacijskih prijevoda i po potrebi opišite opseg posljedice.

## Koristite sekcije koje se mogu pregledati i urediti

Prednost dajte čitljivim oznakama i formatiranim vrijednostima umjesto nestrukturiranog JSON-a. Sačuvajte značenje praznih vrijednosti, nedostupnih dokaza i pokrivenosti izvora; odsutnost nije dokaz da ništa nije potrebno. Dugi tekst treba se prelamati, tablice pomicati unutar spremnika, a datumi i brojevi slijediti lokalizacijska pravila aplikacije.

Sidrene kontrole reference pokazuju na generirane ID-eve naslova sekcija i koriste zajednički odmak ljepljivog zaglavlja. Pozivatelj predaje razinu naslova prema stranici koja sadrži pregled; podređeni naslovi slijede tu razinu. Koristite stabilne ID-eve sekcija za usklađivanje prikaza, ali generirana DOM sidra nisu trajni poslovni identifikatori.

Radnja uređivanja sekcije treba otvoriti odgovarajući editor i sačuvati kontekst zadatka. Definirajte povratak nakon uređivanja: spremljena revizija u pravilu poništava raniju osnovicu pregleda. Prezentacijska komponenta ne koordinira taj povratak umjesto vas.

Ne skrivajte bitne pregledane vrijednosti samo kako bi se gumb odluke pojavio ranije. Neobavezne tehničke detalje možete izdvojiti. Odluku prikažite nakon cjelovitog pregleda, uz pristup tipkovnicom i razumljiv redoslijed fokusa.

## Odluke pri neuspjehu i prijelazu

| Događaj                             | Potrebno ponašanje vlasnika                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| Podaci pregleda se učitavaju        | Prikažite čekanje bez djelatne zastarjele odluke                     |
| Pozadinski dohvat mijenja reviziju  | Označite osnovicu zastarjelom; ne zamjenjujte samo token             |
| Ovlasti su izgubljene               | Poništite odluke u tijeku i prema ugovoru uklonite ograničen sadržaj |
| Naredba je u konfliktu              | Odvojite konflikt od validacije i transportnog neuspjeha             |
| Poslužitelj potvrdi odluku          | Prikažite točno rezultirajuće stanje ili potvrdu                     |
| Osvježavanje nakon zapisa ne uspije | Sačuvajte potvrđen ishod i ponudite oporavak osvježavanja            |

Kada je potvrda opravdana, mora imenovati isti cilj i učinak kao naredba. Nakon čekanja korisničkog izbora ponovno provjerite uhvaćenog vlasnika. Dijalog otvoren pod starim ovlastima ne može učiniti kasniju radnju valjanom.

Ako posao stvarno zahtijeva izjavu, modelirajte namjerno imenovanu izjavu i zabilježite je na poslužitelju odgovarajućim protokolom. Ne izmišljajte je iz praćenja pomicanja ili prisutnosti ovog prikaza.

## Prihvat i prečaci koje treba izbjeći

Pregledajte dug sadržaj tipkovnicom: poveznice sadržaja dosežu ispravne sekcije, a bitne vrijednosti ostaju dostupne. Uredite sekciju i vratite se: prikazana revizija odgovara osnovici naredbe. Promijenite reviziju prije odluke: zastarjela naredba ne može prešutno prepisati ili odobriti nov dokaz. Izgubite pristup dok je potvrda otvorena: zastarjela lokalna radnja ne nastavlja se. Potvrđena odluka ostaje uspješna čak i ako kasnije osvježavanje popisa ne uspije.

Izbjegavajte generičke oznake slanja koje skrivaju učinak, osvježavanje samo tokena, lažne potvrde čitanja, posjet ruti kao pristanak i uspjeh prije potvrde poslužitelja. Prikaz objašnjava odluku; domenski protokol odlučuje smije li se zapisati.

## Izvori i porijeklo

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppReadableReview.tsx` — cjelovite čitljive sekcije, sidrena navigacija, lokalne radnje i položaj odluke; eksplicitna granica bez dokaza čitanja.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/AppTaskPresentation.ts` — ugovori sekcija pregleda i naslova.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — vezane vrijednosti i tokeni, generacije ovlasti i potvrda naredbe kao zaseban protokol vlasnika.
