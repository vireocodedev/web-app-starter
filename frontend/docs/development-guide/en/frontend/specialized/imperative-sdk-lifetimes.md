# Give an imperative SDK one mounted lifecycle owner

Maps, charts, rich editors, and media viewers often create stateful objects outside React. Treat the instance, DOM target, event subscriptions, and asynchronous initialization as one owned resource. Rendering the same page again must not create a second unmanaged widget.

This is a **reference recipe** from FRED's OpenLayers integration. The starter does not install OpenLayers or FRED's `FredMap`, global event service, or map context. A neutral adapter can teach the lifecycle without adding a specialized library to every generated app.

## Trigger and ownership

Use an adapter when a library expects a mounted DOM target and exposes imperative methods or listeners. The adapter owns construction and teardown; feature code owns domain values and commands. Consumers receive a deliberate instance/capability interface only after initialization succeeds.

FRED creates its map after the target ref exists, wraps it, exposes context, and gates child rendering until ready. Cleanup detaches the target. Its event hook balances event-service `on` and `off` using the same key and listener. Those are useful ownership seams.

The historical provider also exports debugging globals and suppresses effect dependency checking. Do not copy those practices as a default or assume target detachment proves disposal of every SDK worker, layer, or subscription. Inspect the chosen SDK's actual cleanup contract.

## Pair acquisition and release

This is **conceptual pseudocode**, not an installed starter or SDK API:

```ts
const instance = createWidget(mountedTarget);
const removeListener = instance.onChange(handleChange);

return () => {
  removeListener();
  instance.detachTarget();
  instance.disposeOwnedResources();
};
```

The exact methods depend on the library. Keep callbacks stable where subscription churn matters and ensure cleanup removes the specific registered callback. Replacing the target or owner must release the old instance before publishing a new one. An asynchronous initialization result needs a generation/abort check so it cannot publish after unmount.

Do not allocate an expensive mutable SDK object during every render. Do not hide an instance in a module singleton merely to avoid lifecycle work; multiple routes or viewers can then share unintended state. A deliberate application-level singleton is possible only with a documented owner and disposal policy.

| Transition                    | Adapter behavior                                       |
| ----------------------------- | ------------------------------------------------------ |
| DOM target mounts             | Initialize once for the current owner                  |
| Data prop changes             | Update the existing instance through a defined method  |
| Listener changes              | Remove old registration and add the current one        |
| Initialization fails          | Expose recoverable failure without fake readiness      |
| Owner/target changes          | End old lifecycle and ignore late completions          |
| Unmount or development replay | Release listeners, target, timers, and owned resources |

## Failure and recovery

An SDK failure should not leave children reading a non-null asserted but unusable instance. Render loading/failure/retry under the adapter's actual readiness state. Retrying creates a new owned generation; the old failed initializer cannot later win the race.

Separate rendering failure from domain persistence. A map that cannot draw a draft does not mean the form saved or that the server rejected it. Provide an accessible alternative or clear unavailable message appropriate to the feature, especially when the visual is essential to task completion.

## Acceptance scenarios

Mount, unmount, and remount the page: no duplicate canvas, listeners, timers, or stale instance remain. Change data: the adapter updates rather than rebuilding unnecessarily. Replace a listener: only the current callback fires. Resolve initialization after navigation: no instance is published into a dead owner. Fail initialization and retry: readiness and failure messages stay truthful. Inspect keyboard and nonvisual access rather than assuming a canvas supplies accessible interaction.

Localize loading, failure, retry, and control names. Keep the SDK target's sizing explicit so a successfully initialized widget is not an invisible zero-height region.

## Avoid these shortcuts

Do not publish debugging globals as a runtime interface, suppress dependencies to conceal ownership, leak subscriptions, recreate instances on every render, or assume detaching a DOM node disposes all resources. Every acquired resource needs a named release owner.

## Sources and provenance

- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/providers/MapProvider/MapProvider.tsx` — mounted target construction, readiness gate, target detachment, and historical global/dependency limitations.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/hooks/useMapEvent.ts` — balanced named listener registration and cleanup.
