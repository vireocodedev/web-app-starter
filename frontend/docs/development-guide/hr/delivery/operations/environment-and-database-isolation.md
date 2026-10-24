# Odvoji identitet okruženja od zamjene aplikacije

Staging i produkcija trebaju zaseban identitet, a baze trajan lifecycle kroz aplikacijska izdanja. Zamjena para slika ne smije značiti ponovno stvaranje baze ni korištenje tuđih vjerodajnica.

**Ugrađeni obrazac predloška.** `infrastructure/release/install.py`, `prepare.py` i `runtime.py` upravljaju zaštićenim postavkama, početnim database resursima i aplikacijskim Composeom. Release README je vlasnik instalacije/aktivacije; redovni release ih ne ponavlja.

## Okidač, vlasnik i ugovor

Koristi pri inicijalizaciji, alokaciji portova, database konfiguraciji i promjeni zamjene aplikacije. Operater upravlja slugom, hostnameom, portovima, zaštićenim datotekama, mrežama/volumenima i proxyjem. Aplikacijski vlasnik odgovara za prihvaćene slike.

Ugovor su dva hostnamea, četiri različita loopback app porta, odvojene database tajne/mreže/volumeni te odvojeni lockovi i stanje. App Compose koristi vanjsku mrežu vlastite baze. Zamjena mijenja par slika i čuva database projekt.

```text
PROJECT staging hostname              PROJECT production hostname
          |                                      |
 staging loopback app portovi           production loopback app portovi
          |                                      |
 frontend + backend par                  frontend + backend par
          |                                      |
 staging vanjska DB mreža                production vanjska DB mreža
          |                                      |
 staging trajni volumen                  production trajni volumen
```

To je mapa identiteta, ne dokaz mrežne zabrane za svakog host aktera. Host Docker ovlast ostaje privilegirana i pripada fiksnom operaterskom kodu.

## Zaštićeni identitet instalira se jednom

Instalacija traži čist točan committed root-controlled checkout sa zaštićenim ancestorima. Postojeći projekt odbija umjesto prepisivanja. Projekt dobiva settings/code/state direktorije, disabled unitove i source receipt.

Runtime validira poznata polja, slug/repository oblik, očekivane zaštićene putanje, točno staging/production, hostnames i četiri nepreklopljena porta. Ne može sam otkriti željenu domenu niti sigurno odabrati kapacitet kopiranjem template vrijednosti.

Svako okruženje dobiva drugu generiranu database lozinku i zaseban provisioning ulaz. Database Compose koristi vanjski imenovani volumen/mrežu bez javnog porta. PostgreSQL radi non-root s ograničenjima. Tajne nisu primjer u vodiču ili Actions varijabla.

## Preparation je čuvana jednokratna mutacija

`prepare.py` provjerava bind svih loopback portova, odsutnost proxy sitea i odsutnost ciljanih database resursa. Prije stvaranja labeled mreža/volumena trajno zapisuje točnu namjeru. Mountpoint novog volumena mora biti očekivan, nesymlinkan i prazan prije promjene ownershipa.

Prekid ostavlja marker koji zahtijeva inspekciju. Slijepi rerun instalacije ili brisanje markera može se sudariti s djelomičnim resursima. Slobodan port tijekom pripreme preduvjet je, ne trajna rezervacija protiv svih host procesa.

Proxy čuva `/api` i `/api/*` prema backendu, ostalo šalje frontend-u te dodaje `X-Vireo-Environment`. Prije reloada validira cijeli Caddy config i koristi project-specific site. Environment marker otkriva pogrešan routing, ali ne autentificira korisnika.

## Zamjena upravlja aplikacijom, ne bazom

Fiksni runtime generira app servise iz zaštićenih postavki i immutable para. Portovi se vežu na `127.0.0.1`, a backend ulazi u vlastitu DB mrežu. Tajne dolaze iz zaštićenog runtime env filea.

App servisi imaju zaseban Compose projekt i nepromjenjivi snapshot u release direktoriju. Baza je drugi projekt s vanjskim trajnim resursima. Normalni app `up` ne zamjenjuje PostgreSQL i ne briše volumen. Produkcijska zamjena dodatno ima backup/migration gate.

Environment lock serijalizira deployment i backup tog okruženja. Ne zamjenjuje request autorizaciju i ne daje čovjeku ovlast za proizvoljne paralelne host naredbe.

## Pogreške i odluke

| Opažanje                               | Odluka                                                          |
| -------------------------------------- | --------------------------------------------------------------- |
| Port koristi drugi projekt             | Odaberi novi; ne zaustavljaj nepovezani servis.                 |
| Staging koristi produkcijski DB env    | Ispravi izolaciju prije startupa ili migracije.                 |
| Marker pripreme postoji                | Pregledaj točne djelomične resurse bez brisanja stanja.         |
| App zamjena predlaže brisanje volumena | Odbij coupling; retencija podataka je zasebna odluka.           |
| Health zelen, environment marker drugi | Ispravi identitet proxyja prije prihvata.                       |
| Consumer kopira template host/ID       | Unesi odobrene projektne vrijednosti i provjeri stvarno stanje. |

## Prihvat i inspekcija

Pregledaj dva hostnamea, četiri porta, odvojene tajne i resurse te app/database ownership. Potvrdi odsutnost javnog DB porta i repository-provided mountova ili Compose naredbi.

Privatno zadrži source/config dokaze; nakon ovlaštenog releasea provjeri stvarne slike i javni marker. Povijesna aktivacija predloška nije readiness novog projekta. Članak ne instalira, priprema, reload-a proxy ili mijenja bazu.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/install.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/prepare.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
