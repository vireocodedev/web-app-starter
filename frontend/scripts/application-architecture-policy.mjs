import assert from "node:assert/strict";
import { posix } from "node:path";
import ts from "typescript";

const productionSourcePattern = /^src\/.+\.(?:ts|tsx)$/;
const nonProductionSourcePattern = /(?:\.(?:test|spec)\.|\/(?:test|__tests__|stories)\/|Example\.)/;
const automatedTestPathPattern = /(?:\.(?:test|spec)\.[cm]?[jt]sx?$|\/(?:test|__tests__)\/)/;
const groupedDevelopmentFeaturePattern = "development-guide/(?:architecture|contacts|handbook|patterns/[^/]+)";
const featureImportPattern = new RegExp(`^@/features/((?:${groupedDevelopmentFeaturePattern})|[^/]+)(/.*)?$`);
const featureApplicationLeafPaths = new Set([
  "src/app/router/hooks/useAppQueryParams.ts",
  "src/app/router/queryParams.ts",
  "src/app/overlays/components/AppBottomDrawerHandle.tsx",
  "src/app/shell/components/AppPageNavigation.tsx",
  "src/app/shell/components/AppCategoryList.tsx",
]);
const pageApplicationLeafPaths = new Set([
  "src/app/shell/components/AppCategoryList.tsx",
  "src/app/shell/components/AppBreadcrumbs.tsx",
  "src/app/shell/components/AppPageNavigation.tsx",
]);
const documentationPresentationConsumers = new Set([
  "src/features/development-guide/architecture/components/ArchitectureArticle.tsx",
  "src/features/development-guide/handbook/components/HandbookArticle.tsx",
  "src/features/development-guide/patterns/gallery/components/ExampleGallery.tsx",
  "src/features/development-guide/patterns/gallery/components/ExamplePageNavigation.tsx",
  "src/features/development-guide/patterns/gallery/components/ExamplesNavigation.tsx",
  "src/features/development-guide/patterns/gallery/components/ExamplesRouteLayout.tsx",
  "src/features/development-guide/patterns/gallery/types/ExampleNavigation.ts",
  "src/features/development-guide/patterns/gallery/utils/exampleNavigation.ts",
  "src/pages/development-guide/architecture/ArchitectureRouteLayout.tsx",
  "src/pages/development-guide/patterns/PatternCategoryLayout.tsx",
  "src/pages/development-guide/handbook/HandbookTopicLayout.tsx",
]);
const rawMuiColorSchemeOwners = new Set([
  "src/app/theme/components/AppThemeProvider.tsx",
  "src/app/theme/preferences/useAppColorScheme.ts",
]);
const allowedApplicationRoots = new Set([
  "auth",
  "bootstrap",
  "data",
  "forms",
  "localization",
  "overlays",
  "router",
  "shell",
  "theme",
]);
const retiredApplicationRoots = [
  "api",
  "config",
  "examples",
  "failure",
  "query",
  "runtime",
  "settings",
  "signals",
  "storage",
];

function sourceFile(path, source) {
  return ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function importRecords(path, source) {
  const records = [];
  const file = sourceFile(path, source);

  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      const bindings = clause?.namedBindings;
      const namedImports =
        bindings && ts.isNamedImports(bindings)
          ? bindings.elements.map(element => ({
              imported: element.propertyName?.text ?? element.name.text,
              local: element.name.text,
              typeOnly: clause?.isTypeOnly || element.isTypeOnly,
            }))
          : [];
      const isEntirelyTypeOnly = Boolean(
        clause?.isTypeOnly ||
        (clause && !clause.name && namedImports.length > 0 && namedImports.every(element => element.typeOnly)),
      );

      records.push({
        kind: "import",
        namedImports,
        namespaceImport: Boolean(bindings && ts.isNamespaceImport(bindings)),
        specifier: statement.moduleSpecifier.text,
        typeOnly: isEntirelyTypeOnly,
      });
      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
      const namedImports =
        statement.exportClause && ts.isNamedExports(statement.exportClause)
          ? statement.exportClause.elements.map(element => ({
              imported: element.propertyName?.text ?? element.name.text,
              local: element.name.text,
              typeOnly: statement.isTypeOnly || element.isTypeOnly,
            }))
          : [];

      records.push({
        kind: "export",
        namedImports,
        namespaceImport: false,
        specifier: statement.moduleSpecifier.text,
        typeOnly: statement.isTypeOnly || (namedImports.length > 0 && namedImports.every(element => element.typeOnly)),
      });
    }
  }

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      records.push({
        kind: "dynamic-import",
        namedImports: [],
        namespaceImport: false,
        specifier: node.arguments[0].text,
        typeOnly: false,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);

  return records;
}

function importSpecifiers(path, source) {
  return importRecords(path, source).map(({ specifier }) => specifier);
}

function sourceFeatureName(path) {
  return path.match(new RegExp(`^src/features/((?:${groupedDevelopmentFeaturePattern})|[^/]+)/`))?.[1];
}

function sourceAppArea(path) {
  const area = path.match(/^src\/app\/([^/]+)(?:\/([^/]+))?(?:\/|$)/);
  if (!area) return undefined;

  const [, owner, capability] = area;
  return ["bootstrap", "data"].includes(owner) && capability ? `${owner}/${capability}` : owner;
}

function signalStem(groupName) {
  return (
    "sig" +
    groupName
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  );
}

function pascalCase(value) {
  return value
    .split(/[-_/]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function featureLeafName(featureName) {
  return featureName.split("/").at(-1);
}

function unwrapExpression(expression) {
  let current = expression;
  while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }
  return current;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return undefined;
}

function readAllowedCrossFeatureHooks(byPath, violations) {
  const path = "src/app/bootstrap/runtime/appFeatures.ts";
  const source = byPath.get(path);
  if (!source) {
    violations.push("Missing required architecture seam: " + path);
    return new Map();
  }

  const file = sourceFile(path, source);
  let declaration;
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    declaration = statement.declarationList.declarations.find(
      candidate => ts.isIdentifier(candidate.name) && candidate.name.text === "allowedCrossFeatureHooks",
    );
    if (declaration) break;
  }

  const initializer = declaration?.initializer ? unwrapExpression(declaration.initializer) : undefined;
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    violations.push(path + ": allowedCrossFeatureHooks must be a statically analyzable object literal");
    return new Map();
  }

  const dependencies = new Map();
  for (const property of initializer.properties) {
    if (!ts.isPropertyAssignment(property)) {
      violations.push(path + ": dependency declarations must use source: [target] entries");
      continue;
    }
    const sourceFeature = propertyName(property.name);
    const targets = unwrapExpression(property.initializer);
    if (!sourceFeature || !ts.isArrayLiteralExpression(targets)) {
      violations.push(path + ": dependency declarations must use source: [target] entries");
      continue;
    }
    const targetNames = targets.elements.map(element => {
      const value = unwrapExpression(element);
      return ts.isStringLiteral(value) ? value.text : undefined;
    });
    if (targetNames.some(target => target === undefined)) {
      violations.push(path + ": dependency targets must be string literals");
      continue;
    }
    dependencies.set(sourceFeature, targetNames);
  }

  return dependencies;
}

function moduleCandidates(importerPath, specifier) {
  let basePath;
  if (specifier.startsWith("@/")) {
    basePath = "src/" + specifier.slice("@/".length);
  } else if (specifier.startsWith("@test/")) {
    basePath = "tests/" + specifier.slice("@test/".length);
  } else if (specifier.startsWith(".")) {
    basePath = posix.normalize(posix.join(posix.dirname(importerPath), specifier));
  } else {
    return [];
  }

  if (basePath.endsWith(".js")) {
    basePath = basePath.slice(0, -".js".length);
  }

  return /\.(?:ts|tsx)$/.test(basePath)
    ? [basePath]
    : [basePath + ".ts", basePath + ".tsx", posix.join(basePath, "index.ts"), posix.join(basePath, "index.tsx")];
}

function resolvedModulePath(byPath, importerPath, specifier) {
  return moduleCandidates(importerPath, specifier).find(candidate => byPath.has(candidate));
}

function privateContextOwner(path) {
  return (
    path.match(/^(src\/(?:app|features)\/[^/]+(?:\/[^/]+)*)\/contexts\/[^/]+Context\.[jt]sx?$/)?.[1] ??
    path.match(/^(src\/(?:app|features)\/[^/]+(?:\/[^/]+)*)\/[^/]+Context\.[jt]sx?$/)?.[1]
  );
}

function privateInternalDirectory(path) {
  return path.match(/^(src\/(?:app|features)\/.+?\/internal)(?:\/|$)/)?.[1];
}

function executableExportGraph(byPath) {
  return new Map(
    [...byPath]
      .filter(([path]) => /\.[cm]?[jt]sx?$/.test(path))
      .map(([path, source]) => [
        path,
        importRecords(path, source)
          .filter(record => record.kind === "export" && !record.typeOnly)
          .map(({ specifier }) => resolvedModulePath(byPath, path, specifier))
          .filter(Boolean),
      ]),
  );
}

function reachableExportTargets(exportGraph, startPath) {
  const reachable = new Set();
  const pending = [startPath];

  while (pending.length > 0) {
    const path = pending.pop();
    if (reachable.has(path)) continue;
    reachable.add(path);
    pending.push(...(exportGraph.get(path) ?? []));
  }

  return reachable;
}

