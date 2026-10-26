# Izričito odredite redoslijed koordinata i jedinice geometrije

**Podrška: referentni recept.** FRED koristi JTS geometriju i GeoTools izvoz. Te ovisnosti i API-ji nisu instalirana jamstva startera. Primijenite obrazac kada consumer uvodi točke, površine, prostornu pohranu ili izvoz za karte: ugovor mora reći što svaki broj znači prije pretvorbe i validacije.

## Na svakom seamu imenujte longitude i latitude

`GeometryUtils.createPoint(lon, lat)` stvara `Coordinate(lon, lat)` pomoću factoryja sa SRID-om 4326. X je longitude, a y latitude. `ShapefileUtils.createPointShapefileZip(latitude, longitude)` ima suprotan redoslijed parametara, ali stvara `Coordinate(longitude, latitude)`. Oba helpera interno daju isti poredak ako se ispravno pozovu. Pozicijski double parametri prikrivaju tu razliku.

Prednost dajte imenovanom consumer DTO-u i izričito nazvanoj pretvorbi. Slijedi **pseudokod** koji zahtijeva wire DTO, geometry adapter, validator koordinata i politiku projekcije. Neutralni helperi nisu instalirani.

```text
GeoPointInput { longitudeDegrees, latitudeDegrees }

toWgs84Point(input):
    requireFinite(input.longitudeDegrees, input.latitudeDegrees)
    requireRange(input.longitudeDegrees, -180, 180)
    requireRange(input.latitudeDegrees, -90, 90)
    return createPoint(x=input.longitudeDegrees,
                       y=input.latitudeDegrees, srid=4326)
```

Finite/range provjere zahtjevi su prilagodbe; navedeni `GeometryUtils` ih ne izvodi. Dodjela SRID-a metapodatak je, ne transformacija koordinata. Točka u projektiranim metrima ne postaje longitude/latitude dodjelom 4326. Zahtijevajte stvarnu transformaciju iz poznatog izvornog CRS-a ili odbijte ulaz bez potrebnog ugovora CRS-a.

## Odvojite kutne koordinate od fizičkih mjera

Longitude i latitude kutne su vrijednosti. Radijus, udaljenost ili površina mogu biti izraženi u metrima, kilometrima ili projektiranom koordinatnom sustavu, ali to se ne zaključuje iz Java `Double` tipa. Surface DTO ima `radius1`, `radius2` i `rotation` bez jedinice u imenu ili validacijskom ugovoru. Validator ograničava rotaciju elipse na 0 do 360 uključivo, ali ne definira potpuni mjerni model daljnjih izračuna.

Consumer treba odrediti jedinice radijusa, konvenciju i ishodište rotacije, kanonikalizaciju 360 na 0, koordinatni sustav geometrijskih operacija i pravilo omatanja longitudea. To su aplikacijske odluke, ne već provedena FRED jamstva. Planarne JTS operacije nad stupnjevima ne označavajte kao točne u metrima zato što postoji SRID 4326.

## Shape oznaka zahtijeva potpuni ugovor varijante

`SurfaceValidShapeValidator` zahtijeva shape string i prepoznaje circle, ellipse i polygon. Krug traži prisutan pozitivan prvi radijus; elipsa dva pozitivna radijusa i rotaciju u rasponu; poligon prisutan polygon. Za null DTO vraća true kako bi zasebna argument/field validacija posjedovala nullability. DTO koristi create/update grupe za identitet i druga obavezna polja.

Implementacija ne odbija sva polja drugih varijanti. Ne uspostavlja konačnost radijusa/rotacije, granice koordinata, nepraznu/ispravnu topologiju poligona, non-null DTO `centerPoint`, maksimum vrhova ili prostorni obuhvat. Obične usporedbe ne pokrivaju svaki nekonačan floating-point broj: pozitivna beskonačnost prolazi pozitivan radijus, a NaN može proći provjeru rotacije `< 0 || > 360`. Nullable Optional container također može prekršiti pretpostavke validatora ako ga mapper ostavi null.

Koristite tagged input model ili variant-aware validaciju s konačnim brojevima, obaveznim i zabranjenim poljima, granicama složenosti te smislenom topološkom politikom. Odredite odbijate li ili popravljate neispravne prstenove i mijenja li popravak dokaz/prikaz; nemojte prešutno popravljati geometriju bez ugovora. Non-null center u entitetu nije dokaz da svaki API DTO već sigurno validira to polje.

## Pogreška, oporavak i prihvat

Zamijenjene koordinate mogu i dalje biti unutar numeričkih raspona pa range provjera ne dokazuje redoslijed. Za adapter koristite asimetričan neutralan primjer, primjerice longitude 12 i latitude 48, te zahtijevajte x=12/y=48 kroz wire, pohranu i izvoz. Jednake vrijednosti skrivaju zamjenu.

Neispravne koordinate ili nepodržani CRS odbijte prije pohrane/izvoza i vratite sigurnu grešku polja. Topološka pogreška treba objasniti ugovor bez ispisa neograničene geometrije. Nedostajući podatak o projekciji traži izričitu korekciju izvora, ne pogađanje.

Slučajevi prihvata obuhvaćaju oba potpisa helpera, pogrešan CRS, NaN/beskonačnost, granične koordinate, nedostajući center, nulti/negativni radijus, kontradiktorna polja, prazne/samopresijecajuće poligone i broj vrhova. Dokažite da projekcija stvarno mijenja koordinate, a dodjela SRID metapodatka ne. Slijedite [točnu namjeru pisanja](./tolerant-readers-and-exact-write-intent.md) za absent/null/value i [potpune izvozne artefakte](../files/complete-multipart-export-artifacts.md) za objavu datoteka.

## Izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/core/geometry/GeometryUtils.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/core/utils/ShapefileUtils.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/surface/SurfaceDTO.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/surface/SurfaceValidShapeValidator.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/surface/Surface.java`
