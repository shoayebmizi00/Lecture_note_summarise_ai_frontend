import { NavLink, useParams } from "react-router-dom";
import { BarChart3, FileText, HelpCircle, Layers, Sparkles } from "lucide-react";
import { cn } from "./ui";

const ITEMS = [
  { segment: "", label: "Workspace", icon: Sparkles, end: true },
  { segment: "/topics", label: "Topics", icon: Layers, end: false },
  { segment: "/quiz", label: "Quiz", icon: HelpCircle, end: false },
  { segment: "/evaluation", label: "Evaluation", icon: BarChart3, end: false },
];

export function LectureTabs({ className }: { className?: string }) {
  const { lectureId } = useParams<{ lectureId: string }>();
  if (!lectureId) return null;
  return (
    <div
      className={cn(
        "no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-ink-200/80 bg-ink-50/70 p-1 dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.label}
          to={`/lectures/${lectureId}${item.segment}`}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition",
              isActive
                ? "bg-white text-ink-900 shadow-sm dark:bg-white/10 dark:text-white"
                : "text-ink-500 hover:bg-white/60 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-white/5 dark:hover:text-ink-200",
            )
          }
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export function LectureBackLink({ filename }: { filename?: string }) {
  const { lectureId } = useParams<{ lectureId: string }>();
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-400">
      <FileText className="h-3.5 w-3.5" />
      <NavLink to={`/lectures/${lectureId}`} className="truncate font-medium hover:text-brand-700 dark:hover:text-brand-300">
        {filename ?? "Lecture"}
      </NavLink>
    </div>
  );
}
