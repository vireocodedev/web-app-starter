# Vežite pregled i export uz točnu zadržanu verziju artefakta

**Status podrške: potkrijepljen recept za projekt.** Discovery čuva pregledan sadržaj, reviziju i digest rendera te generirajućeg ugovora/templatea. Predložak nema ovu review/export domenu niti canonical JSON/signature okvir. Projekt određuje što se hashira i koja ovlast dopušta pregled/export.

Obrazac koristite kad odobrenje ili sljedeća radnja mora označiti točan pregledan sadržaj, ne današnji render promjenjivog nacrta. Digest identificira bajtove ili definiranu kanonsku reprezentaciju; sam ne dokazuje odobrenje, podrijetlo ili izvršnu ovlast.

## Zadržite pregledano značenje, ne samo boolean

Save pri ažuriranju povećava reviziju i čisti review polja, retained render i hashove. Review traži očekivanu aktualnu reviziju, validira nacrt i sprema Markdown, aktera/vrijeme, reviewed revision, workbook SHA-256 i contract/template SHA-256.

Model računa hashove iz učitanog UTF-8 source teksta. Paket time čuva generirajuće ulaze i prihvaćen izlaz. Export zaključava roditelja, traži reviewed=current revision, ponovno validira nacrt i vraća zadržani Markdown/digest umjesto današnjeg rerendera.

| Činjenica                | Pitanje                                        |
| ------------------------ | ---------------------------------------------- |
| Draft/review revizija    | Je li to isti nacrt?                           |
| Digest rendera           | Koji točan zadržan izlaz?                      |
| Contract/template digest | Koji generirajući izvori?                      |
| Reviewer/vrijeme         | Tko i kada je zabilježio pregled?              |
| Trenutačna ovlast        | Smije li ovaj akter sada pregledati/exportati? |

`reviewed=true` sam ne izražava te veze.

## Razlikujte export i jaču current-evidence provjeru

Read-only delivery-evidence dodatno uspoređuje retained contract/template s trenutačnim modelom i ponovno hashira workbook prije CURRENT_REVIEWED. Vidljivi guard običnog exporta revizija je i aktualna validacija; nemojte svim putanjama pripisati isti predikat odbijanja svake template promjene.

Projekt bira ostaje li stari pregledani artefakt povijesno exportable, poništava li novi template current execution eligibility ili svi exporti traže aktualne generirajuće izvore. Imenujte odvojene politike umjesto jednog univerzalnog reviewed booleana.

**Pseudokod recepta:** projekt implementira lock pohranu, reviewer ovlast, versioned generator, digest encoding i evidence shemu. Helperi nisu starter API.

```java
@Transactional
public ReviewStamp review(UUID id, long expectedRevision, Authentication auth) {
    var actor = authority.requireReviewer(auth);
    var draft = drafts.lock(id);
    revisions.requireExpected(draft.revision(), expectedRevision);
    var bytes = renderer.renderVersioned(draft).utf8Bytes();
    var stamp = new ReviewStamp(draft.revision(), sha256(bytes),
        renderer.contractDigest(), renderer.templateDigest(), actor.id(), clock.instant());
    artifacts.retainReviewed(id, bytes, stamp);
    return stamp;
}
```

Export zatim pod zaštićenom granicom provjerava odabrani stamp/content/currentness ugovor. Hash novog promjenjivog rendera ne zamjenjuje zadržani stvarno pregledani sadržaj.

## Eksplicitno odredite bajtove i kanonizaciju

Za datoteku/tekst encoding, line ending i svaki bajt mijenjaju digest. Obična JSON serijalizacija nije automatski kanonska: order, brojevi, omitted/null i Unicode mijenjaju bajtove. Definirajte/verzionirajte kanonski encoding semantičkog objekta ili namjerno hashirajte točne izdane bajtove.

Issued-package shema čuva payload i package/document digest vezane verzijom. `DeliveryJson` dodaje duplicate-key detekciju novom unosu bez prepisivanja starih retained bajtova. Strogo parsiranje i canonical serialization različita su jamstva; parser opcija ne daje standard kanonizacije.

Stari objekt ne parsirajte/serijalizirajte novom bibliotekom i zovite istim originalom samo zato što su poslovna polja jednaka. Kada je identitet ugovor, čuvajte izvorne bajtove i reprezentacijsku verziju.

## Kvar i oporavak

Draft promjena poništava aktualni review prema save politici. Retained digest mismatch dokaz je konflikta/korupcije, ne dozvola tihog regeneriranja i zamjene. Sačuvajte izvor, utvrdite vlasnika i po potrebi napravite novu pregledanu verziju.

Template/contract može poništiti current execution evidence dok povijesni artefakt ostaje. Jasno pokažite razliku. SHA-256 match ne daje deployment ovlast, external autentikaciju, pravno prihvaćanje ni sigurnost sadržaja; trebaju zasebni dokazi/ovlasti.

Izbjegnite review/export utrku s brisanjem, hash promjenjivog URL-a, client „approved hash” kao ovlast i novu kanonizaciju bez verzije/migracije. Odobrenje veže sadržaj i scope, ne ime datoteke koje kasnije pokazuje drugamo.

## Implementacija i kriteriji

- Draft promjena čisti/supersedira review prema reviziji.
- Review čuva točan sadržaj, input identitet i aktera/vrijeme.
- Export, history i execution imaju različite imenovane guardove.
- Promjena/korupcija retained payloada daje kvar bez tihog popravka.
- Encoding/kanonizacija su versioned; duplicate-key nije isto.
- Izdani sadržaj ostaje stabilan nakon serializer/template nadogradnje.
- Hash identitet odvojen je od ovlasti, potpisa, tajnosti i content sigurnosti.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationService.java` — save, review, retained export i jači evidence guard.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationModel.java` — source contract/template hash.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — SHA-256 UTF-8 teksta.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — retained issued payload/digest i version/project.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryJson.java` — strict duplicate-key samo novog unosa.
