"use client";
import { useFormStatus } from "react-dom";
export function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className="primary" disabled={pending} aria-busy={pending}>
      {pending ? "…" : children}
    </button>
  );
}
