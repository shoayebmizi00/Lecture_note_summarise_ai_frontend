import { Link } from "react-router-dom";
import { BookOpenCheck } from "lucide-react";
import { cn } from "./ui";

export function Logo({ compact = false, to = "/" }: { compact?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <BookOpenCheck className="h-[18px] w-[18px]" />
      </span>
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold tracking-tight text-ink-900 dark:text-white">
            LectureNote
          </span>
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            AI
          </span>
        </span>
      )}
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow",
        className,
      )}
    >
      <BookOpenCheck className="h-6 w-6" />
    </span>
  );
}