function assertPrescribedPlacement(path, violations) {
  const expandedOwner = path.match(/^src\/app\/(auth|localization)\/(.+)$/);
  if (expandedOwner) {
    const [, owner, pathWithinOwner] = expandedOwner;
    const fileName = posix.basename(pathWithinOwner);
    let expectedRole;

    if (/Context\.[jt]sx?$/.test(fileName)) expectedRole = "contexts";
    else if (/^use[A-Z].*\.[jt]sx?$/.test(fileName)) expectedRole = "hooks";
    else if (/\.tsx$/.test(fileName)) expectedRole = "components";

    const firstDirectory = pathWithinOwner.includes("/") ? pathWithinOwner.split("/")[0] : undefined;
    const prescribedPeer =
      !firstDirectory ||
      ["components", "contexts", "hooks"].includes(firstDirectory) ||
      (owner === "localization" && firstDirectory === "runtime");

    if (expectedRole && prescribedPeer && !pathWithinOwner.startsWith(expectedRole + "/")) {
      violations.push(`${path}: expanded ${owner} ${expectedRole} peers belong in ${owner}/${expectedRole}`);
    }
  }

  if (path.endsWith("/AppThemeProvider.tsx") && path !== "src/app/theme/components/AppThemeProvider.tsx") {
    violations.push(path + ": the primary theme provider belongs in theme/components");
  }
  if (path.endsWith("/AppShell.tsx") && path !== "src/app/shell/components/AppShell.tsx") {
    violations.push(path + ": the primary shell React entry belongs in shell/components");
  }

  if (path.endsWith("/AppSettingsPanel.tsx") && path !== "src/features/settings/components/AppSettingsPanel.tsx") {
    violations.push(path + ": the generic settings panel belongs in settings/components");
  }
  if (path.endsWith("/AppSettingsSection.ts") && path !== "src/features/settings/types/AppSettingsSection.ts") {
    violations.push(path + ": the settings section contract belongs in settings/types");
  }

  const settingsSectionFile = path.match(/^src\/features\/settings\/sections\/([^/]+)\/(.+\.[jt]sx?)$/);
  if (settingsSectionFile) {
    const [, section, pathWithinSection] = settingsSectionFile;
    const fileName = posix.basename(pathWithinSection);
    const expectedRole = /^use[A-Z]/.test(fileName) ? "hooks" : /\.tsx$/.test(fileName) ? "components" : undefined;
    const firstDirectory = pathWithinSection.includes("/") ? pathWithinSection.split("/")[0] : undefined;
    const prescribedPeer = !firstDirectory || ["components", "hooks", "types"].includes(firstDirectory);
    const canonicalInterfaceRole =
      section === "interface"
        ? fileName === "InterfaceSettingsControls.tsx"
          ? "components"
          : ["useInterfaceSettingsSection.tsx", "useResetInterfaceSettingsSection.tsx"].includes(fileName)
            ? "hooks"
            : undefined
        : undefined;

    if (canonicalInterfaceRole && pathWithinSection !== `${canonicalInterfaceRole}/${fileName}`) {
      violations.push(
        `${path}: settings section ${section} ${canonicalInterfaceRole} peers belong in sections/${section}/${canonicalInterfaceRole}`,
      );
    } else if (expectedRole && prescribedPeer && !pathWithinSection.startsWith(expectedRole + "/")) {
      violations.push(
        `${path}: settings section ${section} ${expectedRole} peers belong in sections/${section}/${expectedRole}`,
      );
    }
  }
}

function assertAcyclic(byPath, violations) {
  const productionPaths = new Set(
    [...byPath.keys()].filter(path => productionSourcePattern.test(path) && !nonProductionSourcePattern.test(path)),
  );
  const edges = new Map(
    [...productionPaths].map(path => [
      path,
      importRecords(path, byPath.get(path))
        .filter(({ typeOnly }) => !typeOnly)
        .flatMap(({ specifier }) => {
          const target = moduleCandidates(path, specifier).find(candidate => productionPaths.has(candidate));
          return target ? [target] : [];
        }),
    ]),
  );
  const visiting = new Set();
  const visited = new Set();

  function visit(path, chain) {
    if (visiting.has(path)) {
      const cycleStart = chain.indexOf(path);
      violations.push("Dependency cycle: " + [...chain.slice(cycleStart), path].join(" -> "));
      return;
    }
    if (visited.has(path)) return;

    visiting.add(path);
    for (const target of edges.get(path) ?? []) visit(target, [...chain, path]);
    visiting.delete(path);
    visited.add(path);
  }

  for (const path of productionPaths) visit(path, []);
}

function featureLookupCalls(path, source, localName) {
  const calls = [];
  const file = sourceFile(path, source);

  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === localName) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return calls;
}

function publicFeatureHookExports(byPath, featureName, violations) {
  const indexPath = `src/features/${featureName}/index.ts`;
  const featureLeaf = featureLeafName(featureName);
  const wrapperPath = `src/features/${featureName}/hooks/use${pascalCase(featureLeaf)}Feature.ts`;
  const expectedHook = `use${pascalCase(featureLeaf)}Feature`;
  const publicNames = new Set();

  for (const record of importRecords(indexPath, byPath.get(indexPath) ?? "")) {
    if (record.kind !== "export" || record.typeOnly) continue;

    const targetPath = moduleCandidates(indexPath, record.specifier).find(candidate => byPath.has(candidate));
    if (targetPath !== wrapperPath) continue;

    for (const { imported, local } of record.namedImports) {
      if (imported !== expectedHook) continue;
      if (local !== expectedHook) {
        violations.push(indexPath + `: ${expectedHook} must be exported without a public alias`);
      }
      publicNames.add(local);
    }
  }

  return publicNames;
}

