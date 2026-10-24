# API ključevi: javni selektor i jednokratna tajna

**Status podrške: sigurnosni recept iz izvora.** LMS izdaje machine credential s lookup selektorom i zasebno hashiranom slučajnom tajnom. Predložak nema API-key autentikaciju, upravljanje ključevima, machine scope ili legacy filter. Implementirajte zaseban pregledan machine-principal ugovor, ne implicitnu prilagodbu browser sesije.

Obrazac koristite za opozivni partnerski/automation pristup bez ljudske lozinke. Lookup i secret provjera različite su odgovornosti: javni selektor pronalazi red, posjedovanje tajne autentificira.

## Razumijte izdani format

Peer generira 12 random bajtova selektora i 32 tajne, oba unpadded base64url. Format je `pk.<selector>.<secret>`, uz generirane duljine 16 i 43 znaka. Prefix i duljine peer su protokol, ne default predloška.

Samo tajna BCrypt hashira se. Red čuva selektor, hash, active/revoked/expiry i metapodatke. Obični DTO nema hash/plaintext; issuance DTO vraća plaintext samo pri issue/rotate. „Prikazano jednom” znači da se ne čuva za ponovni dohvat, ne dokazuje zaštitu svakog cachea/loga.

| Vrijednost               | Obrada                                            |
| ------------------------ | ------------------------------------------------- |
| Selektor                 | Javni lookup ID; database unique                  |
| Tajna                    | Visokoentropijski bearer; samo pri izdavanju      |
| Hash                     | Spremljen verifier, nikad list/response polje     |
| Type/scope               | Eksplicitna machine autorizacija                  |
| Last-used/revoked/expiry | Trenutačni lifecycle, ne samostalna autentikacija |

Entitet deklarira unique selector, a generator precheck kolizije. Flyway projekt provodi stvarni constraint i insert-race oporavak; precheck nije dovoljan.

## Zajedno provjerite lifecycle i tajnu

LMS parsira prefix i tri dijela, traži selector, odbija inactive/revoked/expired pa encoderom provjerava tajnu. Uspjeh ažurira last-used. Parser traži nonblank dijelove, ali ne provodi sve generirane duljine/charset. Strogi input-size/syntax, rate limit i sigurna dijagnostika dodatno su hardening, ne tvrdnja izvora.

**Pseudokod recepta:** projekt implementira parser, credential shemu/migraciju, verifier, živi scope, principal i filter chain. To nisu importi predloška.

```java
public MachinePrincipal authenticate(String rawKey) {
    var parts = keys.parseBounded(rawKey);
    var row = credentials.findBySelector(parts.selector()).orElseThrow(InvalidKey::new);
    row.requireActiveAndUnexpired(clock.instant());
    if (!secrets.matches(parts.secret(), row.secretHash())) throw new InvalidKey();
    return authority.currentMachinePrincipal(row);
}
```

Peer filter stvara poseban principal/external-API authority, null credentials, poziva chain i čisti Security context u `finally`. Ne određuje consumer endpoint scope niti dokazuje starter wiring. Odaberite machine rute/radnje i odvojenu browser-session/CSRF politiku.

## Izričito rotirajte i opozovite

Rotacija opoziva stari red i izdaje novi selector/secret u transakcijskom toku. Opoziv sprema inactive, vrijeme i aktera. Novi secret ne ostavlja tiho oba aktivna. Eventualno kontrolirano preklapanje zasebna je odluka, ne prikazana rotacija.

Management ima zaštićenog vlasnika: peer kontroler administrator-gated je. Projekt ipak treba vlastite žive ovlasti, audit, issuance no-store i siguran prijenos/pohranu. Tajna ne ide u URL, analitiku, iznimku ili obični audit payload.

## Kvar i oporavak

Izgubljen jednokratni odgovor ne rješavajte reveal endpointom. Autorizirano opozovite/rotirajte i prenesite zamjenu odobrenim kanalom. Leak selector/hasha ne otkriva izravno bearer, ali traži incident procjenu; hash ne ukida kompromitaciju.

Skupa hash provjera treba bounded rate/input. Valjan key ne daje proizvoljni tenant: principal ima trenutačni scope, a operacije ga provode. Key type nije resource autorizacija.

## Implementacija i kriteriji

- Nepredvidive tajne i stvarni database unique selector.
- Metadata/list DTO nema plaintext ni hash.
- Malformed, revoked, expired i pogrešna tajna sigurno odbijaju.
- Rotacija poništava stari credential prema overlap politici.
- Machine auth ima rute/ovlasti i context cleanup.
- Izdavanje ima current management ovlast, cache/log zaštitu i lost-response oporavak.
- Rate/input i tenant scope implementirani su, ne izvedeni iz BCrypta.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyService.java` — generation, hash, lifecycle, rotacija i parser.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKey.java` — unique selector i state/verifier.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyDTO.java` i `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/IssuedPartnerApiKeyDTO.java` — metadata i jednokratni plaintext.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyAuthenticationFilter.java` — principal i cleanup.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyController.java` — zaštićen management.
