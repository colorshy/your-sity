import Link from "next/link";
import type { ReactNode } from "react";
import { demoHref } from "./shared";

export function DemoPostContent({
  id,
  title,
  body,
  heading: Heading = "h2",
  children,
}: {
  id: string;
  title: string;
  body: string;
  heading?: "h2" | "h3";
  children?: ReactNode;
}) {
  return (
    <div className="mvp-post-content">
      <Link href={demoHref("post", id)}>
        <Heading>{title}</Heading>
      </Link>
      <p>{body}</p>
      {children}
    </div>
  );
}
