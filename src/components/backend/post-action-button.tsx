"use client";
import { useFormStatus } from "react-dom";
export function PostActionButton({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      aria-busy={pending}
      disabled={pending}
    >
      {children}
    </button>
  );
}
