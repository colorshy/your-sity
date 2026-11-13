// Deliberately accepts only enumerated metadata, never request objects, bodies or provider errors.
export type OperationEvent =
  "abuse_check" | "auth_attempt" | "backend_readiness";
export function operationLog(
  event: OperationEvent,
  result:
    | "allowed"
    | "limited"
    | "unavailable"
    | "development"
    | "success"
    | "failed",
  kind?: "auth" | "write",
) {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      result,
      ...(kind ? { kind } : {}),
    }),
  );
}
