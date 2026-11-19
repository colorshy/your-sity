"use client";
import { useFormStatus } from "react-dom";
export function Submit({
  children,
  disabled = false,
  pendingLabel = "…",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="primary"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
