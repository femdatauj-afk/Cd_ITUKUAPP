"use client";

import Link from "next/link";

export function EntityNavigation({
  basePath,
  active,
  manageHref,
}: {
  basePath: string;
  active: "Overview" | "Posts" | "Members" | "Settings";
  manageHref?: string;
}) {
  const items = [
    { label: "Overview", href: basePath },
    { label: "Posts", href: `${basePath}#posts` },
    { label: "Members", href: `${basePath}#members` },
    { label: "Settings", href: manageHref || `${basePath}#settings` },
  ] as const;

  return (
    <nav aria-label="Entity navigation" style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", alignItems: "center", margin: "0.8rem 0 1rem" }}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={item.label === active ? "button" : "button secondary"}
          aria-current={item.label === active ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
