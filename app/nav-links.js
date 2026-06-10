"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// /pipeline bestaat nog als verborgen presentatiemodus (volledig scherm-spoor),
// maar de cockpit toont de pipeline nu zelf in het middenpaneel.
const LINKS = [
  { href: "/", label: "Aangiftecockpit" },
  { href: "/dashboard", label: "Executive dashboard" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
          {l.label}
        </Link>
      ))}
    </>
  );
}
