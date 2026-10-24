# Uvoz datoteke tretirajte kao naredbu s izričitim ishodom

Odabir datoteke, slanje bajtova, prihvaćanje uvoza i primjena zapisa različiti su koraci. Definirajte što API potvrđuje i prikažite rezultat iz kojeg se vidi promjena i potreban ispravak. Dovršen browser upload nije automatski uspješan poslovni uvoz.

Ovo je **referentni recept s potrebnim proširenjima protokola**. LMS šalje `File` kroz multipart API, validira vraćeno polje entiteta, daje lokaliziranu povratnu informaciju i invalidira zahvaćene queryje. Mali sinkroni hook ne dokazuje asinkrone jobove, odbačene retke, idempotentne potvrde ni sigurnosnu validaciju datoteke. Te ugovore dodajte izričito kada trebaju.

## Okidač i vlasništvo

Vlasnika uvoza koristite za ograničen format koji mijenja server stanje. Obrazac posjeduje datoteku i opcije. API posjeduje multipart i shemu odgovora. Backend posjeduje autorizaciju, byte i content granice, parse, domensku validaciju, atomsku ili djelomičnu politiku i trajni identitet ishoda. Prikaz daje čitljive brojeve, pogreške i sljedeće korake.

Ekstenzija i browser MIME samo su smjernice, ne server validacija. Objavite format i veličinu, ali provedite ih na serveru i parseru. Privatne retke ne stavljajte u opću dijagnostiku ni proizvoljne server putanje u download poveznice.

## Imenujte ugovor ishoda

Ovo je **predloženi neutralni rezultat**, a ne ugrađeni LMS odgovor:

```ts
type ImportResult =
  | { state: "accepted"; jobId: string }
  | {
      state: "completed";
      importId: string;
      applied: number;
      rejected: number;
      issues: { row: number; field?: string; code: string }[];
    };

// accepted -> pratite ili dohvatite točan ishod joba.
// completed -> potvrda, ciljano osvježavanje i put ispravka.
```

Odaberite atomski uvoz ili izričito djelomično prihvaćanje. Ako jedan nevaljan redak odbija sve, recite to prije slanja i pri pogrešci. Ako se valjani primijene, rezultat mora točno objasniti poznate ishode. Inače ispravljena datoteka može ponoviti već primijenjene zapise.

Pregledani LMS API izravno vraća schema-provjereno polje entiteta, pa hook API uspjeh uzima kao sinkronu mutacijsku granicu. Nemojte to pretvoriti u dokaz bogatije potvrde pojedinih redaka ili joba. Na novom job endpointu 202 je samo prihvaćanje.

| Ishod                                 | UI                              | Pravilo ponavljanja                             |
| ------------------------------------- | ------------------------------- | ----------------------------------------------- |
| Nema datoteke ili lokalno nepodržana  | Objasnite zahtjev               | Naredba nije poslana                            |
| Server odbije sadržaj ili format      | Sigurna korisna pogreška        | Ispraviti datoteku ili opcije                   |
| Odgovor izgubljen                     | Neizvjestan ishod               | Uskladiti ili koristiti podržani isti identitet |
| Job prihvaćen                         | Identitet obrade                | Pratiti job, ne stvarati drugi slijepo          |
| Djelomičan dovršetak                  | Opseg primijenjenog i odbijenog | Samo dokumentirana deduplikacija                |
| Dovršetak potvrđen, refresh ne uspije | Zadržati potvrdu                | Ponoviti čitanje, ne uvoz                       |

## Pogreške i oporavak preuzimanja

Spriječite dvostruko slanje tijekom rada. Abort ne dokazuje rollback nakon dolaska bajtova na poslužitelj. Stabilan retry traži server potvrdu vezanu uz stvarnu datoteku i opcije; novi UUID pri svakom kliku nije dovoljan.

Izvještaj odbačenih redaka treba vlastitu autorizaciju i vijek. FRED ZIP-to-TIFF helper pokazuje blob URL, privremeni anchor i revokaciju na uspješnom putu. Bira prvi odgovarajući zapis arhive i ne dokazuje sigurno opće raspakiravanje. Nemojte ga kopirati kao neograničen import pipeline. Ograničite proširenje arhive, odaberite zapise prema formatu i oslobodite URL i anchor cleanupom sigurnim pri pogrešci.

## Scenariji prihvaćanja

Server odbija preveliku ili nevaljanu datoteku i kada ime prolazi browser. Izgubite odgovor nakon mogućeg commita: UI ne ponavlja automatski s novim ID-em. Prihvaćen job prikazuje obradu do konačnog dokaza. Djelomičan rezultat jasno odvaja primijenjeno i odbijeno, bez duplikata ispravkom. Pogreška refresha ne poništava potvrdu uvoza. Odlaskom s rute kasni feedback ne mijenja novi uređivač, a privremeni download resursi oslobađaju se.

Lokalizirajte format, obradu, nazive retka i polja, dovršetak, neizvjesnost i oporavak. Rezultat zadržite dulje od toasta te omogućite tipkovnicu za sažetak i sigurno preuzimanje.

## Izbjegnite ove prečace

Nemojte MIME smatrati zaštitom, upload poistovjetiti s primjenom, automatski ponavljati proizvoljan uvoz, djelomičan ishod sakriti uspjehom ni izložiti server putanje. Poslovni ishod treba izričit ugovor naredbe.

## Izvori i podrijetlo

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/failureReport/features/failureRecipient/hooks/mutations/useFailureRecipientImportCsvMutation.tsx` — File granica, prijevodi i ciljano osvježavanje.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/failureReport/features/failureRecipient/api/failureRecipient.online.ts` — multipart i provjeren sinkroni odgovor entiteta.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/utils/downloadTifFromZip.ts` — specijalizirano preuzimanje arhive, resursi i granice primjera.
