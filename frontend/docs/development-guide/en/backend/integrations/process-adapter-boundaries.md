# Treat a subprocess as a bounded integration adapter

**Support status: legacy comparison with an explicit hardening recipe.** FRED's Python bridge launches an algorithm module and parses typed result lines. The inspected source lacks deadline, cancellation propagation, bounded output and guaranteed process cleanup. Those are required new work for a reliable consumer adapter, not proven features of the peer implementation. Python support is not installed by this starter guide.

Use this pattern when an existing compute tool must remain outside the Java process. The application should own a typed operation contract; the adapter should own process setup, protocol, resource limits and failure semantics. A command-line tool returning some JSON is not yet a reliable background-job service.

## Preserve the useful seam without copying its gaps

The source has argument/result types, merges non-null additional arguments, builds a `ProcessBuilder` argument list and runs `python3 -m` with a selected module. It reads stdout line by line, recognizes a result-class prefix followed by JSON and maps matching lines to the declared result type. Result processing is invoked only when the process exit code is zero.

The process builder merges stderr into stdout. That drains one combined pipe; it is not separate bounded stderr classification or safe diagnostic retention. The adapter waits without a deadline and catches exceptions while returning whatever results were collected. A nonzero exit can therefore coexist with a returned list; callers cannot infer success merely from nonempty data.

| Observed mechanism                     | New consumer requirement                                                   |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Argument list rather than shell string | Allowlisted executable/module/options and protected working directory      |
| Typed prefixed result line             | Versioned schema, line/count/byte bounds and clear malformed-output policy |
| Combined stdout/stderr                 | Bounded draining and safe diagnostic separation/labeling                   |
| `waitFor()`                            | Deadline, interrupt/cancellation and termination escalation                |
| Return collected results after failure | Explicit success/failure/uncertain outcome; no accidental partial success  |

Do not copy source logging of complete arguments/output into a generic integration. Arguments and algorithm results may contain private payloads or credentials; choose an allowlisted diagnostic summary and correlation identity.

## Design a small protocol and outcome contract

For a hypothetical analysis worker, define input schema/version, expected output records, completion marker or exit semantics, and whether partial records can ever be used. A diagnostic line must not be confused with a domain result just because it happens to resemble JSON. Reject oversized, malformed, unexpected-version or excess result records before they accumulate unbounded memory.

The following is **pseudocode recipe**, not a working starter process runner. Implement the command allowlist, bounded stream readers, executor/process lifecycle, cancellation, result parser and typed errors; provision the external runtime/dependencies through the consumer's setup owner.

```java
public ComputeOutcome run(ComputeInput input, Cancellation cancellation) {
    var command = commands.fromValidatedInput(input);
    var deadline = clock.instant().plus(policy.maxRuntime());
    var process = processes.start(command);
    try (var capture = output.startBoundedCapture(
            process, policy.outputLimits(), deadline, cancellation)) {
        var exit = processes.awaitUntil(process, deadline, cancellation);
        return protocol.requireCompleteSuccess(exit, capture.awaitUntil(deadline));
    } finally {
        processes.terminateAndReapIfAlive(process, policy.cleanupDeadline());
    }
}
```

The capture helper must actually drain stdout/stderr concurrently while the process executes, within the same overall deadline; its name is not an implementation. Design both I/O and process supervision together, including descendants where the operating system/runtime requires it.

## Keep process authority and database state separate

The executable/module and working directory should be server-owned configuration, not a request-selected shell command or path. Passing arguments as a list avoids shell interpolation, but it does not make every option safe or prevent the invoked program from interpreting a dangerous argument. Validate operation-specific values and keep secrets off exposed command arguments where possible.

Run long computation outside database transactions and resource locks. Retain input/version/digest and operation identity when the result needs reproducibility, then validate the completed output before a short authorized persistence transaction. A process printing a completion word is not permission to write into any workspace named in its payload.

Provisioning Python, native libraries or modules is separate consumer setup work. This article is not authorization to install packages, run an arbitrary worker or change production service isolation. Resource limits, filesystem/network access and execution identity need an operational decision matching the workload.

## Failure and recovery

Timeout, cancellation, nonzero exit, malformed protocol and missing completion should be explicit outcomes. Restore the interrupt flag when translating interruption, stop reading and terminate/reap the owned process under a bounded cleanup policy. Do not leave orphan workers because the caller disconnected.

If partial output is not an accepted domain result, preserve it only as bounded protected diagnostics and fail the operation. If the tool can produce irreversible side effects before failure, model uncertainty and idempotency rather than blindly rerunning it. A pure deterministic compute retry and a remote-uploading script have different recovery contracts.

## Acceptance cases for a consumer

- A caller cannot select arbitrary executable, module, working directory or shell fragment.
- Hung processes and blocked output readers respect one bounded deadline and cancellation path.
- Excess stdout/stderr, huge lines and excessive records do not grow memory indefinitely.
- Nonzero exit, malformed/missing output and partial results cannot masquerade as complete success.
- Every exit path closes streams and terminates/reaps owned processes as required.
- Diagnostic retention excludes secrets and unrestricted payload dumps.
- Persistence accepts only validated results for the retained operation's authorized scope.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/python/PythonService.java` — typed arguments, command list, merged stderr, prefixed JSON parser, unbounded wait/read and catch-and-return limitations.
