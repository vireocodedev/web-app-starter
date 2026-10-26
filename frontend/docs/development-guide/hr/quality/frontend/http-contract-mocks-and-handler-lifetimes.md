# Mockajte HTTP na transportnoj granici uz ograničen vijek handlera

Kada provjeravate zahtjev, shemu, CSRF slijed ili klasifikaciju odgovora, zadržite stvarni klijent i presretnite HTTP. Zamjena API-ja običnom razriješenom funkcijom uklonila bi upravo ugovor koji trebate vidjeti.

Ovo je **ugrađeni starter obrazac**. MSW počinje bez zadanih handlera, odbija neobrađene zahtjeve, resetira scenarijske nadjačaje nakon testa i zatvara se nakon suitea. Auth API testovi postavljaju potrebne endpointe uz stvarne Axios i API tvornice. To su primjeri izvora, ne izvještaj izvršenja.

## Okidač i vlasništvo

Presretanje koristite za HTTP adapter i odabrane sastavljene frontend tokove. Test posjeduje handlere, sintetičke odgovore, zadržane zahtjeve i mutabilni store. Aplikacija serijalizaciju, zaglavlja, parsiranje i mapiranje pogreške. Mock server ne dokazuje stvarnu backend autorizaciju ni persistenciju; za to treba HTTP/database scenarij backenda.

Starter setup ima `listen({ onUnhandledRequest: "error" })`, React cleanup, `resetHandlers` i `close` u odgovarajućem vijeku. Reset handlera ne resetira proizvoljno stanje fixturea. Auth testovi zato zasebno resetiraju mock sesiju nakon svakog slučaja.

## Promatrajte stvarni odlazni zahtjev

Ovo je **neizvršeni neutralni primjer**, a ne novi ugrađeni handler:

```ts
let writes = 0;
server.use(
  http.post("https://api.example.invalid/documents", async ({ request }) => {
    writes += 1;
    const body = await request.json();
    expect(body).toEqual(expectedCommand);
    return HttpResponse.json({ id: "document-example" });
  }),
);

// Pozovite stvarni HTTP adapter pa provjerite ishod i writes.
```

Oblik odgovora treba proći stvarni schema parser osim kada namjerno provjeravate neispravnost. Nemojte castom preskočiti taj sloj. Odbijanje treba zadržati status i ugovor tijela, ne baciti nepovezanu JS pogrešku osim za mrežni kvar.

Ugrađeni auth suite mijenja CSRF tokene i provjerava zaglavlje prijave, odjave i druge mutacije. Nakon neuspjelog CSRF-a broji prijave i očekuje nula. Tako dokazuje slijed i zabranjeno slanje, ne samo spomen endpointa.

| Scenarij               | Transportni dokaz      | Ishod klijenta                 |
| ---------------------- | ---------------------- | ------------------------------ |
| Anonimna sesija        | 401                    | Null prema ugovoru             |
| Nevaljane vjerodajnice | Odbijena prijava       | Domenska credentials pogreška  |
| Nedostupan server      | 503                    | Nije pogrešna lozinka          |
| CSRF dohvat ne uspije  | Nema zaštićenog POST-a | Stvarna pogreška preduvjeta    |
| Nevaljana CSRF shema   | Runtime odbijanje      | Nema nezaštićene mutacije      |
| Nepoznat endpoint      | Nema handlera          | Vidljiv neuspjeh bez fallbacka |

## Pogreške i čišćenje

Koristite nadjačaj jednog endpointa, ne širok uspješan catch-all. Takav catch-all može sakriti krivu putanju i neočekivan dohvat. Origin i metoda trebaju biti točni; kodiranje, credentials i content type dio su ugovora gdje trebaju.

Za zadržani odgovor koristite signal početka i izričito otpuštanje umjesto spavanja. Cleanup treba razriješiti ili otkazati rad i nakon neuspjele tvrdnje. Reset handlera ne otpušta već čekajući promise.

Dijeljenje produkcijskih serializer helpera s mockom drži fixture usklađenim, ali može podijeliti istu pogrešku. Važne činjenice zahtjeva, granice polja i odbijenu nevaljanu shemu provjerite neovisno, ne samo round-trip slaganje.

## Scenariji prihvaćanja

Neočekivana putanja nema handler i ne uspijeva. Nevaljan sadržaj dolazi stvarnom parseru. CSRF neuspjeh daje nula zapisivanja. 503 se razlikuje od vjerodajnica. Reset nadjačaja vraća susjedni scenarij, a zaseban reset storea uklanja staru prijavu. Kasni odgovor nakon promjene vlasnika ne puni staru sesiju.

Fixturei trebaju biti sintetički, bez pravih računa i vjerodajnica. Dijagnostika neka navodi metodu, putanju i svrhu bez privatnih zaglavlja i sadržaja.

## Izbjegnite ove prečace

Nemojte mockati klijent čiji zahtjev provjeravate, dati univerzalni uspjeh, pretpostaviti reset storea resetom handlera ni mock uspjeh smatrati persistencijom. Granicu prilagodite tvrdnji.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/server.ts` — prazan scenarijski MSW server.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/setup.ts` — odbijanje neobrađenih zahtjeva i životni vijek.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts` — stvarne tvornice, zaglavlja i brojevi, nevaljani odgovori i reset sesije.
