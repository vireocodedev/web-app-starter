import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { styleText } from "node:util";
import { Writable } from "node:stream";
import { finished } from "node:stream/promises";

import { generatorLabel, menuItems, menuPresentation, menuViewport } from "./terminal-menu-view.mjs";

export class MenuCancelledError extends Error {
  constructor() {
    super("Generation cancelled.");
    this.code = "GENERATOR_CANCELLED";
  }
}

const frontendRequire = createRequire(new URL("../../frontend/package.json", import.meta.url));
let toolkit;
async function terminalToolkit() {
  try {
    toolkit ??= Promise.all(
      ["@inquirer/core", "fast-string-width"].map(name => import(pathToFileURL(frontendRequire.resolve(name)).href)),
    );
    const [core, { default: measure }] = await toolkit;
    return { ...core, measure };
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND")
      throw new Error("Run npm ci in frontend/ before using the interactive generator menu.", { cause: error });
    throw error;
  }
}

/** Inquirer owns screen rendering; this owner supplies grouped navigation and responsive content. */
export async function selectGenerator(
  choices,
  {
    input = process.stdin,
    output = process.stderr,
    signals = process,
    color = !("NO_COLOR" in process.env) && process.env.FORCE_COLOR !== "0" && process.env.TERM !== "dumb",
  } = {},
) {
  if (!menuItems(choices, null).length) throw new Error("No generators are available.");
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== "function") {
    throw new Error(
      "Interactive selection requires a terminal on stdin and stderr. Use --list and a complete generator command.",
    );
  }
  const { createPrompt, useState, useEffect, useKeypress, measure } = await terminalToolkit();
  const abort = new AbortController();
  const cancel = () => abort.abort(new MenuCancelledError());
  const failure = error => abort.abort(error);
  const cancelKey = (_, key) => {
    if (key?.ctrl && ["c", "d"].includes(key.name)) cancel();
  };
  const wasRaw = Boolean(input.isRaw);
  const wasFlowing = input.readableFlowing === true;
  // Inquirer ends its stream; keep the caller's terminal open for subsequent questions.
  const screenOutput = new Writable({
    write: (chunk, encoding, done) => {
      output.write(chunk, encoding, done);
    },
  });
  for (const property of ["isTTY", "columns", "rows"])
    Object.defineProperty(screenOutput, property, {
      get: () => output[property],
    });
  const flushed = finished(screenOutput);
  void flushed.catch(failure);
  let activeReadline;
  let promptError;
  const prompt = createPrompt((_, done) => {
    const [state, setState] = useState({
      group: null,
      active: 0,
      groupIndex: 0,
    });
    const [viewport, setViewport] = useState(menuViewport(output));
    const view = menuPresentation(choices, state, viewport, { measure, color });
    useEffect(rl => {
      const resize = () => setViewport(menuViewport(output));
      output.on("resize", resize);
      activeReadline = rl;
      rl.on("error", failure);
      return () => output.off("resize", resize);
    }, []);
    useKeypress((key, rl) => {
      rl.clearLine(0);
      if (key.ctrl && ["c", "d"].includes(key.name)) return cancel();
      if (["escape", "left", "backspace"].includes(key.name)) {
        if (state.group)
          setState({
            group: null,
            active: state.groupIndex,
            groupIndex: state.groupIndex,
          });
        else cancel();
        return;
      }
      if (["return", "enter", "space", "right"].includes(key.name)) {
        const selected = view.items[view.active];
        if (state.group) done(selected.value);
        else
          setState({
            group: selected.value,
            active: 0,
            groupIndex: state.active,
          });
        return;
      }
      let active = view.active;
      if (key.name === "up") active = (active - 1 + view.items.length) % view.items.length;
      else if (key.name === "down") active = (active + 1) % view.items.length;
      else if (key.name === "home") active = 0;
      else if (key.name === "end") active = view.items.length - 1;
      else if (key.name === "pageup") active = Math.max(0, active - view.pageSize);
      else if (key.name === "pagedown") active = Math.min(view.items.length - 1, active + view.pageSize);
      else return;
      setState({ ...state, active });
    });
    return "\x1b[?25l" + view.text;
  });
  input.once("end", cancel);
  input.once("error", failure);
  output.once("error", failure);
  input.prependListener("keypress", cancelKey);
  signals.once("SIGINT", cancel);
  signals.once("SIGTERM", cancel);
  try {
    const selected = await prompt(
      {},
      {
        input,
        output: screenOutput,
        signal: abort.signal,
        clearPromptOnDone: true,
      },
    );
    await flushed;
    const group = selected.target ?? selected.id.split("/")[0];
    const summary = `Generator: ${group[0].toUpperCase() + group.slice(1)} / ${generatorLabel(selected)}`;
    await new Promise((resolve, reject) => {
      output.write(
        (color ? styleText(["green", "bold"], summary, { validateStream: false }) : summary) + "\n",
        error => {
          if (error) reject(error);
          else resolve();
        },
      );
    });
    return selected;
  } catch (error) {
    promptError = abort.signal.aborted
      ? abort.signal.reason
      : ["ExitPromptError", "AbortPromptError", "CancelPromptError"].includes(error.name)
        ? new MenuCancelledError()
        : error;
    throw promptError;
  } finally {
    input.off("end", cancel);
    input.off("error", failure);
    input.off("keypress", cancelKey);
    signals.off("SIGINT", cancel);
    signals.off("SIGTERM", cancel);
    activeReadline?.off("error", failure);
    try {
      if (!screenOutput.writableEnded) screenOutput.end();
      await flushed;
    } catch (error) {
      if (!promptError) throw error;
    } finally {
      output.off("error", failure);
      try {
        input.setRawMode(wasRaw);
      } finally {
        if (wasFlowing) input.resume();
        else input.pause();
      }
    }
  }
}
