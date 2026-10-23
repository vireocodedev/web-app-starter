# Sačuvaj početni rok faze i vlasništvo nad čišćenjem procesa

Objedinjavanje CI poslova ne smije prikriti neuspjeh ranije faze ni ostaviti njezine procese u sljedećoj. Sačuvaj izvorni budžet, svaki ishod i vlasništvo nad cleanupom.

**Referenca iz potrošačkog projekta, nije ugrađeni starter helper.** Recept dolazi iz `client-discovery-app` datoteka `infrastructure/ci/utility_phase.py`, workflowa i utility gatea. Starter ima odvojene portable/static/build/foundation poslove. Helper nije unaprijed dostupan niti je ovo dozvola za zamjenu workflowa bez pregledane migracije.

## Okidač, vlasnik i ugovor

Razmotri kada mjerenje pokaže da setup opravdava sekvencijalne kompatibilne faze u jednom jednokratnom workeru. CI održavatelj odgovara za kompoziciju i foreground-procesni ugovor. Vanjska izolacija nepouzdanog koda i dalje pripada operateru.

Uvjeti su početni rok koji uključuje setup, očuvani ishodi svih obveznih faza i dovršeno čišćenje prije sljedeće faze. Ovo je cleanup workloadova unutar Linux CI-ja, ne sigurnosni sandbox. Namjerni bijeg potomka iz process groupa izvan je jamstva tog mehanizma.

## Pokreni budžet prije setupa

Consumer zapisuje fazu, limit, monotonic početak i SHA/run/attempt u job-local stanje. Ekskluzivno stvaranje datoteke sprječava reset budžeta slučajnim ponavljanjem. Svaki `run` provjerava identitet i od početnog limita oduzima već proteklo vrijeme.

```text
početak faze -> setup alata -> naredba A -> naredba B
                    sve troši isti rok
                                |
                   cleanup prije sljedeće faze
```

Ako rok već istekne, helper vraća timeout umjesto novog cijelog budžeta. Consumer trenutačno daje deset minuta portable fazi, dvadeset frontend static/build i backend fazama, petnaest foundationu te dvije cleanup fazama. To su njegove vrijednosti. Ukupni utility job ima zaseban vanjski timeout; zbroj maksimuma ne jamči da svi stanu u njega.

Ako Action instalira runtime prije wrapped shell naredbe, i taj setup mora potrošiti budžet. Naknadni početak vremena prešutno bi produžio fazu.

## Zadrži vlasništvo do zadnjeg signala

Wrapper pokreće foreground naredbu u novoj sesiji/process groupu. Dijete opaža kroz `waitid(... WNOWAIT)` umjesto ranog reapanja. Zadržani leader, čak i kao zombie nakon normalnog izlaza, sprječava ponovnu uporabu numeričkog PID/PGID-a dok čišćenje signalima nije gotovo.

Šalje TERM, čeka ograničeni grace pa bezuvjetno šalje KILL dok još drži ownership anchor. Završni KILL zatvara race između probea članstva i forka; ne preskače se zato što je foreground leader uredno izašao. Linux `/proc` razlikuje žive članove od zombija, a leader se reapa tek nakon zadnjeg cleanup koraka.

Cancellation handler bilježi zastavicu umjesto reentrant iznimke kroz spawn/wait kod. Cleanup završava prije vraćanja starih handlera. Ako se ne može potvrditi terminacija ili pregled članstva, job-local marker blokira sve sljedeće faze. Inače bi stari procesi trošili novi budžet i mijenjali njegove datoteke.

## Neovisni rad može nastaviti, raniji pad ostaje

Kasnije odabrane faze koriste `always() && !cancelled()` uz vlastite preduvjete. Time neovisan dokaz ostaje dostupan nakon ranijeg pada, bez ignoriranja cancellationa.

Završni utility gate čita izvorne step outcome vrijednosti, zahtijeva uspjeh svake odabrane i skip svake neodabrane faze. Vanjski gate traži uspješan utility i jednakost njegovih selekcijskih izlaza s neovisnom klasifikacijom. Zadnja uspješna shell naredba ne briše raniji neuspjeh.

Docker image cleanup također ima vlastiti rok i fazu te zahvaća privatni daemon tog posla. Široko čišćenje shared/host daemona nije ista prilagodba.

## Pogreške i odluke

| Opažanje                              | Odluka                                                    |
| ------------------------------------- | --------------------------------------------------------- |
| Retry resetira početak faze           | Sačuvaj izvorno stanje ili pokreni novi workflow attempt. |
| Leader izađe, potomak ignorira TERM   | Zadrži ownership, dovrši KILL pa reap.                    |
| Cleanup marker postoji                | Blokiraj nastavak i istraži; ne briši ga naslijepo.       |
| Kasnija faza prođe nakon ranijeg pada | Završni rezultat mora i dalje pasti.                      |
| Cijeli job je otkazan                 | Poštuj cancellation; nezavisna faza ga ne zaobilazi.      |
| Treba zaštita od zlonamjernog potomka | Koristi stvarnu worker granicu; wrapper nije dovoljan.    |

## Prihvat i inspekcija

Za ovlašteno preuzimanje pregledaj početak svake faze, uključeni setup, source/run/attempt vezivanje, exclusive create, Linux pretpostavke i cancellation putanje. Potvrdi da signal nikad ne može pogoditi ponovno korišten PGID i da neizvjestan cleanup blokira nastavak.

Sačuvaj sve obvezne ishode i dokaz da aggregate zadržava neuspjehe. Mjeri uštedu bez uklanjanja provjera ili spajanja registry ovlasti s buildom. Consumer izvor je recept za prilagodbu, ne dokaz dostupnosti, OS prenosivosti ili zaštite od namjernog bijega procesa.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:infrastructure/ci/utility_phase.py`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:.github/workflows/ci.yml`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:infrastructure/ci/ci_scope.py`
