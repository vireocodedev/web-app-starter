# Zapamćena prijava ima vlastiti istek i vezu s računom

**Status podrške: sigurnosni recept iz izvora.** FRED ima dugotrajni remember credential odvojen od kratke sesije. Predložak nema remember-me cookie, repozitorij ili restore. Projekt prije dodavanja treba eksplicitnu sigurnosnu i UX odluku.

Obrazac koristite za obnovu identiteta nakon isteka obične sesije. Zapamćeni identitet ne vraća operativni resource binding, native vezu ni stare privilegije i ne postaje tiho beskonačni sliding credential.

## Čuvajte verifier visokoentropijske tajne

Peer generira 32 random bajta i 43-znakovni unpadded base64url secret u zasebnom HTTP-only cookieju. Baza drži SHA-256 digest, user ID, account fingerprint, nastanak i fiksni istek. To je verifier slučajne bearer tajne, ne preporuka brzog hasha ljudske lozinke.

Restore provjerava sintaksu, hashira za lookup pa provjerava istek i trenutačni uporabljiv račun. Fingerprint uspoređuje kroz `MessageDigest.isEqual`. Pronađeni nevaljani/stari token briše i čisti cookie; missing lookup također ga čisti.

| Vrijednost         | Svrha                                          |
| ------------------ | ---------------------------------------------- |
| Browser secret     | Posjedovanje; ukraden ostaje bearer            |
| Stored digest      | Lookup/verifier bez plaintexta                 |
| Fingerprint        | Veza s odabranim aktualnim account činjenicama |
| Created/expiry     | Fiksni vijek neovisan o učestalosti čitanja    |
| Operativni binding | Zasebna ovlast koju token ne vraća             |

Izvor koristi 30 dana; to je peer politika, ne preporučeni vijek svakog projekta.

## Točno odredite promjene koje poništavaju restore

Fingerprint uključuje user identitet, password vrijednost/hash, email i company uz delimitere. Njihova promjena uzrokuje neuspjeh sljedeće usporedbe. Usability zasebno provjerava lock i potrebna polja. Role mora postojati, ali nije u fingerprintu; ne tvrdite da svaka role promjena tako poništava token.

To je lazy rejection pri restoreu, ne trenutačno brisanje svih sesija/token redaka nakon account promjene. Revoke presented credential uklanja taj token i cookie. „Svi uređaji” zahtijeva dodatni eksplicitni owner i implementaciju.

**Pseudokod recepta:** projekt implementira random issuance, digest shemu, fingerprint, secure cookie, žive ovlasti i session integraciju. Suradnici nisu API-ji predloška.

```java
public Optional<Account> restore(RememberCookie input) {
    var secret = syntax.requireBoundedToken(input.value());
    var token = tokens.findByDigest(digests.sha256(secret)).orElse(null);
    if (token == null) return Optional.empty();
    var account = accounts.current(token.accountId());
    if (!policy.usable(token, account, clock.instant())) {
        tokens.revoke(token.id());
        return Optional.empty();
    }
    return Optional.of(account);
}
```

Auth caller i dalje ispravno uspostavlja kratku sesiju, session/CSRF i spremljeni security context gdje treba. Peer metoda vraća račun; to ne dokazuje integriran remember tok prijave predloška.

## Objasnite fiksni istek i konkurenciju

Izvor namjerno ne rotira/produljuje pri svakom restore čitanju jer startup zahtjevi konkurentno šalju isti credential. Nekoordinirana rotacija može opozvati token drugom zahtjevu. Fiksni istek izbjegava tu utrku, ali isti credential vrijedi do isteka, opoziva ili fingerprint kvara.

Projekt može odabrati rotaciju s concurrency/grace politikom. Fiksni istek nije univerzalno bolji, a read-time produljenje mijenja najveći životni vijek. Cookie Max-Age i database istek moraju se slagati.

Cookie je HTTP-only, secure prema konfiguriranoj transportnoj politici, SameSite=Lax i path `/`. Session i remember imaju različite vijekove; nijedan ne ide u localStorage, običan payload ili log.

## Kvar i oporavak

Malformed, expired, revoked ili account-mismatched vraćaju običnu prijavu, ne povjerenje account ID-u cookieja. Korisnik ponovno veže operativni resurs trenutačnim ovlastima. Token ne autorizira caller tenant.

Logout/switch kroz auth owner opoziva namjeravani credential i briše cookie. Zasebno odredite sve uređaje i kratke sesije. Peer pri uspješnom izdavanju oportunistički briše expired retke; to nije dokaz potpune maintenance/retention politike.

## Implementacija i kriteriji

- Baza ima digest/fingerprint, nikad bearer secret.
- Istek i rotacija slijede eksplicitnu concurrency politiku.
- Password/email/company/role/lock semantika nije preuveličana.
- Nevaljan restore čisti stanje i sigurno vraća prijavu.
- Obnovljeni identitet stvara valjanu kratku sesiju, ne operativni binding.
- Logout, switch, jedan token i svi uređaji odvojene su politike.
- Cookie, retention, incident revoke i granice krađe imaju vlasnike.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotRememberService.java` — random, digest/fingerprint, istek, revoke i cookie.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotRememberToken.java` — verifier, račun i vremena.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotUserAccess.java` — zaseban account i controller binding.
