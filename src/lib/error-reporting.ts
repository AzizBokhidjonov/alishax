// Vendor-neutral client error reporting.
//
// The root error boundary funnels every caught render error through
// `reportError`. By default it only logs to the console; wire `setErrorReporter`
// once at startup to forward errors to whatever backend the project uses.

export type ErrorReportContext = Record<string, unknown>;

export type ErrorReporter = (error: unknown, context: ErrorReportContext) => void;

let reporter: ErrorReporter | undefined;

/** Register the sink that receives boundary-caught errors. Call once at startup. */
export function setErrorReporter(next: ErrorReporter | undefined) {
  reporter = next;
}

// Loaders and server fns commonly throw a raw Response; String(it) is the
// opaque "[object Response]", so pull out the status and URL instead.
export function describeError(error: unknown): string {
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  return error instanceof Error ? error.message : String(error);
}

export function reportError(error: unknown, context: ErrorReportContext = {}) {
  if (typeof window === "undefined") return;

  const payload: ErrorReportContext = {
    source: "react_error_boundary",
    route: window.location.pathname,
    message: describeError(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  };

  // Production React does not rethrow boundary-caught errors to window.onerror,
  // so without this the error never reaches any global handler.
  console.error("[error-boundary]", payload.message, error);

  try {
    reporter?.(error, payload);
  } catch (reporterError) {
    console.error("Error reporter threw", reporterError);
  }
}
