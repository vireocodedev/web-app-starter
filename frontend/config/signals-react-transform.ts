import babel from "@rolldown/plugin-babel";

/** Keep Signals reactive in React components in every Vite host. */
export function signalsReactTransform() {
  return babel({
    plugins: [["module:@preact/signals-react-transform"]],
  });
}
