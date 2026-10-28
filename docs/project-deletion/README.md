# Delete an initialized consumer

Use [DELETE_GUIDE.md](DELETE_GUIDE.md) for the complete operator procedure or
[DELETE_GUIDE_COMPACT.md](DELETE_GUIDE_COMPACT.md) for the same numbered commands.
[Numbered scripts](scripts/README.md) import the consumer's protected initialization
results, inventory exact resources, seal a reviewed plan and execute resumable removal.

Deletion removes the consumer's host databases, backups, containers, networks,
volumes, application images, credentials, dedicated proxy/TLS assets, source and
state copies, shared-CI registration, DNS records, GHCR packages, App repository
selection and GitHub repository. The repository is deleted last.

The canonical starter checkout, shared App installation/key, shared CI pool,
other projects, global Caddy configuration, ACME accounts, DNS zone and host remain.
The local consumer checkout, notes and retrieved recovery archives remain.
Provider retention, audit records and already downloaded copies are outside this
active-resource deletion scope; deletion is not a promise of physical media erasure.
