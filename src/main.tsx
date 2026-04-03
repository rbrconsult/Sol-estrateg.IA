import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const RUNTIME_RECOVERY_KEY = "__sol_runtime_recovery__";
const RECOVERY_WINDOW_MS = 20000;
const MAX_RECOVERY_ATTEMPTS = 2;
const RECOVERABLE_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /dynamically imported module/i,
  /Unable to preload CSS/i,
  /NetworkError when attempting to fetch resource/i,
  /Failed to fetch/i,
];

type RecoveryState = {
  attempts: number;
  lastAttemptAt: number;
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

function readRecoveryState(): RecoveryState {
  try {
    const raw = sessionStorage.getItem(RUNTIME_RECOVERY_KEY);
    if (!raw) {
      return { attempts: 0, lastAttemptAt: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<RecoveryState>;
    return {
      attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
      lastAttemptAt: typeof parsed.lastAttemptAt === "number" ? parsed.lastAttemptAt : 0,
    };
  } catch {
    return { attempts: 0, lastAttemptAt: 0 };
  }
}

function writeRecoveryState(state: RecoveryState) {
  sessionStorage.setItem(RUNTIME_RECOVERY_KEY, JSON.stringify(state));
}

function clearRecoveryState() {
  sessionStorage.removeItem(RUNTIME_RECOVERY_KEY);
}

function getErrorMessage(input: unknown): string {
  if (typeof input === "string") return input;
  if (input instanceof Error) return `${input.name}: ${input.message}`;

  if (input && typeof input === "object") {
    const candidate = input as { message?: unknown; reason?: unknown };
    if (typeof candidate.message === "string") return candidate.message;
    if (candidate.reason) return getErrorMessage(candidate.reason);
  }

  return "";
}

function isRecoverableRuntimeError(input: unknown) {
  const message = getErrorMessage(input);
  return RECOVERABLE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function hardReload() {
  const url = new URL(window.location.href);
  url.searchParams.set("_hard_reload", `${Date.now()}`);
  window.location.replace(url.toString());
}

function tryRecoverRuntimeFailure(reason: unknown) {
  if (!isRecoverableRuntimeError(reason)) return false;

  const now = Date.now();
  const previous = readRecoveryState();
  const attempts = now - previous.lastAttemptAt <= RECOVERY_WINDOW_MS ? previous.attempts + 1 : 1;

  writeRecoveryState({ attempts, lastAttemptAt: now });

  if (attempts <= MAX_RECOVERY_ATTEMPTS) {
    hardReload();
    return true;
  }

  return false;
}

function renderFatalRecoveryScreen(message: string) {
  root.render(
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">A interface foi reiniciada com proteção</h1>
          <p className="text-sm text-muted-foreground">
            Detectamos uma falha crítica de carregamento e interrompemos o loop de tela branca.
          </p>
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {message || "Erro crítico durante o carregamento da aplicação."}
          </p>
          <button
            type="button"
            onClick={() => {
              clearRecoveryState();
              hardReload();
            }}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Forçar recarga limpa
          </button>
        </div>
      </div>
    </div>
  );
}

window.addEventListener("error", (event) => {
  tryRecoverRuntimeFailure(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  if (tryRecoverRuntimeFailure(event.reason)) {
    event.preventDefault();
  }
});

try {
  root.render(<App />);
  window.setTimeout(clearRecoveryState, RECOVERY_WINDOW_MS);
} catch (error) {
  if (!tryRecoverRuntimeFailure(error)) {
    renderFatalRecoveryScreen(getErrorMessage(error));
  }
}
