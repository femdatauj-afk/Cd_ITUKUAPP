"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import logoImage from "../../ITUKUAPP LOGO.png";
import { clearSession, fetchNotifications, fetchWalletBalance, getSession } from "../lib/api";
import { ItukuCoinIcon } from "./ituku-coin";

type NavItem = {
  href: string;
  label: string;
  icon: "home" | "friends" | "videos" | "birthday" | "events" | "marketplace" | "pages" | "groups" | "settings" | "user" | "plus" | "logout" | "switch" | "invite" | "dashboard" | "coin";
};

const navigation: NavItem[] = [
  { href: "/feed", label: "Dashboard", icon: "dashboard" },
  { href: "/friends", label: "Friends", icon: "friends" },
  { href: "/profile", label: "Profile", icon: "user" },
  { href: "/chat", label: "Inbox", icon: "videos" },
  { href: "/marketplace", label: "Marketplace", icon: "marketplace" },
  { href: "/groups", label: "Groups", icon: "groups" },
  { href: "/pages", label: "Pages", icon: "pages" },
  { href: "/communities/community-dashboard", label: "Community Hub", icon: "events" },
  { href: "/communities", label: "Communities", icon: "events" },
  { href: "/wallet", label: "Wallet", icon: "coin" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const headerQuickLinks: { href: string; label: string; icon: NavItem["icon"] }[] = [
  { href: "/feed", label: "Home", icon: "home" },
  { href: "/friends", label: "Friends", icon: "friends" },
  { href: "/chat", label: "Inbox", icon: "videos" },
  { href: "/notifications", label: "Notifications", icon: "invite" },
  { href: "/wallet", label: "Wallet", icon: "coin" },
];

const mobileDock: { href: string; label: string; icon: NavItem["icon"] }[] = [
  { href: "/feed", label: "Home", icon: "home" },
  { href: "/profile", label: "Profile", icon: "user" },
  { href: "/chat", label: "Inbox", icon: "videos" },
  { href: "/marketplace", label: "Shop", icon: "marketplace" },
  { href: "/groups", label: "Menu", icon: "groups" },
];

function AppIcon({ type }: { type: NavItem["icon"] }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
        </svg>
      );
    case "friends":
      return (
        <svg {...common}>
          <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
          <circle cx="10" cy="7" r="3" />
          <path d="M20 19v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 4.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    case "videos":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="12" height="12" rx="2" />
          <path d="m15 10 6-4v12l-6-4" />
        </svg>
      );
    case "birthday":
      return (
        <svg {...common}>
          <path d="M8 21V9.5A2.5 2.5 0 0 1 10.5 7H13.5A2.5 2.5 0 0 1 16 9.5V21" />
          <path d="M12 7V3" />
          <path d="M9 3h6" />
          <path d="M6 13h12" />
        </svg>
      );
    case "events":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "marketplace":
      return (
        <svg {...common}>
          <path d="M4 8h16l-1.2 10.2A2 2 0 0 1 16.8 20H7.2a2 2 0 0 1-2-1.8L4 8Z" />
          <path d="M9 8V6a3 3 0 1 1 6 0v2" />
        </svg>
      );
    case "coin":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M14.5 9.5c-.6-.7-1.4-1-2.5-1-1.4 0-2.4.7-2.4 1.8 0 2.8 5.1 1.1 5.1 3.8 0 1.2-1.1 2-2.7 2-1.1 0-2.1-.4-2.8-1.2" />
          <path d="M12 6.5v11" />
        </svg>
      );
    case "pages":
      return (
        <svg {...common}>
          <path d="M5 19V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "groups":
      return (
        <svg {...common}>
          <path d="M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M3 19a5 5 0 0 1 10 0" />
          <path d="M11 19a5 5 0 0 1 10 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.76 18.5a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.8 14.6a1.65 1.65 0 0 0-1.51-1H2.2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.8 8.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.4 3.8a1.65 1.65 0 0 0 1-1.51V2.2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.24 3.5a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.2 8.4a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case "switch":
      return (
        <svg {...common}>
          <path d="M8 7h10l-3-3" />
          <path d="M16 17H6l3 3" />
          <path d="M8 7v10" />
          <path d="M16 17V7" />
        </svg>
      );
    case "invite":
      return (
        <svg {...common}>
          <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
          <circle cx="9.5" cy="7" r="3" />
          <path d="M20 8v6M17 11h6" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="4" rx="1" />
          <rect x="14" y="11" width="7" height="10" rx="1" />
          <rect x="3" y="12" width="7" height="9" rx="1" />
        </svg>
      );
    default:
      return null;
  }
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("Ituku member");
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session?.user) {
      setDisplayName(session.user.fullName || session.user.username || "Ituku member");
      const balance = Number(session.user.walletBalance);
      if (Number.isFinite(balance)) setWalletBalance(balance);
    }
    if (session?.token) {
      fetchNotifications()
        .then((response) => setUnreadCount(response.data.filter((notification) => !notification.read).length))
        .catch(() => setUnreadCount(0));
      fetchWalletBalance()
        .then(({ balance }) => setWalletBalance(balance))
        .catch(() => undefined);
    }
  }, []);

  function logOut() {
    clearSession();
    router.push("/auth/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <Link href="/" className="brand">
            <Image src={logoImage} alt="ItukuApp logo" width={34} height={34} className="brand-logo" />
            <span>
              Ituku<span>App</span>
            </span>
          </Link>

          <Link href="/friends" className="header-search" aria-label="Search people and communities">
            <span aria-hidden="true">⌕</span>
            <span>Search</span>
          </Link>
        </div>

        <nav className="topnav" aria-label="Quick navigation">
          {headerQuickLinks.map((item) => (
            <Link key={item.href + item.label} href={item.href}>
              <AppIcon type={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="topbar-actions">
          <Link href="/feed" className="icon-pill" aria-label="Open feed" title="Open feed">
            <AppIcon type="dashboard" />
          </Link>
          <Link href="/notifications" className="icon-pill notification-button" aria-label="Open notifications" title="Notifications">
            <AppIcon type="invite" />
            {unreadCount > 0 ? <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
          </Link>
          <Link href="/wallet" className="wallet-chip" aria-label="Open wallet"><ItukuCoinIcon size="xs" /> {walletBalance === null ? "Wallet" : walletBalance.toLocaleString()}</Link>
          <Link href="/profile" className="account-chip" title="Open profile">
            <AppIcon type="user" />
            <span>{displayName}</span>
          </Link>
          <button type="button" className="icon-pill" aria-label="Log out" title="Log out" onClick={logOut}>
            <AppIcon type="logout" />
          </button>
        </div>
      </header>

      <div className="app-shell-layout">
        <aside className="side-nav" aria-label="Main navigation">
          <div className="side-nav-header">
            <span>Menu</span>
          </div>
          <div className="side-nav-group">
            {navigation.map((item) => (
              <Link key={item.href + item.label} href={item.href} className="side-nav-item">
                <span className="menu-icon"><AppIcon type={item.icon} /></span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </aside>

        <main className="shell-main">
          <section className="page-intro">
            <div>
              <p className="eyebrow">ITUKU COMMUNITY PLATFORM</p>
              <h1>{title}</h1>
              {subtitle ? <p className="intro">{subtitle}</p> : null}
            </div>
          </section>

          {children}
        </main>
      </div>

      <nav className="mobile-dock" aria-label="Mobile navigation">
        {mobileDock.map((item) => (
          <Link key={item.href + item.label} href={item.href}>
            <AppIcon type={item.icon} />
            <small>{item.label}</small>
          </Link>
        ))}
      </nav>

      <footer className="app-footer">
        <div className="app-footer-brand">
          <strong>Ituku<span>App</span></strong>
        </div>
        <div className="app-footer-links">
          <Link href="/about">About</Link>
          <Link href="/communities">Communities</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/notifications">Help & updates</Link>
        </div>
        <small>One Community. Nine Villages. One Voice.</small>
      </footer>
    </div>
  );
}
