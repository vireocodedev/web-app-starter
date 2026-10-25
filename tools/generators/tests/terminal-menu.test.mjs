import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import { PassThrough } from "node:stream";
import { setTimeout } from "node:timers/promises";
import { stripVTControlCharacters } from "node:util";
import { test } from "node:test";

import { generators } from "../registry.mjs";
import { menuItems, menuPresentation } from "../terminal-menu-view.mjs";
import { selectGenerator } from "../terminal-menu.mjs";

const frontendRequire = createRequire(new URL("../../../frontend/package.json", import.meta.url));
const { default: measure } = frontendRequire("fast-string-width");
const frontendIndex = (id, variant = "simple") =>
  menuItems(generators, "frontend").findIndex(item => item.value.id === id && item.value.variant === variant);

function terminal({ raw = false, rows = 24, columns = 80, output = new PassThrough() } = {}) {
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = raw;
  input.setRawMode = value => {
    input.isRaw = value;
  };
  output.isTTY = true;
  output.rows = rows;
  output.columns = columns;
  let content = "";
  output.on("data", chunk => {
    content += chunk.toString();
  });
  return {
    input,
    output,
    signals: new EventEmitter(),
    color: true,
    content: () => content,
  };
}

async function waitFor(io, text, offset = 0) {
  const deadline = Date.now() + 2000;
  while (!stripVTControlCharacters(io.content().slice(offset)).includes(text)) {
    if (Date.now() > deadline)
      throw new Error(`Menu did not render ${text}: ${stripVTControlCharacters(io.content())}`);
    await setTimeout(2);
  }
}

async function start(io = terminal()) {
  const selection = selectGenerator(generators, io);
  await waitFor(io, "VIREO");
  return { io, selection };
}

async function press(io, value, nextFrame) {
  const offset = io.content().length;
  io.input.write(value);
  if (nextFrame) await waitFor(io, nextFrame, offset);
}

