/** Drop raw SDK response/cause/request details before framework-level error logging. */
export class BackendUnavailableError extends Error {
  readonly code: number | undefined;
  constructor(code?: number) {
    super("Backend operation unavailable");
    this.name = "BackendUnavailableError";
    this.code = code;
  }
}
export async function providerCall<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    const code =
      typeof error === "object" &&
      error &&
      "code" in error &&
      typeof error.code === "number" &&
      Number.isInteger(error.code) &&
      error.code >= 400 &&
      error.code <= 599
        ? error.code
        : undefined;
    throw new BackendUnavailableError(code);
  }
}
