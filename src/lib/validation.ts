export const uuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
export const validName = (value: string) =>
  value.trim().length >= 2 && value.trim().length <= 80;
export const validEmail = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const safeNext = (value: string | null) =>
  value === "/profile" ? "/profile" : "/feed";
