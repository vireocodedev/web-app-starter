import { spawn } from "node:child_process";

export class ProviderError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Credentials stay in gh's configured authentication, never arguments or logs.
export function githubTransport() {
  return {
    request(method, endpoint, body) {
      return new Promise((resolve, reject) => {
        const args = [
          "api",
          "--hostname",
          "github.com",
          "--method",
          method,
          "-H",
          "Accept: application/vnd.github+json",
          "-H",
          "X-GitHub-Api-Version: 2026-03-10",
          endpoint,
        ];
        if (body !== undefined) args.push("--input", "-");
        const child = spawn("gh", args, {
          stdio: ["pipe", "pipe", "pipe"],
          shell: false,
          env: {
            ...process.env,
            GH_PROMPT_DISABLED: "1",
            GH_NO_UPDATE_NOTIFIER: "1",
          },
        });
        let stdout = "";
        let stderr = "";
        let size = 0;
        let settled = false;
        let killTimer;
        const stop = (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          child.kill("SIGTERM");
          killTimer = setTimeout(() => child.kill("SIGKILL"), 1000);
          killTimer.unref();
          reject(error);
        };
        const timer = setTimeout(
          () =>
            stop(
              new ProviderError(
                "GitHub request timed out; reconcile before retrying.",
              ),
            ),
          30_000,
        );
        child.on("error", () =>
          stop(new ProviderError("Cannot run authenticated gh CLI.")),
        );
        child.stdin.on("error", () => {});
        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk) => {
          size += Buffer.byteLength(chunk, "utf8");
          if (size > 16 * 1024 * 1024)
            stop(
              new ProviderError(
                "GitHub response exceeded the bounded output limit.",
              ),
            );
          else stdout += chunk.toString("utf8");
        });
        child.stderr.on("data", (chunk) => {
          stderr = (stderr + chunk.toString("utf8")).slice(-4096);
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          clearTimeout(killTimer);
          if (settled) return;
          settled = true;
          if (code !== 0) {
            const status =
              Number(stderr.match(/HTTP (\d{3})/)?.[1]) || undefined;
            reject(
              new ProviderError(
                `GitHub request failed${status ? ` (HTTP ${status})` : ""}; inspect authenticated access and reconcile saved intent.`,
                status,
              ),
            );
            return;
          }
          try {
            resolve(stdout.trim() ? JSON.parse(stdout) : null);
          } catch {
            reject(
              new ProviderError(
                "GitHub returned malformed JSON; reconcile saved intent.",
              ),
            );
          }
        });
        child.stdin.end(body === undefined ? undefined : JSON.stringify(body));
      });
    },
  };
}
