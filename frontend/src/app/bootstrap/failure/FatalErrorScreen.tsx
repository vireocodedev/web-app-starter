import { useEffect, useRef } from "react";

export function FatalErrorScreen() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        margin: "0 auto",
        maxWidth: "48rem",
        padding: "2rem",
      }}
    >
      <h1 ref={headingRef} tabIndex={-1}>
        Something went wrong
      </h1>
      <p>The application could not continue. Reload the page and try again.</p>
      <button onClick={() => window.location.reload()} type="button">
        Reload application
      </button>
    </main>
  );
}
