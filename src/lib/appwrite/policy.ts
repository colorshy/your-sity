export class AccessError extends Error {
  constructor(message = "Operation not permitted") {
    super(message);
  }
}
export const validId = (v: string) =>
  /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(v);
export function text(v: string, min: number, max: number) {
  const value = v.trim();
  if (value.length < min || value.length > max)
    throw new AccessError("Invalid input");
  return value;
}
export function owner(actor: string, author: string) {
  if (!actor || actor !== author) throw new AccessError();
}
export function publicTable(table: string) {
  return table === "cities" || table === "communities";
}
// Trusted-server writes only. Appwrite row permissions cannot validate ownership fields.
export function safeTablePolicy(
  table: string,
  permissions: string[],
  rowSecurity: boolean,
  enabled: boolean,
) {
  const expected = publicTable(table) ? ['read("any")'] : [];
  return (
    enabled &&
    !rowSecurity &&
    permissions.length === expected.length &&
    permissions.every((p) => expected.includes(p))
  );
}