function assertFeatureHookPolicy(byPath, violations) {
  const featureNames = new Set([...byPath.keys()].map(sourceFeatureName).filter(Boolean));
  const allowedDependencies = readAllowedCrossFeatureHooks(byPath, violations);
  const declaredRuntimeKeys = new Set([...allowedDependencies].flatMap(([source, targets]) => [source, ...targets]));
  const featureNamesByRuntimeKey = new Map();
  for (const featureName of featureNames) {
    const runtimeKey = featureLeafName(featureName);
    const wrapperPath = `src/features/${featureName}/hooks/use${pascalCase(runtimeKey)}Feature.ts`;
    const existingFeature = featureNamesByRuntimeKey.get(runtimeKey);
    if (
      existingFeature &&
      (byPath.has(wrapperPath) ||
        byPath.has(`src/features/${existingFeature}/hooks/use${pascalCase(runtimeKey)}Feature.ts`) ||
        declaredRuntimeKeys.has(runtimeKey))
    ) {
      violations.push(
        `Feature runtime key '${runtimeKey}' is ambiguous between '${existingFeature}' and '${featureName}'`,
      );
      continue;
    }
    if (!existingFeature) featureNamesByRuntimeKey.set(runtimeKey, featureName);
  }
  const actualDependencies = new Set();
  const publicHooksByFeature = new Map(
    [...featureNames].map(featureName => [featureName, publicFeatureHookExports(byPath, featureName, violations)]),
  );

  for (const [path, source] of byPath) {
    if (!productionSourcePattern.test(path) || nonProductionSourcePattern.test(path)) {
      continue;
    }

    const featureName = sourceFeatureName(path);
    const featureLeaf = featureName ? featureLeafName(featureName) : undefined;
    const expectedWrapperPath = featureName
      ? `src/features/${featureName}/hooks/use${pascalCase(featureLeaf)}Feature.ts`
      : undefined;

    for (const record of importRecords(path, source)) {
      const targetPath = moduleCandidates(path, record.specifier).find(candidate => byPath.has(candidate));
      const lookupImport = record.namedImports.find(({ imported }) => imported === "useAppFeature");
      const importsRuntimeLookup = targetPath === "src/app/bootstrap/runtime/useAppFeature.ts";

      if (importsRuntimeLookup && (lookupImport || record.namespaceImport || record.kind === "dynamic-import")) {
        if (path !== expectedWrapperPath) {
          violations.push(path + ": useAppFeature may be imported only by the owning use<Feature>Feature wrapper");
          continue;
        }

        if (record.namespaceImport || !lookupImport || lookupImport.local !== "useAppFeature") {
          violations.push(path + ": feature wrappers must import useAppFeature without aliases");
          continue;
        }

        const calls = featureLookupCalls(path, source, lookupImport.local);
        const validLookup =
          calls.length === 1 &&
          calls[0].arguments.length === 1 &&
          ts.isStringLiteral(calls[0].arguments[0]) &&
          calls[0].arguments[0].text === featureLeaf;
        if (!validLookup) {
          violations.push(path + `: wrapper must contain exactly useAppFeature('${featureLeaf}')`);
        }
      }

      if (!featureName || !targetPath) continue;
      const targetFeature = sourceFeatureName(targetPath);
      if (!targetFeature || targetFeature === featureName) continue;
      if (targetPath !== `src/features/${targetFeature}/index.ts`) continue;

      if (record.namespaceImport) {
        violations.push(path + ": cross-feature namespace imports are forbidden; import the explicit public member");
      }

      const publicHookNames = publicHooksByFeature.get(targetFeature);
      if (record.namedImports.some(({ imported }) => publicHookNames?.has(imported))) {
        actualDependencies.add(`${featureName}->${targetFeature}`);
      }
    }
  }

  for (const featureName of featureNames) {
    const featureLeaf = featureLeafName(featureName);
    const wrapperPath = `src/features/${featureName}/hooks/use${pascalCase(featureLeaf)}Feature.ts`;
    if (!byPath.has(wrapperPath)) continue;

    const indexPath = `src/features/${featureName}/index.ts`;
    const expectedHook = `use${pascalCase(featureLeaf)}Feature`;
    const exported = importRecords(indexPath, byPath.get(indexPath) ?? "").some(
      ({ namedImports, specifier }) =>
        moduleCandidates(indexPath, specifier).includes(wrapperPath) &&
        namedImports.some(({ imported, local }) => imported === expectedHook && local === expectedHook),
    );
    if (!exported) {
      violations.push(wrapperPath + ": feature hook wrapper must be exported from index.ts");
    }
  }

  const declaredDependencies = new Set();
  for (const [sourceRuntimeKey, targetRuntimeKeys] of allowedDependencies) {
    const sourceFeature = featureNamesByRuntimeKey.get(sourceRuntimeKey);
    if (!sourceFeature) {
      violations.push(`src/app/bootstrap/runtime/appFeatures.ts: unknown source feature '${sourceRuntimeKey}'`);
    }
    if (new Set(targetRuntimeKeys).size !== targetRuntimeKeys.length) {
      violations.push(
        `src/app/bootstrap/runtime/appFeatures.ts: duplicate dependency declared for '${sourceRuntimeKey}'`,
      );
    }
    for (const targetRuntimeKey of targetRuntimeKeys) {
      const targetFeature = featureNamesByRuntimeKey.get(targetRuntimeKey);
      if (!sourceFeature || !targetFeature) {
        if (!targetFeature) {
          violations.push(`src/app/bootstrap/runtime/appFeatures.ts: unknown target feature '${targetRuntimeKey}'`);
        }
        continue;
      }
      const edge = `${sourceFeature}->${targetFeature}`;
      declaredDependencies.add(edge);
      if (sourceFeature === targetFeature) {
        violations.push(
          `src/app/bootstrap/runtime/appFeatures.ts: feature '${sourceRuntimeKey}' cannot depend on itself`,
        );
      }
      if (!actualDependencies.has(edge)) {
        violations.push(`src/app/bootstrap/runtime/appFeatures.ts: stale cross-feature hook permission '${edge}'`);
      }
    }
  }

  for (const edge of actualDependencies) {
    if (!declaredDependencies.has(edge)) {
      violations.push(`Undeclared cross-feature hook dependency '${edge}'`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(feature, chain) {
    if (visiting.has(feature)) {
      const cycleStart = chain.indexOf(feature);
      violations.push("Cross-feature hook dependency cycle: " + [...chain.slice(cycleStart), feature].join(" -> "));
      return;
    }
    if (visited.has(feature)) return;
    visiting.add(feature);
    const runtimeKey = featureLeafName(feature);
    for (const targetRuntimeKey of allowedDependencies.get(runtimeKey) ?? []) {
      const target = featureNamesByRuntimeKey.get(targetRuntimeKey);
      if (target) visit(target, [...chain, feature]);
    }
    visiting.delete(feature);
    visited.add(feature);
  }
  for (const feature of featureNames) visit(feature, []);
}

function assertNoViolations(files) {
  const byPath = new Map(files.map(file => [file.destinationPath, file.source]));
  const paths = [...byPath.keys()];
  const violations = [];
  const exportGraph = executableExportGraph(byPath);

  for (const requiredPath of [
    "src/main.tsx",
    "src/app/App.tsx",
    "src/app/bootstrap/runtime/AppRuntimeContext.ts",
    "src/app/bootstrap/runtime/AppRuntimeProvider.tsx",
    "src/app/bootstrap/runtime/useAppFeature.ts",
    "src/app/bootstrap/runtime/createAppRuntime.ts",
    "src/app/bootstrap/runtime/appFeatures.ts",
  ]) {
    if (!byPath.has(requiredPath)) {
      violations.push("Missing required architecture seam: " + requiredPath);
    }
  }

  if (!paths.some(path => /^src\/app\/router\/.+\.(?:ts|tsx)$/.test(path))) {
    violations.push("Missing required architecture seam: src/app/router");
  }

  for (const path of paths) {
    const focusedTest = path.match(/^tests\/(app|features)\/(.+)\.(?:test|spec)\.[cm]?[jt]sx?$/);
    if (focusedTest) {
      const sourceStem = `src/${focusedTest[1]}/${focusedTest[2]}`;
      const sourceCandidates = [
        sourceStem + ".ts",
        sourceStem + ".tsx",
        posix.join(sourceStem, "index.ts"),
        posix.join(sourceStem, "index.tsx"),
      ];
      if (!sourceCandidates.some(candidatePath => byPath.has(candidatePath))) {
        violations.push(path + ": focused test path must mirror an existing src module");
      }
    }

    if (path.startsWith("src/") && automatedTestPathPattern.test(path)) {
      violations.push(path + ": automated tests must live under tests/ and mirror the src/ ownership tree");
    }

    if (
      automatedTestPathPattern.test(path) &&
      path.startsWith("tests/") &&
      !/^tests\/(?:app|features)\/.+\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path) &&
      !/^tests\/integration\/[^/]+\/.+\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path) &&
      !/^tests\/browser\/.+\.spec\.[cm]?[jt]sx?$/.test(path)
    ) {
      violations.push(
        path +
          ": tests must mirror src under tests/app or tests/features, or use tests/integration/<area> or tests/browser",
      );
    }

    if (automatedTestPathPattern.test(path) && path.startsWith("tests/") && !path.startsWith("tests/browser/")) {
      for (const specifier of importSpecifiers(path, byPath.get(path))) {
        if (
          specifier.startsWith(".") &&
          moduleCandidates(path, specifier).some(candidatePath => candidatePath.startsWith("src/"))
        ) {
          violations.push(path + ": tests must import production source through the @/ alias");
        }
      }
    }

    if (/^src\/(?:shared|common|utils)(?:\/|$)/.test(path)) {
      violations.push(path + ": dumping-ground roots are forbidden");
    }
    const applicationRoot = path.match(/^src\/app\/([^/]+)(?:\/|$)/)?.[1];
    if (applicationRoot && path !== "src/app/App.tsx" && !allowedApplicationRoots.has(applicationRoot)) {
      violations.push(
        path +
          ": unsupported first-level app owner; use App.tsx, auth, bootstrap, data, forms, localization, overlays, router, shell, or theme",
      );
    }
    if (/^src\/app\/(?:views|projects)(?:\/|$)/.test(path)) {
      violations.push(path + ": route entries belong in src/pages");
    }

    const topLevelSource = path.match(/^src\/([^/]+)$/);
    if (topLevelSource && !["main.tsx", "vite-env.d.ts"].includes(topLevelSource[1])) {
      violations.push(path + ": top-level src may contain only app, features, pages, main.tsx, and vite-env.d.ts");
    }

    const topLevelDirectory = path.match(/^src\/([^/]+)\//);
    if (topLevelDirectory && !["app", "features", "pages"].includes(topLevelDirectory[1])) {
      violations.push(path + ": top-level src directories may only be app, features, or pages");
    }

    const rootFeatureFile = path.match(
      new RegExp(`^src/features/(?:${groupedDevelopmentFeaturePattern}|[^/]+)/([^/]+\\.(?:ts|tsx))$`),
    );
    if (rootFeatureFile && rootFeatureFile[1] !== "index.ts" && !rootFeatureFile[1].endsWith(".feature.ts")) {
      violations.push(path + ": feature root may contain only index.ts and *.feature.ts files");
    }

    const isProductionModule = productionSourcePattern.test(path) && !nonProductionSourcePattern.test(path);

    if (isProductionModule) {
      assertPrescribedPlacement(path, violations);

      for (const targetPath of reachableExportTargets(exportGraph, path)) {
        if (targetPath === path) continue;

        if (privateContextOwner(targetPath)) {
          violations.push(path + ": non-type barrels must not re-export private context modules");
          break;
        }

        const internalDirectory = privateInternalDirectory(targetPath);
        if (internalDirectory && !path.startsWith(internalDirectory + "/")) {
          violations.push(path + ": non-type barrels must not re-export private internal modules");
          break;
        }
      }
    }

    if (isProductionModule && /\/(?:providers)\//.test(path)) {
      violations.push(path + ": providers belong in components or in a compact capability group");
    }

    const hookFile = path.match(/\/hooks\/([^/]+)\.(?:ts|tsx)$/);
    if (isProductionModule && hookFile && !hookFile[1].startsWith("use")) {
      violations.push(path + ": hook filenames must start with use");
    }

    const providerFile = path.match(/\/([^/]+Provider)\.tsx$/);
    if (
      isProductionModule &&
      providerFile &&
      !new RegExp(`export\\s+(?:function|const|class)\\s+${providerFile[1]}\\b`).test(byPath.get(path))
    ) {
      violations.push(path + ": provider filename must match its named provider export");
    }
    for (const match of isProductionModule
      ? byPath.get(path).matchAll(/export\s+(?:function|const|class)\s+(\w+Provider)\b/g)
      : []) {
      if (!path.endsWith("/" + match[1] + ".tsx")) {
        violations.push(path + ": exported provider must use the matching Provider.tsx filename");
      }
    }

    if (!productionSourcePattern.test(path) || nonProductionSourcePattern.test(path)) {
      continue;
    }

    const nativeStorageReferences = [...byPath.get(path).matchAll(/\blocalStorage\b/g)];
    const nativeStorageAccesses = [...byPath.get(path).matchAll(/\blocalStorage\.(\w+)/g)];
    const isLegacyKeyCleanup =
      path === "src/app/data/storage/appLocalStorage.ts" &&
      nativeStorageReferences.length === nativeStorageAccesses.length &&
      nativeStorageAccesses.every(([, member]) => member === "removeItem");
    if (nativeStorageReferences.length > 0 && !isLegacyKeyCleanup) {
      violations.push(path + ": native localStorage is forbidden; use the application RgoLocalStorageService instance");
    }

    if (
      path !== "src/app/auth/api/appAuth.api.springSession.ts" &&
      /['"]\/auth\/(?:login|logout|session)['"]/.test(byPath.get(path))
    ) {
      violations.push(path + ": concrete authentication endpoint paths belong only in appAuth.api.springSession.ts");
    }

    if (
      path === "src/app/data/http/createAppAxios.ts" &&
      /(?:auth\/|[Aa]uth(?:entication)?|[Ss]ession[Ee]xpiry)/.test(byPath.get(path))
    ) {
      violations.push(path + ": generic Axios setup must not contain authentication knowledge");
    }

    if (
      new RegExp(`^src/features/(?:${groupedDevelopmentFeaturePattern}|[^/]+)/api/[^/]+\\.api\\.ts$`).test(path) &&
      /from ['"](?:axios|zod)['"]/.test(byPath.get(path))
    ) {
      violations.push(
        path + ": feature API ports must not leak Axios or Zod; keep transport and schemas in adapters/models",
      );
    }

    const signalPath = path.match(/^(src\/.+\/signals)\/(.+)$/);
    if (signalPath) {
      const [, signalsDirectory, pathWithinSignals] = signalPath;
      const parts = pathWithinSignals.split("/");
      const isAppRegistryFile =
        signalsDirectory === "src/app/bootstrap/signals" &&
        ["initSignalEffects.ts", "signalModules.ts"].includes(pathWithinSignals);

      if (!isAppRegistryFile) {
        if (parts.length !== 2) {
          violations.push(path + ": every Signal group must use one flat signals/<group>/ directory");
        } else {
          const [groupName, fileName] = parts;
          const stem = signalStem(groupName);
          const allowedFile = new RegExp("^" + stem + "(?:\\.(?:actions|effects|model|service))?\\.ts$");
          if (!allowedFile.test(fileName)) {
            violations.push(path + ": Signal-group files must share the " + stem + " stem");
          }
        }
      }
    }

    const featureName = sourceFeatureName(path);
    for (const record of importRecords(path, byPath.get(path))) {
      const { specifier } = record;
      const candidatePaths = moduleCandidates(path, specifier);
      const targetPath = candidatePaths.find(candidate => byPath.has(candidate));
      const sourceAppLayer = sourceAppArea(path);
      const targetAppLayer = targetPath ? sourceAppArea(targetPath) : undefined;
      const isRouterComposition = path.startsWith("src/app/router/");
      const isTestModule = /\.test\.[cm]?[jt]sx?$/.test(path);
      const isDocumentationPresentationImport =
        targetPath === "src/app/shell/documentation/index.ts" && documentationPresentationConsumers.has(path);
      const isArchitectureCatalogComposition =
        path === "src/app/router/routeRegistry.tsx" &&
        targetPath === "src/features/development-guide/architecture/index.ts" &&
        record.namedImports.length > 0 &&
        record.namedImports.every(({ imported }) =>
          [
            "ArchitectureArticleId",
            "ArchitectureRelatedLink",
            "architectureArticleCatalog",
            "architectureGroups",
          ].includes(imported),
        );
      const isHandbookCatalogComposition =
        path === "src/app/router/handbookRoutes.tsx" &&
        targetPath === "src/features/development-guide/handbook/index.ts" &&
        record.namedImports.length > 0 &&
        record.namedImports.every(({ imported }) =>
          [
            "handbookArticles",
            "handbookCategories",
            "handbookTopics",
            "HandbookArticleId",
            "HandbookFinderEntry",
            "HandbookFinderFilters",
            "HandbookCategoryId",
            "HandbookTopicId",
          ].includes(imported),
        );

      if (
        !isTestModule &&
        !rawMuiColorSchemeOwners.has(path) &&
        /^@mui\/material(?:\/|$)/.test(specifier) &&
        ((record.namespaceImport && !record.typeOnly && /^@mui\/material\/styles(?:\/|$)/.test(specifier)) ||
          record.namedImports.some(({ imported, typeOnly }) => imported === "useColorScheme" && !typeOnly))
      ) {
        violations.push(
          path + ": application code must use useAppColorScheme instead of the raw MUI useColorScheme hook",
        );
      }

      if (path.startsWith("src/app/shell/") && !record.typeOnly && targetPath) {
        const restrictedTarget = [...reachableExportTargets(exportGraph, targetPath)].find(
          candidate =>
            candidate === "src/app/router/routeRegistry.tsx" ||
            candidate.startsWith("src/pages/") ||
            candidate.startsWith("src/app/auth/"),
        );
        if (restrictedTarget) {
          violations.push(
            path +
              ": shell presentation must receive navigation data and authentication behavior from router composition",
          );
        }
      }

      const contextOwner = targetPath ? privateContextOwner(targetPath) : undefined;
      if (contextOwner && !path.startsWith(contextOwner + "/")) {
        violations.push(path + ": context objects are private to their owning capability");
      }

      const internalDirectory = targetPath ? privateInternalDirectory(targetPath) : undefined;
      const privateOwner = internalDirectory?.slice(0, -"/internal".length);
      if (privateOwner && !path.startsWith(privateOwner + "/")) {
        violations.push(path + ": internal modules are private to their owning capability");
      }

      if (specifier.includes("mocks/") && !isTestModule) {
        if (path !== "src/main.tsx" || specifier !== "@mocks/browser") {
          violations.push(path + ": only main may dynamically import the mock bootstrap module");
        }
      }
      if (
        path.startsWith("src/app/auth/") &&
        !isTestModule &&
        (/mocks\//.test(specifier) || /@\/app\/(?:bootstrap\/signals|data\/storage)/.test(specifier))
      ) {
        violations.push(path + ": authentication must not depend on mocks, Signals, or storage");
      }

      if (
        [
          "bootstrap/config",
          "bootstrap/signals",
          "data/http",
          "data/query",
          "data/storage",
          "forms",
          "overlays",
          "localization",
          "theme",
        ].includes(sourceAppLayer) &&
        ["bootstrap/runtime", "router", "shell"].includes(targetAppLayer)
      ) {
        violations.push(path + ": application leaf modules must not import upward into runtime, router, or shell");
      }

      if (
        /^@\/(?:test|stories)\b/.test(specifier) ||
        /^@test(?:\/|$)/.test(specifier) ||
        /(?:^|\/)examples\b/.test(specifier) ||
        candidatePaths.some(
          candidatePath => candidatePath.startsWith("tests/") || nonProductionSourcePattern.test(candidatePath),
        )
      ) {
        violations.push(path + ": production source must not import test, Storybook, or example code");
      }

      const featureImport = specifier.match(featureImportPattern);
      if (featureImport) {
        const [, targetFeature, suffix] = featureImport;
        const isPublicFeatureImport = !suffix;
        const isOwnFeatureImport = featureName === targetFeature;
        const isRuntimeComposition = path === "src/app/bootstrap/runtime/appFeatures.ts";
        const isSignalComposition = path === "src/app/bootstrap/signals/signalModules.ts";
        const isPageComposition = path.startsWith("src/pages/");

        if (
          !isOwnFeatureImport &&
          (!isPublicFeatureImport ||
            (!isRuntimeComposition &&
              !isSignalComposition &&
              !isPageComposition &&
              !isArchitectureCatalogComposition &&
              !isHandbookCatalogComposition &&
              !featureName))
        ) {
          violations.push(path + ": cross-boundary feature imports must use the target feature index.ts");
        }
      }

      if (path === "src/app/bootstrap/signals/signalModules.ts" && featureImportPattern.test(specifier)) {
        const targetFeature = specifier.match(featureImportPattern)?.[1];
        const expectedMember = `${featureLeafName(targetFeature)}SignalModule`;
        if (
          record.kind !== "import" ||
          record.namespaceImport ||
          record.namedImports.length === 0 ||
          record.namedImports.some(
            ({ imported, local, typeOnly }) => typeOnly || imported !== expectedMember || local !== expectedMember,
          )
        ) {
          violations.push(
            path + `: feature lifecycle registration may import only the public ${expectedMember} member`,
          );
        }
      }

      if (specifier.startsWith("@/pages")) {
        if (!isRouterComposition) {
          violations.push(path + ": only app/router may import route entries from src/pages");
        }
      }

      const isOwnFeatureHookWrapper =
        featureName &&
        path === `src/features/${featureName}/hooks/use${pascalCase(featureLeafName(featureName))}Feature.ts` &&
        specifier === "@/app/bootstrap/runtime/useAppFeature";
      const isSettingsDefinitionImport = specifier === "@/features/settings/types/AppSettingsSection";
      const isSettingsShellPreferenceImport =
        featureName === "settings" && /^@\/app\/shell\/(?:appShellConfig|preferences\/)/.test(specifier);
      if (
        featureName &&
        specifier.startsWith("@/app/") &&
        !isOwnFeatureHookWrapper &&
        !isSettingsDefinitionImport &&
        !isSettingsShellPreferenceImport &&
        !isDocumentationPresentationImport &&
        !candidatePaths.some(candidate => featureApplicationLeafPaths.has(candidate)) &&
        !/^@\/app\/(?:bootstrap\/(?:config|signals)|data\/(?:http|query|storage)|forms\/(?:types|hooks|utils|components)|overlays\/hooks|localization|theme)(?:\/|$)/.test(
          specifier,
        )
      ) {
        violations.push(path + ": features may depend only on approved application leaf modules");
      }

      if (
        path.startsWith("src/pages/") &&
        specifier.startsWith("@/app/") &&
        !(path === "src/pages/LoginPage.tsx" && specifier.startsWith("@/app/auth/")) &&
        !isDocumentationPresentationImport &&
        !candidatePaths.some(candidate => pageApplicationLeafPaths.has(candidate)) &&
        !/^@\/app\/(?:bootstrap\/signals|localization|theme)(?:\/|$)/.test(specifier)
      ) {
        violations.push(path + ": pages may depend only on feature interfaces and approved presentation leaf modules");
      }

      if (
        path.startsWith("src/app/") &&
        path !== "src/app/bootstrap/runtime/appFeatures.ts" &&
        path !== "src/app/bootstrap/signals/signalModules.ts" &&
        specifier.startsWith("@/features/") &&
        !isArchitectureCatalogComposition &&
        !isHandbookCatalogComposition
      ) {
        violations.push(
          path +
            ": application infrastructure must not import feature internals; composition belongs in app/bootstrap/runtime",
        );
      }

      if (specifier.startsWith(".")) {
        const targetFeatureName = targetPath ? sourceFeatureName(targetPath) : undefined;
        const isRuntimeComposition = path === "src/app/bootstrap/runtime/appFeatures.ts";
        const isSignalComposition = path === "src/app/bootstrap/signals/signalModules.ts";
        const isPageComposition = path.startsWith("src/pages/");

        if (path === "src/app/bootstrap/signals/signalModules.ts" && targetFeatureName) {
          const expectedMember = `${featureLeafName(targetFeatureName)}SignalModule`;
          if (
            targetPath !== `src/features/${targetFeatureName}/index.ts` ||
            record.kind !== "import" ||
            record.namespaceImport ||
            record.namedImports.length === 0 ||
            record.namedImports.some(
              ({ imported, local, typeOnly }) => typeOnly || imported !== expectedMember || local !== expectedMember,
            )
          ) {
            violations.push(
              path + `: feature lifecycle registration may import only the public ${expectedMember} member`,
            );
          }
        }

        if (targetFeatureName && targetFeatureName !== featureName) {
          const isPublicFeatureImport =
            targetPath === `src/features/${targetFeatureName}/index.ts` ||
            targetPath === `src/features/${targetFeatureName}/index.tsx`;
          if (
            !isPublicFeatureImport ||
            (!isRuntimeComposition &&
              !isSignalComposition &&
              !isPageComposition &&
              !isArchitectureCatalogComposition &&
              !isHandbookCatalogComposition &&
              !featureName)
          ) {
            violations.push(path + ": cross-boundary feature imports must use the target feature index.ts");
          }
        }

        if (targetPath?.startsWith("src/pages/")) {
          if (!isRouterComposition) {
            violations.push(path + ": only app/router may import route entries from src/pages");
          }
        }

        const isOwnFeatureHookWrapper =
          featureName &&
          path === `src/features/${featureName}/hooks/use${pascalCase(featureLeafName(featureName))}Feature.ts` &&
          targetPath === "src/app/bootstrap/runtime/useAppFeature.ts";
        const isSettingsDefinitionImport = targetPath === "src/features/settings/types/AppSettingsSection.ts";
        const isSettingsShellPreferenceImport =
          featureName === "settings" && /^src\/app\/shell\/(?:appShellConfig\.ts|preferences\/)/.test(targetPath ?? "");
        if (
          featureName &&
          targetPath?.startsWith("src/app/") &&
          !isOwnFeatureHookWrapper &&
          !isSettingsDefinitionImport &&
          !isSettingsShellPreferenceImport &&
          !isDocumentationPresentationImport &&
          !featureApplicationLeafPaths.has(targetPath) &&
          !/^src\/app\/(?:bootstrap\/(?:config|signals)|data\/(?:http|query|storage)|forms\/(?:types|hooks|utils|components)|overlays\/hooks|localization|theme)(?:\/|$)/.test(
            targetPath,
          )
        ) {
          violations.push(path + ": features may depend only on approved application leaf modules");
        }

        if (
          path.startsWith("src/pages/") &&
          targetPath?.startsWith("src/app/") &&
          !(path === "src/pages/LoginPage.tsx" && targetPath.startsWith("src/app/auth/")) &&
          !isDocumentationPresentationImport &&
          !pageApplicationLeafPaths.has(targetPath) &&
          !/^src\/app\/(?:bootstrap\/signals|localization|theme)(?:\/|$)/.test(targetPath)
        ) {
          violations.push(
            path + ": pages may depend only on feature interfaces and approved presentation leaf modules",
          );
        }

        if (
          path.startsWith("src/app/") &&
          !isRuntimeComposition &&
          path !== "src/app/bootstrap/signals/signalModules.ts" &&
          targetFeatureName &&
          !isArchitectureCatalogComposition &&
          !isHandbookCatalogComposition
        ) {
          violations.push(
            path +
              ": application infrastructure must not import feature internals; composition belongs in app/bootstrap/runtime",
          );
        }
      }
    }
  }

  assertFeatureHookPolicy(byPath, violations);
  assertAcyclic(byPath, violations);

  assert.deepEqual(violations, [], violations.join("\n"));
}

function assertAuthenticationContract(files) {
  const byPath = new Map(files.map(file => [file.destinationPath, file.source]));
  for (const path of [
    "src/app/auth/createAppAuthRuntime.ts",
    "src/app/auth/components/AppAuthGate.tsx",
    "src/app/auth/components/AppAuthProvider.tsx",
    "mocks/browser.ts",
  ]) {
    assert.ok(byPath.has(path), "Missing authentication seam: " + path);
  }
  assert.match(byPath.get("src/app/bootstrap/runtime/createAppRuntime.ts"), /\bauth\s*[:,]/);
  const main = byPath.get("src/main.tsx");
  const loadAppConfig = byPath.get("src/app/bootstrap/config/loadAppConfig.ts");
  const vite = byPath.get("vite.config.ts");

  assert.match(main, /import\.meta\.env\.DEV && config\.VITE_API_MODE/);
  assert.match(main, /isProductionBuild:\s*import\.meta\.env\.PROD/);
  assert.match(main, /mocks\/browser/);
  assert.match(loadAppConfig, /buildEnvironment\.isProductionBuild/);
  assert.doesNotMatch(loadAppConfig, /VITE_APP_ENV === ['"]production['"]/);
  assert.match(vite, /publicDir:\s*['"]public['"]/);
  assert.match(vite, /excludeMockServiceWorkerFromProductionBuild/);
}

function requiredFixtures(...additionalFiles) {
  return [
    { destinationPath: "src/main.tsx", source: "" },
    { destinationPath: "src/app/App.tsx", source: "" },
    { destinationPath: "src/app/router/routes.tsx", source: "" },
    {
      destinationPath: "src/app/bootstrap/runtime/AppRuntimeContext.ts",
      source: "",
    },
    {
      destinationPath: "src/app/bootstrap/runtime/AppRuntimeProvider.tsx",
      source: "export function AppRuntimeProvider() { return null }",
    },
    {
      destinationPath: "src/app/bootstrap/runtime/useAppFeature.ts",
      source: "",
    },
    {
      destinationPath: "src/app/bootstrap/runtime/createAppRuntime.ts",
      source: "",
    },
    {
      destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
      source: "export const allowedCrossFeatureHooks = {} as const",
    },
    ...additionalFiles,
  ];
}

function assertPositiveFixtures() {
  for (const specifier of [
    "@/app/forms/components/AppSingleChoiceToggleGroup",
    "../../../app/forms/components/AppSingleChoiceToggleGroup.js",
  ]) {
    assert.doesNotThrow(() =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/forms/components/AppSingleChoiceToggleGroup.tsx",
            source: "export function AppSingleChoiceToggleGroup() { return null }",
          },
          {
            destinationPath: "src/features/project/components/ProjectsPanel.tsx",
            source: `import { AppSingleChoiceToggleGroup } from '${specifier}'\nvoid AppSingleChoiceToggleGroup`,
          },
        ),
      ),
    );
  }

  for (const destinationPath of featureApplicationLeafPaths) {
    for (const specifier of [
      destinationPath.replace(/^src\//, "@/").replace(/\.tsx?$/, ""),
      "../../../" + destinationPath.slice("src/".length).replace(/\.tsx?$/, ".js"),
    ]) {
      assert.doesNotThrow(() =>
        assertNoViolations(
          requiredFixtures(
            { destinationPath, source: "" },
            {
              destinationPath: "src/features/project/components/ProjectsPanel.tsx",
              source: `import '${specifier}'`,
            },
          ),
        ),
      );
    }
  }

  for (const destinationPath of [
    "src/app/App.tsx",
    "src/app/auth/publicAuth.ts",
    "src/app/bootstrap/config/additionalConfig.ts",
    "src/app/data/http/additionalHttpPolicy.ts",
    "src/app/localization/additionalLocalization.ts",
    "src/app/router/additionalRoutePolicy.ts",
    "src/app/shell/additionalShellPolicy.ts",
    "src/app/theme/additionalThemePolicy.ts",
  ]) {
    assert.doesNotThrow(() =>
      assertNoViolations(
        requiredFixtures({
          destinationPath,
          source: "",
        }),
      ),
    );
  }

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "tests/features/project/components/ProjectsPanel.spec.tsx",
          source: "import '@test/renderApp'",
        },
        {
          destinationPath: "src/features/project/components/ProjectsPanel.tsx",
          source: "",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/app/bootstrap/runtime/useAppFeature.ts",
          source:
            "import type { AppRuntime } from './createAppRuntime'\nexport function useAppFeature(name: keyof AppRuntime['features']) { return name }",
        },
        {
          destinationPath: "src/features/development-guide/contacts/index.ts",
          source: "export { useContactsFeature } from './hooks/useContactsFeature'",
        },
        {
          destinationPath: "src/features/development-guide/contacts/hooks/useContactsFeature.ts",
          source:
            "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nexport function useContactsFeature() { return useAppFeature('contacts') }",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/features/development-guide/patterns/forms/components/FormsPanel.tsx",
          source:
            "import { ExampleGallery } from '@/features/development-guide/patterns/gallery'\nexport function FormsPanel() { return ExampleGallery() }",
        },
        {
          destinationPath: "src/features/development-guide/patterns/gallery/index.ts",
          source: "export { ExampleGallery } from './components/ExampleGallery'",
        },
        {
          destinationPath: "src/features/development-guide/patterns/gallery/components/ExampleGallery.tsx",
          source: "export function ExampleGallery() { return null }",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/pages/development-guide/patterns/forms/FormsPage.tsx",
          source: "import { FormsPanel } from '@/features/development-guide/patterns/forms'\nvoid FormsPanel",
        },
        {
          destinationPath: "src/features/development-guide/patterns/forms/index.ts",
          source: "export { FormsPanel } from './components/FormsPanel'",
        },
        {
          destinationPath: "src/features/development-guide/patterns/forms/components/FormsPanel.tsx",
          source: "export function FormsPanel() { return null }",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/features/development-guide/patterns/gallery/index.ts",
          source: "export { ExampleGallery } from './components/ExampleGallery'",
        },
        {
          destinationPath: "src/features/development-guide/patterns/gallery/components/ExampleGallery.tsx",
          source: "export function ExampleGallery() { return null }",
        },
        {
          destinationPath: "src/features/project/components/ProjectPatternsPanel.tsx",
          source:
            "import { ExampleGallery } from '@/features/development-guide/patterns/gallery'\nexport function ProjectPatternsPanel() { return ExampleGallery() }",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/app/bootstrap/runtime/useAppFeature.ts",
          source:
            "import type { AppRuntime } from './createAppRuntime'\nexport function useAppFeature(name: keyof AppRuntime['features']) { return name }",
        },
        {
          destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
          source:
            "import { useProjectFeature } from '@/features/project'\nexport const allowedCrossFeatureHooks = {} as const",
        },
        {
          destinationPath: "src/features/project/index.ts",
          source: "export { useProjectFeature } from './hooks/useProjectFeature'",
        },
        {
          destinationPath: "src/features/project/hooks/useProjectFeature.ts",
          source:
            "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nexport function useProjectFeature() { return useAppFeature('project') }",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/features/project/index.ts",
          source: "export { type ProjectFeature } from './project.feature'",
        },
        {
          destinationPath: "src/features/project/project.feature.ts",
          source: "import { ProjectFeature } from './index'\nexport const project = ProjectFeature",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
          source: "export const allowedCrossFeatureHooks = { project: ['task'] } as const",
        },
        {
          destinationPath: "src/features/project/index.ts",
          source: "export { useProjectFeature } from './hooks/useProjectFeature'",
        },
        {
          destinationPath: "src/features/project/hooks/useProjectFeature.ts",
          source:
            "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nexport function useProjectFeature() { return useAppFeature('project') }",
        },
        {
          destinationPath: "src/features/project/components/ProjectBridge.ts",
          source: "import { useTaskFeature } from '@/features/task'",
        },
        {
          destinationPath: "src/features/task/index.ts",
          source: "export { useTaskFeature } from './hooks/useTaskFeature'",
        },
        {
          destinationPath: "src/features/task/hooks/useTaskFeature.ts",
          source:
            "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nexport function useTaskFeature() { return useAppFeature('task') }",
        },
      ),
    ),
  );

  for (const specifier of ["@/features/counter", "../../../features/counter"]) {
    assert.doesNotThrow(() =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/bootstrap/signals/signalModules.ts",
            source: `import { counterSignalModule } from '${specifier}'\nvoid counterSignalModule`,
          },
          {
            destinationPath: "src/features/counter/index.ts",
            source: "export const counterSignalModule = {}",
          },
        ),
      ),
    );
  }

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/app/auth/contexts/AppAuthContext.ts",
          source: "export const AppAuthContext = {}",
        },
        {
          destinationPath: "src/app/auth/hooks/useAppAuth.ts",
          source: "export function useAppAuth() {}",
        },
        {
          destinationPath: "src/app/auth/components/AppAuthProvider.tsx",
          source: "export function AppAuthProvider() { return null }",
        },
        {
          destinationPath: "src/app/auth/session/AppSessionContext.ts",
          source: "export const AppSessionContext = {}",
        },
        {
          destinationPath: "src/app/auth/session/AppSessionProvider.tsx",
          source: "export function AppSessionProvider() { return null }",
        },
        {
          destinationPath: "src/app/auth/session/useAppSession.ts",
          source: "export function useAppSession() {}",
        },
        {
          destinationPath: "src/app/localization/contexts/AppLocalizationContext.ts",
          source: "export const AppLocalizationContext = {}",
        },
        {
          destinationPath: "src/app/localization/hooks/useAppLocalization.ts",
          source: "export function useAppLocalization() {}",
        },
        {
          destinationPath: "src/app/localization/components/AppLocalizationProvider.tsx",
          source: "export function AppLocalizationProvider() { return null }",
        },
        {
          destinationPath: "src/app/localization/calendar/AppCalendarContext.ts",
          source: "export const AppCalendarContext = {}",
        },
        {
          destinationPath: "src/app/localization/calendar/AppCalendarProvider.tsx",
          source: "export function AppCalendarProvider() { return null }",
        },
        {
          destinationPath: "src/app/localization/calendar/useAppCalendar.ts",
          source: "export function useAppCalendar() {}",
        },
        {
          destinationPath: "src/app/theme/components/AppThemeProvider.tsx",
          source: "export function AppThemeProvider() { return null }",
        },
        {
          destinationPath: "src/app/theme/preferences/AppDisplayPreferencesProvider.tsx",
          source: "export function AppDisplayPreferencesProvider() { return null }",
        },
        {
          destinationPath: "src/app/theme/palette/AppPaletteProvider.tsx",
          source: "export function AppPaletteProvider() { return null }",
        },
        {
          destinationPath: "src/app/shell/components/AppShell.tsx",
          source: "export function AppShell() { return null }",
        },
        {
          destinationPath: "src/app/shell/account/AppAccountProvider.tsx",
          source: "export function AppAccountProvider() { return null }",
        },
        {
          destinationPath: "src/features/settings/sections/interface/components/InterfaceSettingsControls.tsx",
          source: "export function InterfaceSettingsControls() { return null }",
        },
        {
          destinationPath: "src/features/settings/sections/interface/hooks/useInterfaceSettingsSection.tsx",
          source: "export function useInterfaceSettingsSection() {}",
        },
        {
          destinationPath: "src/features/settings/sections/interface/preview/PreviewControls.tsx",
          source: "export function PreviewControls() { return null }",
        },
        {
          destinationPath: "src/features/settings/sections/interface/preview/usePreview.ts",
          source: "export function usePreview() {}",
        },
        {
          destinationPath: "src/features/settings/types/AppSettingsSection.ts",
          source: "export interface AppSettingsSection {}",
        },
      ),
    ),
  );

  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures(
        {
          destinationPath: "src/app/bootstrap/runtime/AppRuntimeContext.ts",
          source: "export interface AppRuntimeContextValue {}",
        },
        {
          destinationPath: "src/app/bootstrap/runtime/AppRuntimeProvider.tsx",
          source:
            "export type { AppRuntimeContextValue } from './AppRuntimeContext'\nexport function AppRuntimeProvider() { return null }",
        },
        {
          destinationPath: "src/app/router/types/AppRoute.ts",
          source: "export interface AppRoute {}",
        },
        {
          destinationPath: "src/app/auth/types/AppAuthLoginAssistance.ts",
          source: "export interface AppAuthLoginAssistance {}",
        },
        {
          destinationPath: "src/app/router/index.ts",
          source: "export type { AppRoute } from './types/AppRoute'",
        },
        {
          destinationPath: "src/app/shell/components/AppNavigation.tsx",
          source:
            "import type { AppRoute } from '@/app/router'\nimport type { AppAuthLoginAssistance } from '@/app/auth/types/AppAuthLoginAssistance'\nvoid (0 as unknown as AppRoute | AppAuthLoginAssistance)",
        },
      ),
    ),
  );
}

