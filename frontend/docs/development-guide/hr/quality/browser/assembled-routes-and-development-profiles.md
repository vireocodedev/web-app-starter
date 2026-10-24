# Provjerite sastavljene rute u profilu koji ih stvarno sadrži

Registar može izgledati točno dok browser pokaže krivi shell, zaglavlje, outlet, redirect ili build odredište. Reprezentativne rute otvorite kroz sastavljenu aplikaciju i razlikujte razvojni vodič od namjerno manjeg javnog builda.

Ovo je **ugrađeni starter browser obrazac**. Zasebne Playwright konfiguracije biraju build i development scenarije. Build konfiguracija koristi Vite build/preview s test ulazima, a vodič development server s mock API-jem. Datoteke su samo pročitane; nije pokrenut build, browser ni test.

## Okidač i vlasništvo

Koristite pri promjeni adresa, navigacije, autentikacijskog ulaza, breadcrumbova, DEV granice i responzivne navigacije. Metadata i route-object testovi korisni su za čista pravila, ali ne dokazuju stvarni raspored, fokus i render.

Build konfiguracija izostavlja documentation spec i filtrira Contacts primjere. Razvojna izričito bira documentation i Contacts projekte. `import.meta.env.DEV` određuje postoji li vodič; samo custom app environment oznaka ne čini build istim kao razvojni server.

## Zabilježite profil i granicu

Ovo je **neizvršeni dizajn scenarija**, a ne ugrađeni helper:

```text
Development profil:
  otvoriti vodič izravno i navigacijom
  provjeriti URL, naslov, kategoriju, outlet i aktivne poveznice

Build profil:
  otvoriti običnu rutu
  nema poveznica vodiča
  izravan guide URL -> izričit not-found
```

Razvojni spec provjerava kategorije bez tabova, breadcrumb kategorije, frontend odjeljke, uski lokalizirani prikaz i stare redirecte s upitom i fragmentom. Build spec provjerava odsutne poveznice i not-found izravnih adresa bez dokumentacijskih railova i tabova. To je jače od skrivenog izbornika.

| Promjena             | Browser dokaz                               |
| -------------------- | ------------------------------------------- |
| Nova adresa          | Izravan ulaz daje stranicu i naslov         |
| Roditeljski raspored | Kontekst, tabovi, breadcrumb i outlet       |
| Redirect             | Kanonski URL i namjerno čuvanje identiteta  |
| Aktivna navigacija   | Točan `aria-current`, uključujući potomke   |
| DEV ruta             | Postoji u DEV-u, ne postoji u buildu        |
| Auth tok             | Zaštićen ulaz slijedi session/return ugovor |

## Opseg mocka ostavite izričitim

Build browser fixture presreće sintetički API origin i implementira auth odgovore. DEV koristi aplikacijski mock način. Oba provjeravaju sastavljeni frontend, ne deployani backend, stvarne cookieje produkcijskog proxyja ni autorizaciju podataka.

Nemojte zamijeniti router ili stranicu kada je kompozicija tema. Nemojte ni zahtijevati stvaran poslovni sustav radi zaglavlja i outleta. Birajte sintetičku stabilnu granicu i točno opišite dokaz.

## Pogreške i održavanje

Odabir konfiguracije dio je pokrivenosti. Preimenovan test može ispasti iz grep projekta iako datoteka postoji. Pravila admissiona držite usklađenima ili namjerno uvedite izričit projekt/tag sustav. Nemojte pretpostaviti da DEV spec radi u default buildu.

Reuse postojećeg servera traži isti profil i origin. Krivi već pokrenuti način može dati lažni neuspjeh ili uspjeh. Pri odobrenom izvršenju zabilježite konfiguraciju i server način.

Rastom vodiča mijenjaju se brojevi kategorija, nazivi, ID-evi i primjeri. Tvrdnju i fixture ažurirajte prema ugovoru; povijesni broj nije trajno pravilo. Migraciju starih javnih adresa čuvajte namjerno, bez tihog uklanjanja pokrivenosti.

## Scenariji prihvaćanja

Duboka adresa i navigacija otvaraju isto. Stari upit i fragment preživljavaju namjeravan redirect. Kategorija ima točno zaglavlje i normalne breadcrumbove. Uska lokalizirana navigacija je upotrebljiva. Build ne pokazuje guide poveznice i izravne rute sigurno ne postoje. Odabir scenarija obuhvaća prave datoteke u pravom profilu; frontend mock nije end-to-end backend dokaz.

## Izbjegnite ove prečace

Nemojte provjeriti samo shape registra, sakriti link bez isključenja rute, pomiješati environment oznaku i DEV ni default execution prijaviti kao razvojni vodič. Sastavljeni profil dio je ugovora.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/playwright.config.ts` — build preview, odabir i server.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/playwright.development.config.ts` — DEV/mock projekti i razvojni server.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/documentation.development.spec.ts` — kategorije, breadcrumbovi, redirecti i prijevodi.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/application.spec.ts` — build isključenje i HTTP fixture frontenda.
