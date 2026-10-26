# Objavite višedijelni izvoz tek kada su sve komponente dovršene

**Podrška: referentni recept.** FRED-ov point shapefile izvoz pokazuje razliku između zapisivanja datoteke i objave uporabljivog artefakta. GeoTools i taj helper nisu instalirane mogućnosti startera. Obrazac vrijedi za svaki format s više povezanih datoteka: odgovor predstavlja cijeli skup, ne prvu vidljivu komponentu.

## Dovršavanje resursa prethodi objavi artefakta

`ShapefileUtils.createPointShapefileZip` stvara privatni privremeni direktorij, definira WGS84 point shemu, zapisuje feature, zatvara transakcijski objekt, postavlja CRS sheme i disposea data store. Zatim zahtijeva postojeće neprazne `.shp`, `.shx`, `.dbf` i `.prj` datoteke prije otvaranja ZIP writera. Nazive kontrolira helper (`point` s poznatim ekstenzijama), ne korisnik.

Kod koristi `Transaction.AUTO_COMMIT`; izričit `commit()` ne predstavlja novu aplikacijsku transakciju ni protokol DB atomskosti. Korisna je granica oslobađanje writera prije provjere i pakiranja izlaza. Neprazni sidecari minimalna su provjera potpunosti formata, ne dokaz svih invarianata ili kompatibilnosti sa svakim čitačem.

ZIP nastaje u memoriji s jednom kontroliranom stavkom po obaveznoj komponenti i vraća se tek nakon zatvaranja ZIP streama. Time se ne vraća uspješan arhiv s namjerno izostavljenim obaveznim dijelom. Za veće izvoze consumer bira ograničenu memoriju ili owned staging pohranu. Neograničeni HTTP streaming može kasnu grešku pretvoriti u djelomičan odgovor nakon što su zaglavlja uspjeha već poslana.

## Razlikujte success cleanup izvora od potpunog lifecyclea

Na uspješnom putu brišu se poznate komponente i privremeni direktorij, uz `deleteOnExit` fallback. Ne postoji sveobuhvatni `finally` oko kreiranja direktorija, sheme, data storea, validacije, pakiranja i brisanja. Pad prije normalnog disposea može ostaviti store otvoren; greška sidecara ili ZIP-a može preskočiti prompt cleanup. Registracija direktorija za brisanje pri izlazu ne dokazuje promptno ili rekurzivno brisanje dodatnih sidecara ni ponašanje nakon pada procesa.

Novi kod ne treba kopirati taj nedostatak. Posjedujte cijeli privremeni workspace i jamčite close/dispose te cleanup na svim izlazima, uz očuvanje primarne greške ako cleanup također padne. Enumerirajte samo datoteke owned direktorija i uklonite sve svoje generirane komponente, ne proizvoljne susjedne putanje. Odredite politiku za ostatke nakon crasha; `deleteOnExit` je fallback, ne retention politika.

## Consumer granica izvoza

Sljedeće je **pseudokod**. Zahtijeva scoped autorizator, ograničeno čitanje ulaza, vlasnika privremenog workspacea, format writer, verifier komponenti, ograničen arhiv i response adapter. Ti API-ji nisu instalirani.

```text
authorizeExport(actor, scope)
workspace = createOwnedTemporaryWorkspace()
try:
    writer = openFormatWriter(workspace, explicitCrsAndSchema)
    try:
        writer.write(boundedRows)
        writer.finish()
    finally:
        writer.closeAndDispose()
    components = requireCompleteNonemptySet(workspace, requiredNames)
    requireTotalBytesWithinExportBudget(components)
    archive = buildClosedArchive(components, controlledEntryNames)
    return publishCompleteArtifact(archive)
finally:
    workspace.removeOwnedContents()
```

Ako je rezultat staged datoteka umjesto bajtova, izričito prenesite vlasništvo na lifecycle odgovora kako je cleanup ne bi obrisao prije dovršetka prijenosa. Ako treba trajna pohrana, objavite kroz privatnog artifact ownera tek nakon dovršetka. Koristite [privatna preuzimanja i projekcije](./private-downloads-and-metadata-projections.md), bez izlaganja filesystem putanje ili javnog export direktorija.

CRS, poredak koordinata, encoding, shema i dimenzionalnost pripadaju ugovoru izvoza. Javni FRED helper prima latitude pa longitude, a koordinata je longitude pa latitude. Slijedite [jedinice i poredak geometrije](../contracts/geospatial-units-and-coordinate-order.md). Projekcija se ne zaključuje iz naziva datoteke, niti se projektirane koordinate prešutno označavaju WGS84.

## Pogreška, oporavak i prihvat

Nedostajući ili prazan sidecar ruši cijeli artefakt. Ne vraćajte ZIP s preostale tri datoteke niti ponavljajte samo jednu bez writerova protokola oporavka. Izvoz se može ponovno proizvesti iz istog autoriziranog snapshota. Tvrdnja o determinističkom izvozu traži zaseban content/version ugovor jer se ZIP vremena i writer metapodaci mogu razlikovati.

Obuhvatite pad writera, kreiranja sheme, nedostajući/prazan sidecar, neočekivanu dodatnu datoteku, prekoračenje bajtova, pad zatvaranja ZIP-a, neuspjelo brisanje i prekinut odgovor. Svaki in-process pad treba osloboditi writer i ukloniti owned privremeni sadržaj, a djelomičan artefakt ne smije postati uspjeh. Nazivi ostaju kontrolirani i bez traversal mogućnosti. Potpunost komponenti ne zamjenjuje autorizaciju, konzistentan izvor ili granicu veličine izvoza.

## Izvor

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/core/utils/ShapefileUtils.java`
