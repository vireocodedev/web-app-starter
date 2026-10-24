# Delegiranu ovlast ponovno veži uz aktualni principal

Sačuvani grant mora pripadati odobrenom računu i opsegu. Kontakt, trenutačna prijava ili stari approval nisu dovoljni ako kontakt može prijeći drugom računu.

**Source-backed reference recept.** `CommercialGrantPolicy` i `ServiceGrantPolicy` iz Client Discoveryja provode opažene provjere. Nisu instalirani starter API; purpose/action modele prilagodi neutralnom resource/workspace slučaju.

## Okidač, vlasnik i ugovor

Koristi za delegaciju, membership promjenu i background rad sa sačuvanom ovlasti. Grant owner definira purpose, scope, akcije, vrijeme i revoke. Identity owner definira aktualni contact-account odnos.

Ugovor je captured authority plus current effectiveness. Postojanje granta je povijest, ne trajna dozvola za bilo koju naredbu.

## Captured i current identitet

Grant čuva principal user ID, a join daje current user ID kontakta. Policy traži jednakost. Interaktivni tok dodatno traži isti actor i enabled račun.

```text
grant: kontakt + captured principal + scope/actions/window
                           |
             current binding i enabled account
                           |
                command-specific odluka
```

Kontakt ovlašten za A kasnije je povezan s B. B ne nasljeđuje A grant, a A ga ne koristi dok binding odstupa. Pregledaj/reissueaj ovlast bez prepisivanja captured principal historyja.

Jednakost je trenutačna, ne povijest svih rebindova. Ako svaka međupromjena trajno poništava grant, treba dodatni binding generation/version ugovor. Izvor sam ne dokazuje tu jaču politiku.

## Potpun scope i vrijeme

| Dimenzija | Izvor                                                     |
| --------- | --------------------------------------------------------- |
| Validity  | `valid_from <= now`, `valid_until > now`, null bez kraja. |
| Revoke    | Zapis revokacije poništava efektivnost.                   |
| Akcija    | Mora biti u captured listi.                               |
| Principal | Current/captured match i interaktivni actor/enabled.      |
| Resource  | Application/line i purpose-specific odnosi.               |

Creation provjerava action dependencies i dopuštenu svrhu. To nisu univerzalne business role za kopiranje.

Query entitlement ima vlastitu svrhu. Current SQL zahtijeva bound enabled račun, dok pojedini external recipient/evidence tokovi dopuštaju unbound kontakt kad su oba principal ID-a null. Nisu svi kanali identični.

## Neinteraktivna ovlast mora biti izričita

External evidence može namjerno biti bez interaktivnog actora. I dalje vrijede window, actions, binding i enabled captured račun ako postoji. To ne dopušta unauth HTTP naredbu ili korisnički `external=true` bypass.

Prilagodba treba trusted entrypoint/channel, dokaz vlasništva, resource binding i audit. Admin override na pozivatelju zasebna je odluka, ne implicitna delegacija.

## Pogreške i odluke

| Opažanje                              | Odluka                              |
| ------------------------------------- | ----------------------------------- |
| Principal promijenjen                 | Odbij use i review/reissue.         |
| Actor sada ima kontakt, nije captured | Nema nasljedstva granta.            |
| Točno valid-until                     | Expired half-open prozor.           |
| Prava akcija, pogrešan resource       | Scope mismatch.                     |
| Background bez actora                 | Samo definirani trusted kanal.      |
| Query i command odstupaju             | Pregledaj namjenu, ne širi slijepo. |

## Prilagodba i prihvat

Treba spremište/revokacija, current join, command auth, vrijeme i transakcija/lock. Izvor ne jamči atomsku autorizaciju preko vanjskog provider poziva.

Pregledaj rebind, disabled, revoke, time boundary, wrong action/resource i namjerne external slučajeve. History ostaje immutable; jača generation politika posebno se navodi. Članak ne izdaje grant niti mijenja račun.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CommercialGrantPolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceGrantPolicy.java`
