# Make coordinate order and geometry units explicit

**Support: reference recipe.** FRED uses JTS geometry and GeoTools exports. Those dependencies and APIs are not installed starter guarantees. Use this pattern when a consumer introduces points, surfaces, spatial persistence or map exports: the contract must say what each number means before conversion or validation begins.

## Name longitude and latitude at every seam

`GeometryUtils.createPoint(lon, lat)` constructs `Coordinate(lon, lat)` with a geometry factory carrying SRID 4326. Thus x is longitude and y is latitude. `ShapefileUtils.createPointShapefileZip(latitude, longitude)` has the opposite parameter order, but constructs `Coordinate(longitude, latitude)`. Both produce the same coordinate order internally when called correctly. Positional doubles conceal this difference.

Prefer a named consumer DTO and an explicitly named conversion. The following is **pseudocode**, requiring a wire DTO, geometry adapter, coordinate validator and projection policy. None of these neutral helpers is installed.

```text
GeoPointInput { longitudeDegrees, latitudeDegrees }

toWgs84Point(input):
    requireFinite(input.longitudeDegrees, input.latitudeDegrees)
    requireRange(input.longitudeDegrees, -180, 180)
    requireRange(input.latitudeDegrees, -90, 90)
    return createPoint(x=input.longitudeDegrees,
                       y=input.latitudeDegrees, srid=4326)
```

Those finite/range checks are adaptation requirements; the cited `GeometryUtils` does not perform them. Setting SRID is metadata, not coordinate transformation. A point in projected metres does not become valid longitude/latitude when assigned 4326. Require a real transformation from an explicitly known source CRS, or reject input lacking the required CRS contract.

## Separate angular coordinates from physical measurements

Longitude and latitude coordinates are angular values. A radius, distance or area may be expressed in metres, kilometres or a projected coordinate system, but that meaning cannot be inferred from a Java `Double`. The cited surface DTO has `radius1`, `radius2` and `rotation` fields without a unit in the field name or validation contract. Its source shape validator constrains ellipse rotation to 0 through 360 inclusive, but does not define a complete measurement model for downstream calculations.

A consumer should specify radius units, rotation convention/origin, whether 360 is canonicalized to 0, the coordinate system used for geometry operations and the rule for longitude wrapping. These are application decisions, not claims already enforced by FRED. Planar JTS operations on degree-valued coordinates must not be labeled metre-accurate just because SRID 4326 is present.

## A shape tag needs a complete variant contract

`SurfaceValidShapeValidator` requires a shape string and recognizes circle, ellipse and polygon. Circle requires a present positive first radius; ellipse requires two positive radii and rotation in range; polygon requires a present polygon. It returns true for a null DTO so separate field/argument validation can own nullability. The DTO also uses create/update validation groups for identity and other required fields.

The implementation does not reject every field belonging to another shape. It does not establish finite radii or rotation, coordinate bounds, nonempty/valid polygon topology, a non-null DTO `centerPoint`, maximum vertices or spatial extent. In particular, ordinary comparisons are insufficient for every non-finite floating-point value: positive infinity satisfies a positive-radius check, and NaN can evade a `< 0 || > 360` rotation test. Nullable Optional containers can also violate the validator's assumptions if mapping leaves them null.

Use an explicit tagged input model or variant-aware validation with finite numbers, required and forbidden fields, geometry complexity bounds and meaningful topology decisions. Decide whether invalid rings are rejected or repaired and whether repair changes the evidence/preview; do not silently repair geometry without a declared contract. The domain entity's non-null center point is not proof that every API DTO already validates it safely.

## Failure, recovery and acceptance

A swapped coordinate can remain within numerical ranges, so successful range validation does not prove correct order. Give adapters asymmetric neutral examples, such as longitude 12 and latitude 48, and assert x=12/y=48 across wire, persistence and export. Avoid examples where equal values conceal a swap.

On invalid coordinates or unsupported CRS, reject before storage/export and retain a safe field-level error. A topology failure should identify the shape contract without echoing an unbounded geometry. Missing projection information requires explicit user/source correction, not a guessed transformation.

Acceptance cases include coordinate order at both source helper signatures, wrong CRS, NaN/infinity, boundary coordinates, missing center, zero/negative radius, contradictory variant fields, empty/self-intersecting polygons and vertex limits. Prove that a new projection actually changes coordinates and that a metadata-only SRID assignment does not. Reuse [exact write intent](./tolerant-readers-and-exact-write-intent.md) when defining absent, null and value semantics, and [complete export artifacts](../files/complete-multipart-export-artifacts.md) when publishing geometry files.

## Sources

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/core/geometry/GeometryUtils.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/core/utils/ShapefileUtils.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/surface/SurfaceDTO.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/surface/SurfaceValidShapeValidator.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/surface/Surface.java`
