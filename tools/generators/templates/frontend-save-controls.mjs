/** Save controls and a feature-owned leave policy built on the installed router and feedback. */
const file = (path, content) => ({ path, content: `${content.trim()}\n` });
const role = (name, suffix) => (name.endsWith(suffix) ? name : `${name}${suffix}`);
export function renderSaveControls(kind, c) {
  if (kind !== "component" || c.variant !== "save-controls") return undefined;
  const n = c.name.pascal,
    component = role(n, "SaveControls"),
    hook = `use${n}LeaveGuard`,
    owner = `frontend/src/features/${c.feature.kebab}`,
    key = `generated.${c.translationId}`;
  const en = {
    title: c.name.title,
    save: "Save changes",
    discard: "Discard changes",
    dirty: "Unsaved changes",
    clean: "All changes saved",
    pending: "Saving changes…",
    failed: "Changes could not be saved. Your draft is retained.",
    discardTitle: "Discard changes?",
    discardMessage: "Your unsaved changes will be lost.",
    keepEditing: "Keep editing",
    field: "Title",
  };
  const hr = {
    title: c.name.title,
    save: "Spremi promjene",
    discard: "Odbaci promjene",
    dirty: "Nespremljene promjene",
    clean: "Sve su promjene spremljene",
    pending: "Spremanje promjena…",
    failed: "Promjene nije moguće spremiti. Nacrt je sačuvan.",
    discardTitle: "Odbaciti promjene?",
    discardMessage: "Nespremljene promjene bit će izgubljene.",
    keepEditing: "Nastavi uređivati",
    field: "Naslov",
  };
  return [
    file(
      `${owner}/components/${component}.tsx`,
      `import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
export type ${component}Props = Readonly<{ dirty: boolean; busy: boolean; failed?: boolean; onSave: () => void; onDiscard: () => void }>;
/** The feature owns validation, duplicate-command prevention and its accepted baseline. */
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation();
  return <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}><Stack spacing={2}>
    {props.failed ? <Alert severity="error">{t("${key}.failed")}</Alert> : null}
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
      <Typography role="status">{t(props.busy ? "${key}.pending" : props.dirty ? "${key}.dirty" : "${key}.clean")}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button type="button" disabled={!props.dirty || props.busy} onClick={props.onDiscard}>{t("${key}.discard")}</Button>
        <Button type="button" variant="contained" disabled={!props.dirty || props.busy} onClick={props.onSave}>{t("${key}.save")}</Button>
      </Stack>
    </Stack>
  </Stack></Paper>;
}`,
    ),
    file(
      `${owner}/hooks/${hook}.ts`,
      `import { useRgoFeedback } from "@rgo-web/frontend";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
export type ${n}LeaveState = Readonly<{ dirty: boolean; busy: boolean }>;
/** Consult canLeave before explicit close/logout. Authentication composition remains caller-owned. */
export function ${hook}(state: ${n}LeaveState) {
  const feedback = useRgoFeedback();
  const { t } = useAppTranslation();
  const current = useRef(state);
  const active = useRef<AbortController | null>(null);
  useLayoutEffect(() => { current.current = state; }, [state]);
  useEffect(() => () => { active.current?.abort(); }, []);
  const canLeave = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    if (signal?.aborted || current.current.busy || active.current) return false;
    if (!current.current.dirty) return true;
    const controller = new AbortController();
    active.current = controller;
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const result = await feedback.confirm({ title: t("${key}.discardTitle"), message: t("${key}.discardMessage"), confirmLabel: t("${key}.discard"), cancelLabel: t("${key}.keepEditing"), destructive: true, signal: controller.signal });
      return result.status === "confirmed" && !controller.signal.aborted && !current.current.busy;
    } catch { return false; }
    finally { signal?.removeEventListener("abort", abort); if (active.current === controller) active.current = null; }
  }, [feedback, t]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (current.current.dirty || current.current.busy) && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const lifetime = new AbortController();
    void canLeave(lifetime.signal).then(allowed => {
      if (lifetime.signal.aborted) return;
      if (allowed && !current.current.busy) blocker.proceed(); else blocker.reset();
    });
    return () => lifetime.abort();
  }, [blocker, canLeave]);
  useBeforeUnload(useCallback((event: BeforeUnloadEvent) => {
    if (current.current.dirty || current.current.busy) { event.preventDefault(); event.returnValue = ""; }
  }, []));
  return { canLeave };
}`,
    ),
    file(
      `${owner}/index.ts`,
      `export { ${component} } from "./components/${component}";
export type { ${component}Props } from "./components/${component}";
export { ${hook} } from "./hooks/${hook}";
export type { ${n}LeaveState } from "./hooks/${hook}";`,
    ),
    file(
      `frontend/src/app/localization/translations/generated/${c.translationId}.en.ts`,
      `export const translations = ${JSON.stringify(en, null, 2)} as const;`,
    ),
    file(
      `frontend/src/app/localization/translations/generated/${c.translationId}.hr.ts`,
      `import type { StringLeaves } from "../../types/TranslationShape";
import type { translations as english } from "./${c.translationId}.en";
export const translations = ${JSON.stringify(hr, null, 2)} as const satisfies StringLeaves<typeof english>;`,
    ),
    file(
      `frontend/src/pages/development-guide/generated/component/${c.feature.kebab}--${c.name.kebab}.example.tsx`,
      `import { Alert, Button, FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component}, ${hook} } from "@/features/${c.feature.kebab}";
export function Component() {
  const { t } = useAppTranslation();
  const { t: guideT } = useDevelopmentGuideTranslation();
  const [baseline, setBaseline] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reject, setReject] = useState(false);
  const [closed, setClosed] = useState(false);
  const pending = useRef(false);
  const completion = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; completion.current?.(); }, []);
  const { canLeave } = ${hook}({ dirty: !closed && draft !== baseline, busy });
  const save = async () => {
    if (pending.current || draft === baseline) return;
    const captured = draft, fail = reject, operation = generation.current;
    pending.current = true; setBusy(true); setFailed(false);
    await new Promise<void>(resolve => { completion.current = resolve; });
    completion.current = null;
    if (generation.current !== operation) return;
    if (fail) setFailed(true); else setBaseline(captured);
    pending.current = false; setBusy(false);
  };
  return <Stack spacing={2}>
    <Alert severity="info">{guideT("generatedExamples.saveControlsHint")}</Alert>
    {closed ? <Alert severity="success" action={<Button onClick={() => setClosed(false)}>{guideT("generatedExamples.reopenEditor")}</Button>}>{guideT("generatedExamples.editorClosed")}</Alert> : <>
      <TextField label={t("${key}.field")} value={draft} onChange={event => setDraft(event.target.value)} disabled={busy} fullWidth />
      <FormControlLabel control={<Switch checked={reject} onChange={event => setReject(event.target.checked)} disabled={busy} />} label={guideT("generatedExamples.failNext")} />
      <${component} dirty={draft !== baseline} busy={busy} failed={failed} onSave={() => void save()} onDiscard={() => { void canLeave().then(allowed => { if (allowed) { setDraft(baseline); setFailed(false); } }); }} />
      {busy ? <Button onClick={() => completion.current?.()}>{guideT("generatedExamples.complete")}</Button> : null}
      <Button onClick={() => { void canLeave().then(allowed => { if (allowed) { setDraft(baseline); setFailed(false); setClosed(true); } }); }}>{guideT("generatedExamples.tryCloseEditor")}</Button>
    </>}
  </Stack>;
}`,
    ),
    file(
      `frontend/tests/features/${c.feature.kebab}/hooks/${hook}.test.tsx`,
      `import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ${hook} } from "@/features/${c.feature.kebab}";
const mocks = vi.hoisted(() => ({ confirm: vi.fn(), shouldBlock: null as null | ((arg: { currentLocation: { pathname: string; search: string }; nextLocation: { pathname: string; search: string } }) => boolean), unload: null as null | ((event: BeforeUnloadEvent) => void), blocker: { state: "unblocked" as string, proceed: vi.fn(), reset: vi.fn() } }));
vi.mock("@rgo-web/frontend", () => ({ useRgoFeedback: () => ({ confirm: mocks.confirm }) }));
vi.mock("react-router", () => ({ useBlocker: (callback: typeof mocks.shouldBlock) => { mocks.shouldBlock = callback; return mocks.blocker; }, useBeforeUnload: (callback: typeof mocks.unload) => { mocks.unload = callback; } }));
const t = (key: string) => key;
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t }) }));
describe("${hook}", () => {
  it("allows clean state, refuses busy state and guards search changes", async () => {
    const { result, rerender } = renderHook(state => ${hook}(state), { initialProps: { dirty: false, busy: false } });
    expect(await result.current.canLeave()).toBe(true);
    rerender({ dirty: false, busy: true });
    expect(await result.current.canLeave()).toBe(false);
    expect(mocks.shouldBlock?.({ currentLocation: { pathname: "/edit", search: "?id=a" }, nextLocation: { pathname: "/edit", search: "?id=b" } })).toBe(true);
    const event = { preventDefault: vi.fn(), returnValue: undefined };
    mocks.unload?.(event as unknown as BeforeUnloadEvent);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
  it("rechecks busy after confirmation and prevents duplicate prompts", async () => {
    let finish!: (value: { status: string }) => void;
    mocks.confirm.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result, rerender } = renderHook(state => ${hook}(state), { initialProps: { dirty: true, busy: false } });
    const first = result.current.canLeave();
    expect(await result.current.canLeave()).toBe(false);
    rerender({ dirty: true, busy: true });
    finish({ status: "confirmed" });
    expect(await first).toBe(false);
  });
  it("keeps canceled drafts and aborts obsolete confirmation", async () => {
    mocks.confirm.mockResolvedValueOnce({ status: "canceled" });
    const { result, unmount } = renderHook(() => ${hook}({ dirty: true, busy: false }));
    expect(await result.current.canLeave()).toBe(false);
    let finish!: (value: { status: string }) => void;
    mocks.confirm.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const pending = result.current.canLeave();
    const signal = mocks.confirm.mock.lastCall?.[0].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    finish({ status: "confirmed" });
    expect(await pending).toBe(false);
  });
  it("resets a blocked busy transition without a confirmation", async () => {
    mocks.blocker.state = "blocked";
    const before = mocks.blocker.reset.mock.calls.length;
    const { unmount } = renderHook(() => ${hook}({ dirty: true, busy: true }));
    await act(async () => {});
    expect(mocks.blocker.reset.mock.calls.length).toBe(before + 1);
    unmount(); mocks.blocker.state = "unblocked";
  });
});`,
    ),
    file(
      `frontend/tests/features/${c.feature.kebab}/components/${component}.test.tsx`,
      `import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ${component} } from "@/features/${c.feature.kebab}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: (key: string) => key.split(".").at(-1) }) }));
describe("${component}", () => {
  it("exposes explicit actions and disables both during a pending save", () => {
    const save = vi.fn(), discard = vi.fn();
    const { rerender } = render(<${component} dirty busy={false} onSave={save} onDiscard={discard} />);
    fireEvent.click(screen.getByRole("button", { name: "save" })); expect(save).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "discard" })); expect(discard).toHaveBeenCalledOnce();
    rerender(<${component} dirty busy failed onSave={save} onDiscard={discard} />);
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "discard" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("failed");
  });
});`,
    ),
  ];
}
