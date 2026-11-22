"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Users,
  Bell,
  Bookmark,
  UserRound,
  Shield,
} from "lucide-react";
const items = [
  { href: "/feed", kk: "Лента", ru: "Лента", Icon: Home },
  { href: "/discover", kk: "Қаланы ашу", ru: "Открыть город", Icon: Compass },
  { href: "/communities", kk: "Қауымдастықтар", ru: "Сообщества", Icon: Users },
  { href: "/notifications", kk: "Хабарламалар", ru: "Уведомления", Icon: Bell },
  { href: "/saved", kk: "Бетбелгілер", ru: "Закладки", Icon: Bookmark },
  { href: "/profile", kk: "Профиль", ru: "Профиль", Icon: UserRound },
];
export function AppNav({
  locale,
  moderator = false,
}: {
  locale: string;
  moderator?: boolean;
}) {
  const path = usePathname();
  const links = moderator
    ? [
        ...items,
        { href: "/moderation", kk: "Модерация", ru: "Модерация", Icon: Shield },
      ]
    : items;
  return (
    <nav
      className="app-nav"
      aria-label={locale === "kk" ? "Негізгі навигация" : "Основная навигация"}
    >
      {links.map(({ href, kk, ru, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={
            path === href || path.startsWith(href + "/") ? "page" : undefined
          }
        >
          <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
          <span>{locale === "kk" ? kk : ru}</span>
        </Link>
      ))}
    </nav>
  );
}