function assertNegativeFixtures() {
  for (const unsupportedPath of [
    "forms/validation/inputPolicy",
    "forms/components-extra/inputPolicy",
    "overlays/components/UnapprovedDrawer",
    "overlays/internal/gesture",
  ]) {
    for (const specifier of [`@/app/${unsupportedPath}`, `../../../app/${unsupportedPath}.js`]) {
      assert.throws(
        () =>
          assertNoViolations(
            requiredFixtures(
              {
                destinationPath: `src/app/${unsupportedPath}.ts`,
                source: "export const inputPolicy = {}",
              },
              {
                destinationPath: "src/features/project/components/ProjectsPanel.tsx",
                source: `import { inputPolicy } from '${specifier}'\nvoid inputPolicy`,
              },
            ),
          ),
        /features may depend only on approved application leaf modules/,
      );
    }
  }

  for (const root of retiredApplicationRoots) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures({
            destinationPath: `src/app/${root}/retired.ts`,
            source: "",
          }),
        ),
      /unsupported first-level app owner/,
    );
  }

  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/shell/components/ColorModeButton.tsx",
          source: "import { useColorScheme } from '@mui/material/styles'\nvoid useColorScheme",
        }),
      ),
    /application code must use useAppColorScheme instead of the raw MUI useColorScheme hook/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "tests/app/arbitrary/Orphan.test.ts",
          source: "",
        }),
      ),
    /focused test path must mirror an existing src module/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/components/ProjectsPanel.test.tsx",
          source: "",
        }),
      ),
    /automated tests must live under tests/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "tests/features/project/components/ProjectsPanel.test.tsx",
          source: "import { ProjectsPanel } from '../../../../src/features/project/components/ProjectsPanel'",
        }),
      ),
    /tests must import production source through the @\/ alias/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/App.tsx",
          source: "import '@test/renderApp'",
        }),
      ),
    /production source must not import test, Storybook, or example code/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/App.tsx",
          source: "import '../../tests/renderApp'",
        }),
      ),
    /production source must not import test, Storybook, or example code/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/App.tsx",
            source: "import '@/features/project/stories/ProjectsQueryExample'",
          },
          {
            destinationPath: "src/features/project/stories/ProjectsQueryExample.tsx",
            source: "",
          },
        ),
      ),
    /production source must not import test, Storybook, or example code/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/features/project/components/ProjectsPanel.tsx",
            source: "import '../stories/ProjectsQueryExample'",
          },
          {
            destinationPath: "src/features/project/stories/ProjectsQueryExample.tsx",
            source: "",
          },
        ),
      ),
    /production source must not import test, Storybook, or example code/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/features/project/components/ProjectsPanel.tsx",
            source: "import './ProjectsPanel.test'",
          },
          {
            destinationPath: "src/features/project/components/ProjectsPanel.test.tsx",
            source: "",
          },
        ),
      ),
    /production source must not import test, Storybook, or example code/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/api/project.api.ts",
          source: "import { z } from 'zod'\nvoid z",
        }),
      ),
    /feature API ports must not leak Axios or Zod/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/pages/ProjectsPage.tsx",
          source: "import { ProjectsPanel } from '@/features/project/components/ProjectsPanel'",
        }),
      ),
    /cross-boundary feature imports/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/pages/development-guide/patterns/forms/FormsPage.tsx",
            source:
              "import { FormsPanel } from '@/features/development-guide/patterns/forms/components/FormsPanel'\nvoid FormsPanel",
          },
          {
            destinationPath: "src/features/development-guide/patterns/forms/components/FormsPanel.tsx",
            source: "export function FormsPanel() { return null }",
          },
        ),
      ),
    /cross-boundary feature imports/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/features/development-guide/patterns/forms/components/FormsPanel.tsx",
            source:
              "import { ExampleGallery } from '@/features/development-guide/patterns/gallery/components/ExampleGallery'\nvoid ExampleGallery",
          },
          {
            destinationPath: "src/features/development-guide/patterns/gallery/components/ExampleGallery.tsx",
            source: "export function ExampleGallery() { return null }",
          },
        ),
      ),
    /cross-boundary feature imports/,
  );
  for (const source of [
    "import { AppAuthContext } from '@/app/auth/contexts/AppAuthContext'",
    "import { AppAuthContext } from '../app/auth/contexts/AppAuthContext'",
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/pages/LoginPage.tsx",
              source,
            },
            {
              destinationPath: "src/app/auth/contexts/AppAuthContext.ts",
              source: "export const AppAuthContext = {}",
            },
          ),
        ),
      /context objects are private/,
    );
  }
  for (const [contextPath, source] of [
    [
      "src/app/bootstrap/runtime/AppRuntimeContext.ts",
      "import { AppRuntimeContext } from '@/app/bootstrap/runtime/AppRuntimeContext'",
    ],
    [
      "src/app/theme/preferences/AppDisplayPreferencesContext.ts",
      "import { AppDisplayPreferencesContext } from '@/app/theme/preferences/AppDisplayPreferencesContext'",
    ],
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/pages/settings/SettingsPage.tsx",
              source,
            },
            {
              destinationPath: contextPath,
              source: "export const Context = {}",
            },
          ),
        ),
      /context objects are private/,
    );
  }
  for (const contextExport of [
    "export { AppAuthContext } from '@/app/auth/contexts/AppAuthContext'",
    "export { AppAuthContext } from './contexts/AppAuthContext'",
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/app/auth/index.ts",
              source: contextExport,
            },
            {
              destinationPath: "src/app/auth/contexts/AppAuthContext.ts",
              source: "export const AppAuthContext = {}",
            },
          ),
        ),
      /non-type barrels must not re-export private context modules/,
    );
  }
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/auth/index.ts",
            source: "export { AppAuthContext } from './publicAuth'",
          },
          {
            destinationPath: "src/app/auth/publicAuth.ts",
            source: "export { AppAuthContext } from './contexts/AppAuthContext'",
          },
          {
            destinationPath: "src/app/auth/contexts/AppAuthContext.ts",
            source: "export const AppAuthContext = {}",
          },
        ),
      ),
    /non-type barrels must not re-export private context modules/,
  );
  for (const internalExport of [
    "export { secret } from '@/features/project/internal/secret'",
    "export { secret } from './internal/secret'",
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/features/project/index.ts",
              source: internalExport,
            },
            {
              destinationPath: "src/features/project/internal/secret.ts",
              source: "export const secret = true",
            },
          ),
        ),
      /non-type barrels must not re-export private internal modules/,
    );
  }
  for (const source of ["import '@/app/router/routeRegistry'", "import '../../router/routeRegistry'"]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/app/shell/components/AppNavigation.tsx",
              source,
            },
            {
              destinationPath: "src/app/router/routeRegistry.tsx",
              source: "",
            },
          ),
        ),
      /shell presentation must receive navigation data/,
    );
  }
  for (const source of [
    "import '@/app/shell/documentation/DocumentationRouteLayout'",
    "import '../../../../app/shell/documentation/DocumentationRouteLayout'",
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/features/development-guide/architecture/components/ArchitectureArticle.tsx",
              source,
            },
            {
              destinationPath: "src/app/shell/documentation/DocumentationRouteLayout.tsx",
              source: "export function DocumentationRouteLayout() {}",
            },
            {
              destinationPath: "src/app/shell/documentation/index.ts",
              source: "export { DocumentationRouteLayout } from './DocumentationRouteLayout'",
            },
          ),
        ),
      /features may depend only on approved application leaf modules/,
    );
  }
  for (const source of [
    "import '@/features/development-guide/architecture/catalog/architectureArticles'",
    "import '../../features/development-guide/architecture/catalog/architectureArticles'",
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/app/router/routeRegistry.tsx",
              source,
            },
            {
              destinationPath: "src/features/development-guide/architecture/catalog/architectureArticles.ts",
              source: "export const architectureArticleCatalog = []",
            },
            {
              destinationPath: "src/features/development-guide/architecture/index.ts",
              source: "export { architectureArticleCatalog } from './catalog/architectureArticles'",
            },
          ),
        ),
      /cross-boundary feature imports/,
    );
  }
  for (const shellImport of ["import '@/app/router'", "import '../../router'"]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/app/shell/components/AppNavigation.tsx",
              source: shellImport,
            },
            {
              destinationPath: "src/app/router/index.ts",
              source: "export { appRoutes } from './publicRoutes'",
            },
            {
              destinationPath: "src/app/router/publicRoutes.ts",
              source: "export { appRoutes } from './routeRegistry'",
            },
            {
              destinationPath: "src/app/router/routeRegistry.tsx",
              source: "export const appRoutes = []",
            },
          ),
        ),
      /shell presentation must receive navigation data/,
    );
  }
  for (const [barrelPath, barrelSource] of [
    ["src/app/router/pageActions.ts", "export { ProjectsPage } from '@/pages/ProjectsPage'"],
    ["src/app/router/authActions.ts", "export { AppAuthActions } from '@/app/auth/components/AppAuthActions'"],
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/app/shell/components/AppNavigation.tsx",
              source: `import '${barrelPath.replace(/^src/, "@")}'`,
            },
            { destinationPath: barrelPath, source: barrelSource },
            {
              destinationPath: "src/pages/ProjectsPage.tsx",
              source: "export function ProjectsPage() { return null }",
            },
            {
              destinationPath: "src/app/auth/components/AppAuthActions.tsx",
              source: "export function AppAuthActions() { return null }",
            },
          ),
        ),
      /shell presentation must receive navigation data/,
    );
  }
  for (const source of [
    "import { CounterPanel } from '@/features/counter'",
    "import { CounterPanel } from '../../../features/counter'",
  ]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures(
            {
              destinationPath: "src/app/bootstrap/signals/signalModules.ts",
              source,
            },
            {
              destinationPath: "src/features/counter/index.ts",
              source: "export const CounterPanel = {}",
            },
          ),
        ),
      /feature lifecycle registration may import only/,
    );
  }
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/auth/hooks/AppAuth.ts",
          source: "",
        }),
      ),
    /hook filenames must start with use/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/auth/components/AppAuthProvider.tsx",
          source: "export function AuthProvider() { return null }",
        }),
      ),
    /provider filename must match/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/theme/preferences/AppDisplayPreferences.tsx",
          source: "export function AppDisplayPreferencesProvider() { return null }",
        }),
      ),
    /exported provider must use the matching Provider\.tsx filename/,
  );
  for (const [path, source, message] of [
    [
      "src/app/auth/AppAuthContext.ts",
      "export const AppAuthContext = {}",
      /expanded auth contexts peers belong in auth\/contexts/,
    ],
    [
      "src/app/auth/useAppAuth.ts",
      "export function useAppAuth() {}",
      /expanded auth hooks peers belong in auth\/hooks/,
    ],
    [
      "src/app/auth/AppAuthGate.tsx",
      "export function AppAuthGate() { return null }",
      /expanded auth components peers belong in auth\/components/,
    ],
    [
      "src/app/localization/runtime/AppLocalizationContext.ts",
      "export const AppLocalizationContext = {}",
      /expanded localization contexts peers belong in localization\/contexts/,
    ],
    [
      "src/app/localization/runtime/useAppLocalization.ts",
      "export function useAppLocalization() {}",
      /expanded localization hooks peers belong in localization\/hooks/,
    ],
    [
      "src/app/localization/runtime/AppLocalizationProvider.tsx",
      "export function AppLocalizationProvider() { return null }",
      /expanded localization components peers belong in localization\/components/,
    ],
    [
      "src/app/shell/AppShell.tsx",
      "export function AppShell() { return null }",
      /primary shell React entry belongs in shell\/components/,
    ],
    [
      "src/app/theme/AppThemeProvider.tsx",
      "export function AppThemeProvider() { return null }",
      /primary theme provider belongs in theme\/components/,
    ],
    [
      "src/features/settings/AppSettingsPanel.tsx",
      "export function AppSettingsPanel() { return null }",
      /generic settings panel belongs in settings\/components/,
    ],
    [
      "src/features/settings/models/AppSettingsSection.ts",
      "export interface AppSettingsSection {}",
      /settings section contract belongs in settings\/types/,
    ],
    [
      "src/features/settings/sections/interface/useInterfaceSettingsSection.tsx",
      "export function useInterfaceSettingsSection() {}",
      /settings section interface hooks peers belong in sections\/interface\/hooks/,
    ],
    [
      "src/features/settings/sections/interface/InterfaceSettingsControls.tsx",
      "export function InterfaceSettingsControls() { return null }",
      /settings section interface components peers belong in sections\/interface\/components/,
    ],
  ]) {
    assert.throws(() => assertNoViolations(requiredFixtures({ destinationPath: path, source })), message);
  }
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/shared/format.ts",
          source: "",
        }),
      ),
    /dumping-ground roots/,
  );
  for (const fileName of ["ProjectState.ts", "Project.test.ts", "Project.spec.ts", "Project.stories.tsx"]) {
    assert.throws(
      () =>
        assertNoViolations(
          requiredFixtures({
            destinationPath: "src/features/project/" + fileName,
            source: "",
          }),
        ),
      /feature root may contain only index\.ts and \*\.feature\.ts files/,
    );
  }
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/index.ts",
          source: "import '@/app/router/routes'",
        }),
      ),
    /approved application leaf modules/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/index.ts",
          source: "import '../../app/router/routes.js'",
        }),
      ),
    /approved application leaf modules/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/data/http/client.ts",
          source: "import '@/app/bootstrap/runtime/createAppRuntime'",
        }),
      ),
    /application leaf modules must not import upward/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/data/http/client.ts",
          source: "import '../../bootstrap/runtime/createAppRuntime.js'",
        }),
      ),
    /application leaf modules must not import upward/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/pages/ProjectsPage.tsx",
          source: "import type { AppRuntime } from '@/app/bootstrap/runtime/createAppRuntime'",
        }),
      ),
    /pages may depend only/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/pages/ProjectsPage.tsx",
            source: "import '../features/project/internal'",
          },
          {
            destinationPath: "src/features/project/internal.ts",
            source: "",
          },
        ),
      ),
    /cross-boundary feature imports/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/features/project/index.ts",
            source: "import '@/features/task'",
          },
          {
            destinationPath: "src/features/task/index.ts",
            source: "import '@/features/project'",
          },
        ),
      ),
    /Dependency cycle/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/counter/signals/counter/sigCounter.effects.ts",
          source: "localStorage.setItem('counter', '1')",
        }),
      ),
    /native localStorage is forbidden/,
  );
  assert.doesNotThrow(() =>
    assertNoViolations(
      requiredFixtures({
        destinationPath: "src/app/data/storage/appLocalStorage.ts",
        source: "globalThis.localStorage.removeItem('retired-setting')",
      }),
    ),
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/data/storage/appLocalStorage.ts",
          source: "globalThis.localStorage.setItem('setting', 'value')",
        }),
      ),
    /native localStorage is forbidden/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/signals/projectFilters/actions/projectFilters.ts",
          source: "",
        }),
      ),
    /one flat signals\/<group>\/ directory/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/signals/projectFilters/actions.ts",
          source: "",
        }),
      ),
    /must share the sigProjectFilters stem/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/components/ProjectsPanel.tsx",
          source: "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nuseAppFeature('project')",
        }),
      ),
    /useAppFeature may be imported only/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/features/project/hooks/useProjectFeature.ts",
          source:
            "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nexport function useProjectFeature() { return useAppFeature('task') }",
        }),
      ),
    /exactly useAppFeature\('project'\)/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
            source: "export const allowedCrossFeatureHooks = { project: ['task'] } as const",
          },
          {
            destinationPath: "src/features/project/components/ProjectBridge.ts",
            source: "import { taskRuntime } from '@/features/task'",
          },
          {
            destinationPath: "src/features/task/index.ts",
            source: "export { useTaskFeature as taskRuntime } from './hooks/useTaskFeature'",
          },
          {
            destinationPath: "src/features/task/hooks/useTaskFeature.ts",
            source:
              "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nexport function useTaskFeature() { return useAppFeature('task') }",
          },
        ),
      ),
    /must be exported without a public alias/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures({
          destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
          source: "export const allowedCrossFeatureHooks = { unknown: [] } as const",
        }),
      ),
    /unknown source feature/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
            source: "export const allowedCrossFeatureHooks = { project: ['task', 'task'] } as const",
          },
          { destinationPath: "src/features/project/index.ts", source: "" },
          { destinationPath: "src/features/task/index.ts", source: "" },
        ),
      ),
    /duplicate dependency declared/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
            source: "export const allowedCrossFeatureHooks = { project: ['project'] } as const",
          },
          { destinationPath: "src/features/project/index.ts", source: "" },
        ),
      ),
    /cannot depend on itself/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/features/project/components/ProjectsPanel.tsx",
            source: "import { useTaskFeature } from '@/features/task'",
          },
          {
            destinationPath: "src/features/task/index.ts",
            source: "export { useTaskFeature } from './hooks/useTaskFeature'",
          },
          {
            destinationPath: "src/features/task/hooks/useTaskFeature.ts",
            source:
              "import { useAppFeature } from '@/app/bootstrap/runtime/useAppFeature'\nexport function useTaskFeature() { return useAppFeature('task') }",
          },
        ),
      ),
    /Undeclared cross-feature hook dependency/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
            source: "export const allowedCrossFeatureHooks = { project: ['task'] } as const",
          },
          { destinationPath: "src/features/project/index.ts", source: "" },
          { destinationPath: "src/features/task/index.ts", source: "" },
        ),
      ),
    /stale cross-feature hook permission/,
  );
  assert.throws(
    () =>
      assertNoViolations(
        requiredFixtures(
          {
            destinationPath: "src/app/bootstrap/runtime/appFeatures.ts",
            source: "export const allowedCrossFeatureHooks = { project: ['task'], task: ['project'] } as const",
          },
          {
            destinationPath: "src/features/project/components/ProjectBridge.ts",
            source: "import { useTaskFeature } from '@/features/task'",
          },
          {
            destinationPath: "src/features/project/index.ts",
            source: "export function useProjectFeature() {}",
          },
          {
            destinationPath: "src/features/task/components/TaskBridge.ts",
            source: "import { useProjectFeature } from '@/features/project'",
          },
          {
            destinationPath: "src/features/task/index.ts",
            source: "export function useTaskFeature() {}",
          },
        ),
      ),
    /Cross-feature hook dependency cycle/,
  );
}

export function verifyApplicationArchitecture(files) {
  assertPositiveFixtures();
  assertNegativeFixtures();
  assertNoViolations(files);
  assertAuthenticationContract(files);
}
