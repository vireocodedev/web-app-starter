# Imperativnom SDK-u dajte jednog vlasnika mountanog životnog ciklusa

Karte, grafovi, bogati uređivači i media prikazi često stvaraju objekte izvan Reacta. Instancu, DOM cilj, pretplate i asinkronu inicijalizaciju tretirajte kao jedan resurs s vlasnikom. Ponovni prikaz stranice ne smije stvoriti drugi neupravljani widget.

Ovo je **referentni recept** FRED OpenLayers integracije. Starter ne ugrađuje OpenLayers, `FredMap`, globalni event servis ni map kontekst. Neutralan adapter može objasniti životni vijek bez specijalizirane biblioteke u svakoj aplikaciji.

## Okidač i vlasništvo

Adapter koristite kada biblioteka traži mountani DOM cilj i daje imperativne metode ili listenere. Adapter upravlja stvaranjem i gašenjem, a feature domenskim vrijednostima i naredbama. Potrošač dobiva namjerno sučelje tek nakon uspješne inicijalizacije.

FRED stvara kartu nakon postojanja refa, omata je, izlaže kontekst i prikazuje djecu tek kad je spremna. Cleanup odvaja cilj. Event hook uparuje `on` i `off` istim ključem i listenerom. To su korisne granice vlasništva.

Povijesni provider također izlaže debug globale i potiskuje provjeru ovisnosti. Nemojte to kopirati kao zadano ni pretpostaviti da odvajanje cilja oslobađa sve workere, slojeve i pretplate. Pregledajte stvarni cleanup ugovor odabranog SDK-a.

## Uparite stjecanje i oslobađanje

Ovo je **konceptualni pseudokod**, a ne ugrađeni starter ili SDK API:

```ts
const instance = createWidget(mountedTarget);
const removeListener = instance.onChange(handleChange);

return () => {
  removeListener();
  instance.detachTarget();
  instance.disposeOwnedResources();
};
```

Točne metode ovise o biblioteci. Stabilizirajte callbackove gdje je bitna promjena pretplate i uklonite upravo registrirani callback. Zamjena cilja ili vlasnika treba osloboditi staru instancu prije objave nove. Asinkroni rezultat traži generaciju ili abort provjeru kako ne bi bio objavljen nakon unmounta.

Skup mutabilni SDK objekt nemojte stvarati pri svakom renderu. Nemojte ga ni sakriti u modulni singleton radi izbjegavanja životnog ciklusa; rute ili korisnici mogu dijeliti nenamjeravano stanje. Namjerni aplikacijski singleton moguć je samo s dokumentiranim vlasnikom i gašenjem.

| Prijelaz                         | Ponašanje adaptera                                |
| -------------------------------- | ------------------------------------------------- |
| Mount cilja                      | Jedna inicijalizacija aktualnog vlasnika          |
| Promjena podataka                | Ažuriranje postojeće instance definiranom metodom |
| Promjena listenera               | Uklanjanje starog i registracija novog            |
| Neuspjela inicijalizacija        | Oporavljiva pogreška bez lažne spremnosti         |
| Promjena vlasnika ili cilja      | Završetak starog vijeka i odbijanje zakašnjenja   |
| Unmount ili razvojno ponavljanje | Oslobađanje listenera, cilja, timera i resursa    |

## Pogreške i oporavak

SDK pogreška ne smije ostaviti djecu s non-null tvrdnjom nad neupotrebljivom instancom. Učitavanje, pogrešku i ponavljanje prikazujte prema stvarnoj spremnosti. Ponovni pokušaj nova je generacija; stara inicijalizacija ne može naknadno pobijediti.

Odvojite prikaznu pogrešku i persistenciju. Karta koja ne može nacrtati nacrt ne znači spremanje ni server odbijanje. Dajte pristupačnu alternativu ili jasnu nedostupnost, osobito kada je vizual nužan zadatku.

## Scenariji prihvaćanja

Mountajte, uklonite i vratite stranicu: nema dvostrukog canvasa, listenera, timera ni stare instance. Promijenite podatke: adapter ažurira bez nepotrebne izgradnje. Zamijenite listener: poziva se samo aktualni. Dovršite inicijalizaciju nakon navigacije: nema objave mrtvom vlasniku. Odbijte inicijalizaciju pa ponovite: spremnost i poruke ostaju istinite. Provjerite pristup tipkovnicom i bez vizuala umjesto pretpostavke da canvas osigurava pristupačnost.

Lokalizirajte učitavanje, pogreške, ponavljanje i kontrole. Veličinu cilja postavite izričito kako uspješno pokrenut widget ne bi bio nevidljiv zbog nulte visine.

## Izbjegnite ove prečace

Nemojte debug globale pretvoriti u runtime sučelje, ovisnostima sakriti vlasništvo, pustiti pretplate, stalno stvarati instance ni odvajanje DOM-a smatrati oslobađanjem svega. Svaki resurs treba imenovanog vlasnika oslobađanja.

## Izvori i podrijetlo

- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/providers/MapProvider/MapProvider.tsx` — cilj, inicijalizacija, spremnost, odvajanje i povijesna ograničenja globala i ovisnosti.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/hooks/useMapEvent.ts` — uparena registracija i uklanjanje listenera.