function assertRestored(io, raw = false) {
  assert.equal(io.input.isRaw, raw);
  assert.equal(io.input.isPaused(), true);
  assert.equal(io.input.listenerCount("keypress"), 0);
  assert.equal(io.output.listenerCount("resize"), 0);
  assert.equal(io.signals.listenerCount("SIGINT"), 0);
  assert.equal(io.signals.listenerCount("SIGTERM"), 0);
  assert.match(io.content(), /\x1b\[\?25h/);
}

test("groups display human-readable generator names in a predictable order", () => {
  assert.deepEqual(
    menuItems(generators, null).map(item => item.label),
    ["Frontend", "Backend"],
  );
  assert.deepEqual(
    menuItems(generators, "frontend").map(item => item.label),
    [
      "Component",
      "Entity picker",
      "Quick-create relationship",
      "Search and filter bar",
      "Dependent form section",
      "Save/discard controls",
      "Related records section",
      "Selection and bulk actions",
      "Form",
      "Multi-section editor",
      "Child-item editor",
      "Shell",
      "Workspace shell",
      "Deep navigation",
      "Table",
      "Page",
      "Dashboard page",
      "Detail page",
      "Reports workspace",
      "Feature",
      "Record workspace",
      "API client",
    ],
  );
  const view = menuPresentation(
    generators,
    { group: null, active: 0 },
    { columns: 80, rows: 24 },
    { measure, color: true },
  );
  assert.match(view.text, /\x1b\[46m/);
  const text = stripVTControlCharacters(view.text);
  assert.match(text, /Frontend/);
  assert.match(text, /22 recipes/);
  assert.match(text, /6 recipes/);
  assert.doesNotMatch(text, /frontend\/component/);
});

test("layout stays inside its width/height budget across small and large terminals", () => {
  for (const columns of [2, 8, 12, 20, 32, 40, 80, 120, 240]) {
    for (const rows of [2, 3, 5, 6, 10, 14, 24, 50]) {
      for (const group of [null, "frontend", "backend"]) {
        const length = menuItems(generators, group).length;
        for (let active = 0; active < length; active++) {
          const view = menuPresentation(generators, { group, active }, { columns, rows }, { measure, color: true });
          assert.ok(view.lines.length <= Math.max(1, rows - 1), `${columns}x${rows} height`);
          assert.ok(
            view.lines.every(line => measure(line) <= Math.max(1, columns - 1)),
            `${columns}x${rows} width`,
          );
          assert.ok(active >= view.start && active < view.start + view.pageSize);
        }
      }
    }
  }
});

test("Unicode descriptions and color-free mode keep the same measured layout", () => {
  const choices = generators.map(item => ({
    ...item,
    purpose: "界面の説明 👩‍💻 e\u0301 ".repeat(40),
  }));
  const view = menuPresentation(
    choices,
    { group: "frontend", active: 0 },
    { columns: 44, rows: 16 },
    { measure, color: false },
  );
  assert.equal(view.text, stripVTControlCharacters(view.text));
  assert.ok(view.lines.every(line => measure(line) <= 43));
  assert.ok(view.lines.length <= 15);
});

test("Enter opens Frontend and arrows plus Enter choose Form", async () => {
  const { io, selection } = await start();
  await press(io, "\r", "Frontend / Select generator");
  await press(io, "\x1b[B".repeat(frontendIndex("frontend/form")) + "\r");
  assert.equal((await selection).id, "frontend/form");
  assert.match(stripVTControlCharacters(io.content()), /Generator: Frontend \/ Form/);
  assertRestored(io);
});

test("arrow wrapping and Space choose the Backend group and DTO", async () => {
  const { io, selection } = await start();
  await press(io, "\x1b[A ", "Backend / Select generator");
  await press(io, " ");
  assert.equal((await selection).id, "backend/dto");
  assertRestored(io);
});

test("Home/End and Page Up/Down navigate a scrollable generator list", async () => {
  const { io, selection } = await start();
  await press(io, "\r", "Frontend / Select generator");
  await press(io, "\x1b[F", "API client");
  await press(io, "\x1b[H\x1b[6~\x1b[5~" + "\x1b[B".repeat(frontendIndex("frontend/form")) + "\r");
  assert.equal((await selection).id, "frontend/form");
  assertRestored(io);
});

test("advanced recipes are selectable with their variant and supported inputs", async () => {
  const { io, selection } = await start();
  await press(io, "\r", "Frontend / Select generator");
  await press(io, "\x1b[B".repeat(frontendIndex("frontend/shell", "workspace")) + "\r");
  const recipe = await selection;
  assert.equal(recipe.id, "frontend/shell");
  assert.equal(recipe.variant, "workspace");
  assert.equal(recipe.acceptsFields, false);
  assertRestored(io);
});

test("Escape returns to groups and Left/Backspace preserve navigation", async () => {
  const { io, selection } = await start();
  await press(io, "\r", "Frontend / Select generator");
  await press(io, "\x1b", "Choose your workspace");
  await press(io, "\x1b[B\r", "Backend / Select generator");
  await press(io, "\x1b[D", "Choose your workspace");
  await press(io, "\r", "Backend / Select generator");
  await press(io, "\x7f", "Choose your workspace");
  await press(io, "\r", "Backend / Select generator");
  await press(io, "\r");
  assert.equal((await selection).id, "backend/dto");
  assertRestored(io);
});

for (const [name, key] of [
  ["Escape", "\x1b"],
  ["Ctrl+C", "\x03"],
  ["Ctrl+D", "\x04"],
]) {
  test(`${name} cancels at groups and restores the terminal`, async () => {
    const { io, selection } = await start();
    await press(io, key);
    await assert.rejects(selection, { code: "GENERATOR_CANCELLED" });
    assertRestored(io);
    assert.doesNotMatch(io.content(), /Generator: /);
  });
}

test("termination, EOF and input failure settle cleanly and preserve prior raw mode", async () => {
  const { io, selection } = await start(terminal({ raw: true }));
  io.signals.emit("SIGTERM");
  await assert.rejects(selection, { code: "GENERATOR_CANCELLED" });
  assertRestored(io, true);
  const disconnected = await start();
  disconnected.io.input.emit("error", new Error("Input disconnected"));
  await assert.rejects(disconnected.selection, /Input disconnected/);
  assertRestored(disconnected.io);
  const eof = await start();
  eof.io.input.end();
  await assert.rejects(eof.selection, { code: "GENERATOR_CANCELLED" });
  assertRestored(eof.io);
});

test("resizing switches layouts while preserving selection and flowing input", async () => {
  const io = terminal();
  io.input.resume();
  const { selection } = await start(io);
  await press(io, "\r", "Frontend / Select generator");
  await press(io, "\x1b[B".repeat(frontendIndex("frontend/form")), "Form");
  const offset = io.content().length;
  io.output.columns = 24;
  io.output.rows = 8;
  io.output.emit("resize");
  await waitFor(io, "VIREO / GENERATORS", offset);
  await press(io, "\r");
  assert.equal((await selection).id, "frontend/form");
  assert.equal(io.input.isPaused(), false);
  assert.equal(io.input.isRaw, false);
  io.input.pause();
});

test("a broken output rejects without leaking errors or leaving input in raw mode", async () => {
  const { io, selection } = await start();
  const rejected = assert.rejects(selection, /Output disconnected/);
  io.output.destroy(new Error("Output disconnected"));
  await rejected;
  assert.equal(io.input.isRaw, false);
  assert.equal(io.input.isPaused(), true);
  assert.equal(io.input.listenerCount("keypress"), 0);
  assert.equal(io.output.listenerCount("error"), 0);
  assert.equal(io.output.listenerCount("resize"), 0);
  assert.equal(io.signals.listenerCount("SIGTERM"), 0);
});

test("a failed selection summary rejects before releasing output error ownership", async () => {
  const output = new PassThrough({
    transform(chunk, encoding, done) {
      if (chunk.toString().includes("Generator:")) done(new Error("Summary disconnected"));
      else done(null, chunk);
    },
  });
  const { io, selection } = await start(terminal({ output }));
  const rejected = assert.rejects(selection, /Summary disconnected/);
  await press(io, "\r", "Frontend / Select generator");
  await press(io, "\r");
  await rejected;
  assertRestored(io);
  assert.equal(output.listenerCount("error"), 0);
});

test("empty catalogs and redirected terminals fail before claiming the terminal", async () => {
  const io = terminal();
  await assert.rejects(selectGenerator([], io), /No generators/);
  io.output.isTTY = false;
  await assert.rejects(selectGenerator(generators, io), /requires a terminal/);
  assert.equal(io.input.isRaw, false);
  assert.equal(io.content(), "");
});
