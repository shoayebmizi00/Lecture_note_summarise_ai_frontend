import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Logo } from "./Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr] dark:bg-[#0b1120]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="animate-slide-up">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">{title}</h1>
            <p className="mt-1.5 text-[13.5px] text-ink-500 dark:text-ink-400">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 text-center text-[13px] text-ink-500 dark:text-ink-400">{footer}</div>
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-400 dark:text-ink-500">
          LectureNote AI · NLP course project · documents stay on your machine
        </p>
      </div>

      <div className="relative hidden overflow-hidden border-l border-ink-100 bg-ink-50/60 lg:block dark:border-white/10 dark:bg-white/[0.02]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(59,107,246,0.16),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-center px-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> The study pipeline
          </span>
          <h2 className="mt-5 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-ink-900 dark:text-white">
            One upload. Five ways to revise.
          </h2>
          <div className="mt-8 space-y-4">
            {[
              ["Extractive summary", "TF-IDF sentence graph ranked with PageRank; every sentence comes from your notes."],
              ["Abstractive summary", "BART summarises overlapping chunks, then a second pass reduces them."],
              ["Keywords & topics", "TF-IDF terms and either real lecture headings or clustered sections."],
              ["Quiz & ROUGE", "Grounded multiple-choice questions and metrics against your own reference."],
            ].map(([title, body], index) => (
              <div key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[12px] font-bold text-brand-700 shadow-sm dark:bg-white/10 dark:text-brand-300">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900 dark:text-white">{title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
