import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Logo } from "../components/Logo";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ink-50 px-6 text-center dark:bg-[#0b1120]">
      <Logo />
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-ink-400 shadow-card dark:bg-[#111a2e]">
        <Compass className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Page not found</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link to="/dashboard" className="btn-primary">
        Back to the dashboard
      </Link>
    </div>
  );
}
