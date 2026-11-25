import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../components/ui";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "New lecture", icon: Plus },
  { to: "/history", label: "Library", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
];

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your lecture notes and summaries" },
  "/upload": { title: "Upload lecture", subtitle: "Add a PDF and extract its text" },
  "/history": { title: "Library", subtitle: "Every lecture and summary you have generated" },
  "/settings": { title: "Settings", subtitle: "Preferences, system health and account" },
};

function pageMeta(pathname: string) {
  if (pathname.startsWith("/lectures/")) {
    return { title: "Summarisation workspace", subtitle: "Analyse, summarise and study this lecture" };
  }
  if (pathname.startsWith("/summaries/")) {
    return { title: "Summary results", subtitle: "Generated summary, keywords and downloads" };
  }
  return TITLES[pathname] ?? { title: "LectureNote AI", subtitle: "" };
}

function initials(name?: string) {
  if (!name) return "U";
  return name
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = pageMeta(location.pathname);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo to="/dashboard" />
        <button
          type="button"
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden dark:hover:bg-white/10"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn("sidebar-link", isActive && "sidebar-link-active")
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
            {item.to === "/upload" && (
              <span className="ml-auto rounded-md bg-brand-600/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                PDF
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-ink-200/70 bg-ink-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">NLP engine</p>
        <p className="mt-1 text-[12px] leading-snug text-ink-600 dark:text-ink-300">
          TextRank + BART · TF-IDF keywords · ROUGE evaluation
        </p>
        <Link
          to="/settings"
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          System status <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="border-t border-ink-200/70 p-3 dark:border-white/10">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
            {initials(user?.username)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-800 dark:text-ink-100">
              {user?.username}
            </p>
            <p className="truncate text-[11px] text-ink-500 dark:text-ink-400">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-[#0b1120]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-ink-200/70 bg-white lg:block dark:border-white/10 dark:bg-[#0d1526]">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-up border-r border-ink-200 bg-white shadow-pop dark:border-white/10 dark:bg-[#0d1526]">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1120]/85">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden dark:hover:bg-white/10"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold text-ink-900 dark:text-white">
                {meta.title}
              </h1>
              {meta.subtitle && (
                <p className="hidden truncate text-[12px] text-ink-500 sm:block dark:text-ink-400">
                  {meta.subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/10"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-ink-100 dark:hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                  {initials(user?.username)}
                </span>
                <ChevronRight className={cn("h-4 w-4 text-ink-400 transition", menuOpen && "rotate-90")} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-56 animate-fade-in overflow-hidden rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop dark:border-white/10 dark:bg-[#111a2e]"
                >
                  <div className="px-2.5 py-2">
                    <p className="truncate text-[13px] font-semibold text-ink-800 dark:text-ink-100">
                      {user?.username}
                    </p>
                    <p className="truncate text-[11px] text-ink-500 dark:text-ink-400">{user?.email}</p>
                  </div>
                  <div className="my-1 h-px bg-ink-100 dark:bg-white/10" />
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-white/5"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
