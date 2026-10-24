# Deterministički identiteti s namespaceom

Deterministički identitet koristite kada različite naredbe moraju prepoznati isto nepromjenjivo podrijetlo bez stvaranja novog identiteta pri svakom ponavljanju. Identitet izvornog retka razlikuje se od identiteta zahtjeva, zamjenske verzije ili pokušaja obrade. Prije izbora hasha ili UUID helpera odredite koja činjenica ostaje ista.

Ovo je referentni obrazac iz Client Discoveryja, a ne instalirani starter API. `DeliveryTimeLineage.nameBytes` i `derive` identificiraju izvorni redak iz točno određene n-torke. Prenosiv je ugovor o bajtovima i njegov vijek; namespace, oznaka domene i posebna pravila prihvatljivosti tog consumera nisu zadane vrijednosti novih projekata.

## Vlasnik ugovora o identitetu

Izvor uključuje verzioniranu oznaku domene, identitet projekta, vrstu izvora, verziju izvora, digest paketa, autorizacijsku grupu i izvorni redak. Svako polje ima određenu poziciju. Svako se pretvara u UTF-8 bajtove kojima prethodi četverobajtna big-endian duljina u bajtovima. Zato `["ab", "c"]` i `["a", "bc"]` ne mogu slučajno proizvesti isti spojeni zapis. Brojanje Java znakova umjesto UTF-8 bajtova stvorilo bi drugi protokol za znakove izvan ASCII skupa.

Helper zahtijeva kanonski UUID tekst za izvorna UUID polja, provjerava digest odgovarajućim helperom, odbija pogrešnu vrstu korijena i zahtijeva neprazan redak. Ne pokazuje Unicode normalizaciju ni proizvoljne granice duljine retka. Pri preuzimanju obrasca ta pravila treba izričito odabrati i očuvati među jezicima.

`derive` hashira 16 bajtova fiksnog namespacea i zatim kodiranu n-torku pomoću SHA-1 te postavlja bitove UUID verzije 5 i varijante. To je determinističko imenovanje, a ne dokaz autentičnosti izvora ili ovlasti pozivatelja. UUID ne zamjenjuje zadržani dokaz izvora. Za odvojeni ugovor integriteta i odabira verzije pratite [digeste i pregledane verzije artefakata](digests-and-reviewed-artifact-versions.md).

## Mala prilagodba

Slijedi pseudokod protokola, ne starter helper koji se može importati:

```text
name = encodeLengthPrefixedUtf8([
  "SOURCE_LINE_IDENTITY_V1", scopeId, sourceKind,
  sourceVersionId, sourceDigest, sourceGroupId, originalLineId
])
identity = uuidV5(STABLE_APPLICATION_NAMESPACE, name)
```

Namespace pod vlasništvom aplikacije odaberite jednom. Uz činjenice koje o njemu ovise zadržite verziju protokola. Promjena redoslijeda polja, namespacea, normalizacije ili oznake domene stvara novi sustav identiteta čak i kada poslovni naziv ostane isti. Migracija mora opisati odnos starih i novih identiteta; tiho ponovno izvođenje svih zadržanih činjenica nije sigurno.

Promjenjive nazive, trenutačni status odobrenja, trenutačnog aktera i vrijeme pokušaja izostavite iz n-torke podrijetla. To su druge činjenice. Nasuprot tome, digest izvora namjerno razlikuje dva paketa s istim čitljivim nazivom. Nemojte ga ukloniti samo radi istih ID-jeva nakon promjene sadržaja.

## Pogreške i oporavak

| Situacija                                      | Odluka                                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ponovno stiže ista provjerena n-torka          | Izvedite isti identitet; zasebno autorizirajte pristup zadržanoj činjenici.                                    |
| Ista oznaka izvora sada označava druge bajtove | Razriješite točnu verziju i digest; ne koristite identitet temeljen samo na oznaci.                            |
| UUID tekst nije kanonski                       | Odbijte prije izvođenja; ne stvarajte drugi zapis istog značenja.                                              |
| Druga implementacija daje drugi rezultat       | Usporedite bajtove namespacea, redoslijed UTF-8 polja i duljinske prefikse prije promjene spremljenih ID-jeva. |
| Namespace ili kodiranje moraju se promijeniti  | Uvedite izričitu verziju i mapiranje kompatibilnosti umjesto prepisivanja podrijetla.                          |

Deterministički izračun ne serijalizira upise. Zadržavanje izvedenog identiteta i dalje traži jedinstvenost u opsegu, odgovarajuću transakciju i pravilo za proturječne dokaze. Tu granicu obrađuju [transakcijske naredbe](../application-services/transactional-commands.md). Neuspjeli upis može se ponoviti s istim podrijetlom; promijenjena namjera traži drugi ugovor naredbe, a ne nasumični dodatak.

## Scenariji prihvata i antiobrasci

Zahtijevajte isti rezultat za ponovljene kanonske n-torke, različito kodiranje dvosmislenih konkatenacija, ispravne UTF-8 duljine i izričito odbijanje nepodržane vrste izvora. Naredba mora odbiti i inače valjan identitet iz drugog opsega. Fixture kompatibilnosti treba otkriti slučajnu promjenu namespacea ili poretka bajtova; to su budući scenariji provjere, ne tvrdnje o izvršenim provjerama.

Izbjegavajte spajanje samo razdjelnikom, formatiranje ovisno o localeu, zadano platformsko kodiranje i nasumični namespace pri pokretanju procesa. Identitet ne nazivajte potpisom, ne koristite ga kao vjerodajnicu i ne zaključujte ovlasti iz njegova posjedovanja. Vlasnik izvornog nepromjenjivog izvora definira identitet; vlasnik svake naredbe i dalje određuje ovlasti i dopuštene prijelaze.

## Izvor

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryTimeLineage.java`
