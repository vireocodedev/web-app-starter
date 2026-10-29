# Izvršivi referentni feature i izolacija

**Status podrške: ugrađena osnova i izvršivi primjer samo za testove.**

Izvršivi Contacts primjer postoji samo u testovima. Pokazuje ugrađenu CRUD osnovu bez isporuke demonstracijske poslovne funkcionalnosti u consumer aplikaciji.

## Čitajte stvarni feature

[Referentni izvori](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactService.java) nalaze se u neutralnom `referencefixtures.contacts`; ContactGroup pripada akteru i koristi HARD, Contact pripada grupi i koristi SOFT. Grupa ostaje u putanji, a obični PUT ne premješta kontakt. Odgovori sadrže group id/name kako bi fetch ponašanje bilo mjerljivo. Controller izvodi sintetički actor key iz autentificiranog principala; service upiti ga provjeravaju za detail/list/count/mutation. Strani identifikatori daju 404. Fixture politika nije univerzalni tenant/admin model ni live-account-revocation politika.

[ReferenceFeatureConfiguration](../../../../../../backend/src/test/java/referencefixtures/config/ReferenceFeatureConfiguration.java) izričito uvozi testne kontrolere/servise. Host context u aplikacijskom test paketu registrira fixture JPA entitete/repozitorije uz očuvane produkcijske auth/user scanove. Neutralni paketi ostaju izvan običnog component/JPA otkrivanja. Normalni mappings, OpenAPI, entity metadata, schema i Boot JAR ne smiju sadržavati primjer.

## Dokaz sheme mora biti eksplicitan

Test-only repeatable migracija je `backend/src/test/resources/reference-feature/db/migration/R__template_reference_schema.sql`, uključena samo u eksplicitni reference context uz produkcijske migracije. Tablice/indeksi/constrainti koriste `template_reference_`; ne zauzimaju budući consumer V3 broj. To je idempotentni test bootstrap, ne dokaz povijesti produkcijskih nadogradnji.

Hibernate schema validation provjerava stupce/tipove, ne svaki unique ili foreign key. Eksplicitne PostgreSQL catalog provjere potvrđuju uniqueness i točnu FK relaciju; negativni drift testovi uklanjaju unique ili zamjenjuju/uklanjaju FK i moraju pasti. `CREATE TABLE IF NOT EXISTS` ne smije tiho prihvatiti neusklađene postojeće constrainte. Ne mijenjajte primijenjene produkcijske migracije radi ovog primjera.

## Provjeravajte na stvarnoj granici

Koristite workspace backend naredbu (`./gradlew --no-daemon --console=plain test bootJar` iz backend mape), prema sekvencijalnom resource pravilu repozitorija. Fokusirani reference testovi daju stvarni PostgreSQL/HTTP, audit/version, rollback, concurrency, active visibility, full-page query budget i OpenAPI dokaz. Architecture pravila izričito obuhvaćaju reference graf, dok cjeloviti production inventory ostaje main-only. Boot JAR assertions zasebno provjeravaju pakiranje.

Consumer personalizacija mijenja samo odobrene CRUD i `http.PageResponse` importe u neutralnom fixture stablu; package/comment/literal i nepovezani fixturei ostaju neutralni. Initialization runbook vodi točan preflight/resume/audit postupak. Obvezan je stvarni personalized consumer compile/test; text replacement assertions nisu dokaz funkcionalnosti. Stvarne rezultate provjera bilježite zasebno od opisanih acceptance kriterija, uz semantički pregled ovlasti/invarijanti/native SQL-a.

## Točne reference izvora

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Podrijetlo polaznih JPA/build ovisnosti; poveznice ranije opisuju trenutačnu implementaciju u radnoj kopiji.
