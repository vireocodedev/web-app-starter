# Potpisani cursori vežu paging uz semantički opseg

**Status podrške: referentni recept s eksplicitnim ograničenjima skaliranja.** Client Discovery `DeliveryPaging` autentificira cursor prema akteru, projektu, kontekstu kolekcije i vidljivoj projekciji. Trenutačno materijalizira vidljivu kolekciju prije izrezivanja stranice. To nije ugrađen cursor API predloška ni dokaz skalabilnog SQL keyset paginga.

Koristite obrazac kad se continuation token ne smije zamijeniti među korisnicima/kolekcijama ili paging treba odbiti promijenjenu projekciju umjesto tihog nastavka drugog rezultata. Autentifikacija, svježina i učinkovitost upita odvojeni su dijelovi ugovora.

## Vežite značenje, ne samo zadnji ID

Izvorni cursor nosi domain, actor, project, kind, context, filter slot, zadnji sort ključ, istek i projection fingerprint. Filter slot ovog helpera trenutačno je prazan string; ne tvrdi da već veže proizvoljnu pretragu i filtre. Projekt koji ih dodaje mora namjerno uključiti kanonsko značenje.

Payload se kanonizira, kodira base64urlom i autentificira HMAC-SHA256. Helper pri čitanju provjerava dva dijela, očekivani potpis uspoređuje kroz `MessageDigest.isEqual`, dekodira payload i provjerava očekivana polja prije nastavka. Zatim provjerava istek i fingerprint trenutačne vidljive projekcije.

| Vezivanje                | Spriječeni kvar                              |
| ------------------------ | -------------------------------------------- |
| Akter i projekt          | Token drugog računa/opsega                   |
| Domena, vrsta i kontekst | Pozicija jedne liste primijenjena drugoj     |
| Kanonski filtri          | Drugo značenje upita uz isti nastavak        |
| Cijeli zadnji sort ključ | Dvosmislen nastavak jednakog vremena/naziva  |
| Fingerprint projekcije   | Nastavak nakon promjene definirane kolekcije |
| Istek                    | Neograničeno korištenje starog paging stanja |

Valjan potpis nije autorizacija. Prije paginga ponovno izračunajte trenutačnu vidljivost; token ne daje pravo koje je račun izgubio.

## Potpisano nije šifrirano

Posjednik cursora može base64-dekodirati sadržaj. HMAC čuva integritet i autentičnost pod ključem, ne povjerljivost. Token ne sadrži privatne countove, tajne labele, credentials ili skrivena polja. Fingerprint može vezati stanje bez objave sadržaja, ali zahtijeva namjernu definiciju nad dopuštenom projekcijom.

**Pseudokod recepta:** `cursorCodec`, `authority`, `projection` i `Page` predložene su granice projekta. Prije prilagodbe implementirajte kanonski payload, ključeve, tipizirane kvarove, dopušteni upit i stabilni poredak.

```java
public Page next(Query request, Authentication auth) {
    var actor = authority.requireCurrent(auth);
    var visible = projection.forActor(actor, request.scope(), request.filters());
    var token = cursorCodec.verify(request.cursor());
    token.requireScope(actor.id(), request.scope(), request.filters());
    token.requireFresh(visible.fingerprint());
    return visible.after(token.lastSortKey(), request.limit());
}
```

To ne znači da `visible` treba materijalizirati svaki red. Skalabilna implementacija mora autorizirano filtriranje i seek predikat provesti ograničenim database upitima te odrediti izračun svježine bez neograničenog full scana.

## Pokažite stvarni kompromis poretka i svježine

Izvor sortira retained zapise po kronologiji i identitetu, uključujući recipient identitet kada treba, silazno; opcije po nazivu i identitetu uzlazno. Tuple nosi dovoljno značenja za izjednačenja. Promjena projekcije daje 409; nevaljan, izmijenjen ili scope-mismatched token daje 400; istek ima zaseban 409 razlog. Limit 100 i trajanje 900 sekundi peer su pravila, ne univerzalni defaulti.

Fingerprint pokriva cijelu dopuštenu sortiranu payload kolekciju. Namjerno otkriva više od inserta prije cursora: promjena vidljive projekcije može ga poništiti. UI treba ponuditi novu prvu stranicu uz očuvane filtre, umjesto ignoriranja kvara ili prikaza prazne kolekcije.

Cijena je bitna: helper dohvaća vidljive retke i retained kronologiju, sortira i hashira kolekciju pa u memoriji filtrira nastavak i primjenjuje limit. Mala stranica ne ograničava prethodni rad. Logički keyset nastavak nije tvrdnja učinkovitosti database keyseta.

## Trajanje ključa i oporavak zahtijevaju dizajn

Izvor generira nasumičan 32-bajtni ključ za životni vijek komponente. Helper nema konfigurirani shared key ring ili key ID. Restart poništava stare cursore, a neovisne replike stvaraju nekompatibilne potpise. Kopirana implementacija zato ne jamči preživljavanje promjene rutiranja među replikama.

Projekt kojem treba kontinuitet mora dizajnirati zajednički zaštićeni ključ, rotaciju, prihvat starih ključeva, istek i incident invalidaciju. To su nedostajuće odluke implementacije, ne postavke predloška. Promjena ključa ne opravdava prihvat nepotpisanih cursora ili izostavljanje actor/scope provjere.

## Kriteriji za buduću implementaciju

- Izmjena tokena i zamjena aktera/projekta/kolekcije/konteksta/filtara odbijaju se bez privatnih detalja.
- Istek i promjena projekcije razlikuju se od nevaljanog tokena te nude oporavak prvom stranicom.
- Jednake primarne sort vrijednosti nastavljaju bez duplikata/preskakanja prema ugovoru svježine.
- Token ne nosi povjerljiva polja; ovlasti se provjeravaju svaki put.
- Restart i replike slijede dokumentirano vlasništvo ključa, ne slučajno process-local ponašanje.
- Tvrdnja skaliranja obuhvaća query granice i cijenu fingerprinta, ne samo malu stranicu.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryPaging.java` — autentificirani payload, scope polja, constant-time usporedba, istek, fingerprint, process-local ključ i in-memory stranica.
