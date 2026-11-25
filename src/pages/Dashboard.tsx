import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  Plus,
  Sparkles,
  TrendingUp,
  UploadCloud,
  AlertTriangle,
} from "lucide-react";
import { Badge, Card, EmptyState, LoadingBlock, SectionHeading, Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { apiError, formatDate, formatDuration, methodLabel, truncate } from "../services/api";
import { lectureService, systemService, summaryService } from "../services/rest";
import type { Health, Lecture, Stats, Summary } from "../types";

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [statsData, lectureData, summaryData] = await Promise.all([
          lectureService.stats(),
          lectureService.list({ limit: 6 }),
          summaryService.list({ limit: 5 }),
        ]);
        if (!alive) return;
        setStats(statsData);
        setLectures(lectureData.items);
        setSummaries(summaryData.items);
      } catch (err) {
        if (alive) setError(apiError(err));
      } finally {
        if (alive) setLoading(false);
      }
      try {
        const healthData = await systemService.health();
        if (alive) setHealth(healthData);
      } catch {
        /* health is optional on the dashboard */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock label="Loading your dashboard" />;

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
        <h2 className="mt-3 text-base font-semibold text-ink-900 dark:text-white">Could not load your dashboard</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-500 dark:text-ink-400">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Card>
    );
  }

  const cards = [
    {
      label: "Lectures",
      value: stats?.lecture_count ?? 0,
      hint: "PDFs uploaded",
      icon: BookOpen,
      tone: "text-brand-700 bg-brand-50 dark:bg-brand-500/15 dark:text-brand-300",
    },
    {
      label: "Summaries",
      value: stats?.summary_count ?? 0,
      hint: "TextRank + BART",
      icon: FileText,
      tone: "text-violet-700 bg-violet-50 dark:bg-violet-500/15 dark:text-violet-300",
    },
    {
      label: "Quiz questions",
      value: stats?.quiz_count ?? 0,
      hint: "Grounded in your notes",
      icon: HelpCircle,
      tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Avg. processing",
      value: formatDuration(stats?.avg_processing_time ?? 0),
      hint: "Per summary",
      icon: Clock,
      tone: "text-amber-700 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300",
    },
  ];

  const modelWarning =
    health && !health.models.loaded && !health.models.primary_model_cached && !health.models.fallback_model_cached;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
            Welcome back, {user?.username}
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-500 dark:text-ink-400">
            Upload a lecture, then generate summaries, keywords, topics and a quiz from one workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/upload" className="btn-primary">
            <Plus className="h-4 w-4" /> New lecture
          </Link>
          <Link to="/history" className="btn-secondary">
            <Layers className="h-4 w-4" /> Library
          </Link>
        </div>
      </div>

      {modelWarning && (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
              Abstractive model weights are not cached yet
            </p>
            <p className="mt-0.5 text-[12.5px] text-amber-800/90 dark:text-amber-300/90">
              TextRank works immediately. To use BART, run{" "}
              <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11.5px] dark:bg-black/20">
                python model/download_models.py
              </code>{" "}
              or set ALLOW_MODEL_DOWNLOAD=true in backend/.env.
            </p>
          </div>
          <Link to="/settings" className="btn-secondary btn-sm shrink-0">
            System status
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">{card.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                  {card.value}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-500 dark:text-ink-400">{card.hint}</p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
                <card.icon className="h-[18px] w-[18px]" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-5">
          <SectionHeading
            title="Recent summaries"
            description="Every generation is stored in MongoDB."
            action={
              <Link
                to="/history"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-4">
            {summaries.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="No summaries yet"
                description="Open a lecture and run TextRank or BART to create your first summary."
                action={
                  <Link to="/upload" className="btn-primary btn-sm">
                    <UploadCloud className="h-4 w-4" /> Upload a PDF
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-white/10">
                {summaries.map((summary) => (
                  <li key={summary.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      to={`/summaries/${summary.id}`}
                      className="group flex items-start gap-3 rounded-lg px-1 py-1 transition hover:bg-ink-50/70 dark:hover:bg-white/[0.03]"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300">
                        {summary.method === "abstractive" ? (
                          <Brain className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-ink-800 group-hover:text-brand-700 dark:text-ink-100 dark:group-hover:text-brand-300">
                            {summary.lecture_filename ?? "Lecture summary"}
                          </p>
                          <Badge tone={summary.method === "abstractive" ? "violet" : "brand"}>
                            {summary.method}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-500 dark:text-ink-400">
                          {truncate(summary.summary_text.replace(/\s+/g, " "), 140)}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {formatDate(summary.created_at)} · {summary.summary_length} ·{" "}
                          {formatDuration(summary.processing_time)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeading
              title="Recent lectures"
              description="Open the workspace to analyse a PDF."
              action={
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  Upload <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="mt-4">
              {lectures.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Your library is empty"
                  description="Upload lecture notes as a PDF to get started."
                />
              ) : (
                <ul className="space-y-2">
                  {lectures.map((lecture) => (
                    <li key={lecture.id}>
                      <Link
                        to={`/lectures/${lecture.id}`}
                        className="group flex items-center gap-3 rounded-xl border border-ink-200/70 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-white/10 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-ink-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold text-ink-800 group-hover:text-brand-700 dark:text-ink-100 dark:group-hover:text-brand-300">
                            {lecture.original_filename}
                          </p>
                          <p className="text-[11px] text-ink-400">
                            {lecture.page_count} pages · {lecture.word_count.toLocaleString()} words ·{" "}
                            {lecture.summary_count} summaries
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 bg-ink-50/60 px-5 py-3.5 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-[12px] font-semibold text-ink-800 dark:text-ink-100">NLP engine status</p>
            </div>
            <div className="space-y-3 p-5 text-[12.5px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500 dark:text-ink-400">Database</span>
                <Badge tone={health?.database.connected ? "success" : "danger"}>
                  {health?.database.connected ? "connected" : "offline"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500 dark:text-ink-400">BART model</span>
                <Badge tone={health?.models.loaded ? "success" : health?.models.primary_model_cached ? "brand" : "warning"}>
                  {health?.models.loaded
                    ? "in memory"
                    : health?.models.primary_model_cached
                      ? "cached"
                      : "not cached"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500 dark:text-ink-400">Device</span>
                <span className="font-medium text-ink-700 dark:text-ink-200">{health?.models.device ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500 dark:text-ink-400">OCR</span>
                <Badge tone={health?.ocr.available ? "success" : "neutral"}>
                  {health?.ocr.available ? "available" : "not installed"}
                </Badge>
              </div>
              <Link
                to="/settings"
                className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                <BarChart3 className="h-3.5 w-3.5" /> Open settings & diagnostics
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
