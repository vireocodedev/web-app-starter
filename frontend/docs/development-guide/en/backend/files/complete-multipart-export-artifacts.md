# Publish a multipart export only when every component is complete

**Support: reference recipe.** FRED's point shapefile export demonstrates the difference between writing one file and publishing a usable artifact. GeoTools and this export helper are not installed starter capabilities. Apply the pattern to any format composed of several coordinated files: the response represents the complete set, not whichever component became visible first.

## Resource completion precedes artifact publication

`ShapefileUtils.createPointShapefileZip` creates a private temporary directory, defines a WGS84 point schema, writes a feature, closes the transaction object, forces schema CRS and disposes the data store. It then requires `.shp`, `.shx`, `.dbf` and `.prj` files to exist and be nonempty before opening the ZIP writer. Component names are controlled by the helper (`point` plus known extensions), not supplied by a user.

The code uses `Transaction.AUTO_COMMIT`; do not present its explicit `commit()` call as a newly established application transaction or database atomicity protocol. The useful boundary is that writer resources are released before verifying and packaging the emitted files. Nonempty sidecars are a minimum format-completeness check, not proof of every format invariant or compatibility with all downstream readers.

The ZIP is built in memory with one controlled entry for each required component and returned only after the ZIP stream closes. This avoids returning a successful archive that intentionally omits a known-required sidecar. A consumer with larger exports must choose bounded memory or owned staging storage; switching to unbounded HTTP streaming can turn a late component failure into a partial response after success headers were already sent.

## Distinguish the source's cleanup path from a complete lifecycle

The success path deletes known components and then the temporary directory, falling back to `deleteOnExit`. There is no encompassing `finally` around directory creation, schema creation, data-store lifetime, validation, packaging and deletion. Failures before normal disposal can leak the store; missing-sidecar or ZIP errors can bypass prompt file cleanup. A directory registered for exit deletion does not establish prompt removal, recursive removal of extra generated sidecars or behavior after a process crash.

Do not copy this limitation into new code. Own the whole temporary workspace and guarantee close/dispose and cleanup on every exit path, preserving the primary failure if cleanup also fails. Enumerate files only inside that owned directory and remove all owned generated components, not arbitrary neighboring paths. Choose an application policy for crash leftovers; `deleteOnExit` is a fallback mechanism, not a retention policy.

## A consumer export boundary

The following is **pseudocode**. It requires a scoped export authorizer, bounded input reader, temporary-workspace owner, format writer, component verifier, bounded archive sink and response adapter. These APIs are not installed.

```text
authorizeExport(actor, scope)
workspace = createOwnedTemporaryWorkspace()
try:
    writer = openFormatWriter(workspace, explicitCrsAndSchema)
    try:
        writer.write(boundedRows)
        writer.finish()
    finally:
        writer.closeAndDispose()
    components = requireCompleteNonemptySet(workspace, requiredNames)
    requireTotalBytesWithinExportBudget(components)
    archive = buildClosedArchive(components, controlledEntryNames)
    return publishCompleteArtifact(archive)
finally:
    workspace.removeOwnedContents()
```

If the result is a staged file rather than bytes, transfer its ownership explicitly to the response lifecycle so cleanup does not delete it before transmission completes. If persistence is required, publish through the private artifact owner after completion. Reuse [private downloads and projections](./private-downloads-and-metadata-projections.md), rather than exposing a filesystem path or making an export directory public.

CRS, coordinate order, encoding, schema and dimensionality belong in the export contract. The FRED helper's public signature is latitude then longitude while its coordinate is longitude then latitude. See [geospatial units and coordinate order](../contracts/geospatial-units-and-coordinate-order.md). Do not infer projection from a filename or silently label projected coordinates as WGS84.

## Failure, recovery and acceptance

A missing or empty sidecar fails the entire artifact. Do not return a ZIP containing the surviving three files or retry only one file without a writer-defined recovery protocol. A failed export can be regenerated from the same authorized source snapshot; an export advertised as deterministic needs a separate content/version contract because ZIP timestamps and writer metadata may vary.

Acceptance cases include writer failure, schema creation failure, absent/empty sidecar, an unexpected extra file, archive byte limit, ZIP close failure, failed deletion and interrupted response. Demonstrate that every in-process failure releases writer resources and removes owned temporary content, and that no partial artifact is advertised as success. Names must remain controlled and must not permit traversal. Multi-component completeness does not substitute for authorization, source consistency or a bounded total export size.

## Source

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/core/utils/ShapefileUtils.java`
