import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Info,
  Loader2,
  Scale,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, LoadingBlock, Progress, SectionHeading, Tabs, Textarea } from "../components/ui";
import { LectureTabs } from "../components/LectureTabs";
import { useToast } from "../context/ToastContext";
import { analysisService } from "../services/analysis";
import { apiError, formatDuration, percent } from "../services/api";
import { lectureService, summaryService } from "../services/rest";
import type { ComparisonResult, Evaluation, LectureDetail, Summary } from "../types";

type Mode = "single" | "compare";

const ROUGE_KEYS = ["rouge1", "rouge2", "rougeL"] as const;
const ROUGE_LABEL: Record<(typeof ROUGE_KEYS)[number], string> = {
  rouge1: "ROUGE-1",
  rouge2: "ROUGE-2",
  rougeL: "ROUGE-L",
};

function MetricCard({ label, metric }: { label: string; metric: { precision: number; recall: number; fmeasure: number } }) {
  return (
    <div className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">{label}</p>
        <p className="text-[14px] font-bold tabular-nums text-ink-900 dark:text-white">{metric.fmeasure.toFixed(4)}</p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10.5px] text-ink-400">
        <span>P {metric.precision.toFixed(3)}</span>
        <span>R {metric.recall.toFixed(3)}</span>
      </div>
      <Progress className="mt-2" value={metric.fmeasure * 100} />
    </div>
  );
}

export function Evaluation() {
  const { lectureId = "" } = useParams<{ lectureId: string }>();
  const { success, error: toastError } = useToast();

  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("single");
  const [selectedId, setSelectedId] = useState("");
  const [reference, setReference] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [detail, list] = await Promise.all([
          lectureService.get(lectureId),
          summaryService.list({ lecture_id: lectureId, limit: 30 }),
        ]);
        if (!alive) return;
        setLecture(detail);
        setSummaries(list.items);
        setSelectedId(list.items[0]?.id ?? "");
        const prior = list.items.find((item) => item.last_evaluation);
        if (prior?.last_evaluation) {
          setResult(prior.last_evaluation);
          setSelectedId(prior.id);
        }
      } catch (err) {
        if (alive) setLoadError(apiError(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lectureId]);

  const wordCount = useMemo(() => reference.trim().split(/\s+/).filter(Boolean).length, [reference]);
  const referenceTooShort = wordCount > 0 && wordCount < 5;
  const selected = summaries.find((item) => item.id === selectedId) ?? null;
  const hasBoth = summaries.some((s) => s.method === "extractive") && summaries.some((s) => s.method === "abstractive");

  const runSingle = async () => {
    if (!selected) return;
    setRunning(true);
    setError(null);
    try {
      const data = await analysisService.evaluate({
        summary_id: selected.id,
        reference_summary: reference.trim(),
        lecture_id: lectureId,
      });
      setResult(data);
      setSummaries((current) =>
        current.map((item) => (item.id === selected.id ? { ...item, last_evaluation: data } : item)),
      );
      success("Evaluation completed and attached to the summary.");
    } catch (err) {
      const message = apiError(err);
      setError(message);
      toastError(message);
    } finally {
      setRunning(false);
    }
  };

  const runCompare = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await analysisService.compareEvaluation({
        lecture_id: lectureId,
        reference_summary: reference.trim(),
      });
      setComparison(data);
      success("Both summaries scored against your reference.");
    } catch (err) {
      const message = apiError(err);
      setError(message);
      toastError(message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading summaries" />;

  if (loadError) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
        <h2 className="mt-3 text-base font-semibold text-ink-900 dark:text-white">Could not load the evaluation page</h2>
        <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">{loadError}</p>
        <Link to="/history" className="btn-primary mt-4">
          Back to library
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          to={`/lectures/${lectureId}`}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
        </Link>
        <h1 className="mt-1.5 text-[22px] font-bold tracking-tight text-ink-900 dark:text-white">
          ROUGE evaluation
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500 dark:text-ink-400">
          {lecture?.original_filename} — paste a human-written reference summary of your own. ROUGE
          measures content overlap; it does not prove factual correctness.
        </p>
      </div>

      <LectureTabs />

      {summaries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BarChart3 className="h-5 w-5" />}
            title="No summaries to evaluate yet"
            description="Generate a TextRank or BART summary first, then come back with a reference summary."
            action={
              <Link to={`/lectures/${lectureId}`} className="btn-primary">
                <BookOpenCheck className="h-4 w-4" /> Open workspace
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
          <Card className="p-5">
            <SectionHeading
              title="Reference & configuration"
              description="Write the reference yourself, in 5+ words. Do not copy the generated summary."
            />

            <Tabs<Mode>
              className="mt-3"
              value={mode}
              onChange={(next) => {
                setMode(next);
                setError(null);
              }}
              items={[
                { id: "single", label: "One summary", icon: <Scale className="h-3.5 w-3.5" /> },
                { id: "compare", label: "Compare both", icon: <BarChart3 className="h-3.5 w-3.5" /> },
              ]}
            />

            {mode === "single" && (
              <div className="mt-4">
                <label htmlFor="summary-select" className="label">
                  Summary to evaluate
                </label>
                <select
                  id="summary-select"
                  className="input"
                  value={selectedId}
                  onChange={(event) => {
                    setSelectedId(event.target.value);
                    const next = summaries.find((item) => item.id === event.target.value);
                    setResult(next?.last_evaluation ?? null);
                    setError(null);
                  }}
                >
                  {summaries.map((summary) => (
                    <option key={summary.id} value={summary.id}>
                      {summary.method === "abstractive" ? "BART" : "TextRank"} · {summary.summary_length} ·{" "}
                      {summary.summary_word_count ?? "?"} words
                    </option>
                  ))}
                </select>
                {selected && (
                  <p className="mt-2 line-clamp-3 rounded-lg bg-ink-50/70 px-3 py-2 text-[12px] leading-relaxed text-ink-500 dark:bg-white/[0.03] dark:text-ink-400">
                    {selected.summary_text}
                  </p>
                )}
              </div>
            )}

            {mode === "compare" && (
              <div className="mt-4 rounded-xl border border-ink-200/70 bg-ink-50/60 p-3.5 text-[12px] leading-relaxed text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-400">
                {hasBoth ? (
                  <>The latest TextRank and BART summaries for this lecture will both be scored against the same reference.</>
                ) : (
                  <>
                    You need both a TextRank and a BART summary for this lecture.{" "}
                    <Link to={`/lectures/${lectureId}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                      Generate the missing method
                    </Link>
                    .
                  </>
                )}
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="reference" className="label">
                Reference summary
              </label>
              <Textarea
                id="reference"
                rows={7}
                placeholder="Write 5–8 sentences in your own words that capture the key points of this lecture…"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="min-h-[160px]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
                <span className={referenceTooShort ? "font-medium text-amber-600 dark:text-amber-400" : "text-ink-400"}>
                  {wordCount} words {referenceTooShort ? "· minimum is 5" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReference("");
                    setResult(null);
                    setComparison(null);
                  }}
                  className="font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <Button
              className="mt-4 w-full"
              onClick={() => (mode === "single" ? void runSingle() : void runCompare())}
              loading={running}
              disabled={wordCount < 5 || (mode === "compare" && !hasBoth)}
              icon={<Sparkles className="h-4 w-4" />}
            >
              {running ? "Scoring…" : mode === "single" ? "Evaluate summary" : "Compare both summaries"}
            </Button>

            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-400">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              A fair reference should mention the lecture's main ideas, not just the title. Copying the
              generated summary would inflate the score.
            </p>
          </Card>

          <div className="space-y-5">
            {running && (
              <Card className="flex items-center gap-3 p-4 text-[13px] text-ink-600 dark:text-ink-300">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> Computing ROUGE-1, ROUGE-2 and ROUGE-L…
              </Card>
            )}

            {mode === "single" && result && !running && (
              <>
                <Card className="p-5">
                  <SectionHeading
                    title="ROUGE scores"
                    description={`Computed in ${formatDuration(result.processing_time)}.`}
                    action={<Badge tone="brand">{result.method === "abstractive" ? "BART" : result.method === "extractive" ? "TextRank" : "summary"}</Badge>}
                  />
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                    {ROUGE_KEYS.map((key) => (
                      <MetricCard key={key} label={ROUGE_LABEL[key]} metric={result[key]} />
                    ))}
                  </div>
                  {result.notes.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[11.5px] text-ink-400">
                      {result.notes.map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-5">
                  <SectionHeading title="Summary statistics" />
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {[
                      ["Summary words", result.stats.summary_words.toLocaleString()],
                      ["Source words", result.stats.source_words?.toLocaleString() ?? "—"],
                      ["Reference words", result.stats.reference_words?.toLocaleString() ?? "—"],
                      ["Compression", result.stats.compression_ratio != null ? percent(result.stats.compression_ratio) : "—"],
                      ["Summary sentences", String(result.stats.summary_sentences)],
                      [
                        "Reading time saved",
                        result.stats.reading_time_saved_minutes != null
                          ? `${result.stats.reading_time_saved_minutes} min`
                          : "—",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-ink-200/70 px-3 py-2.5 dark:border-white/10">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-ink-800 dark:text-ink-100">{value}</p>
                      </div>
                    ))}
                  </div>
                  {result.summary_preview && (
                    <p className="mt-3 rounded-lg bg-ink-50/70 px-3 py-2 text-[11.5px] leading-relaxed text-ink-500 dark:bg-white/[0.03] dark:text-ink-400">
                      Evaluated summary: “{result.summary_preview}…”
                    </p>
                  )}
                </Card>
              </>
            )}

            {mode === "compare" && comparison && !running && (
              <>
                <Card className="p-5">
                  <SectionHeading
                    title="Method comparison"
                    description="Same lecture, same reference, both summaries."
                    action={
                      comparison.best_by_rougeL ? (
                        <Badge tone="success">
                          <Trophy className="h-3 w-3" /> best: {comparison.best_by_rougeL}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">tie</Badge>
                      )
                    }
                  />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {comparison.results.map((entry) => (
                      <div
                        key={entry.summary_id}
                        className={`rounded-xl border p-4 ${
                          comparison.best_by_rougeL === entry.method
                            ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                            : "border-ink-200/70 dark:border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink-900 dark:text-white">
                            {entry.method === "abstractive" ? "BART (abstractive)" : "TextRank (extractive)"}
                          </p>
                          {comparison.best_by_rougeL === entry.method && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          {formatDuration(entry.processing_time)} · {entry.stats.summary_words} words ·{" "}
                          {entry.stats.compression_ratio != null ? percent(entry.stats.compression_ratio) : "—"} compression
                        </p>
                        <div className="mt-3 space-y-2">
                          {ROUGE_KEYS.map((key) => (
                            <div key={key}>
                              <div className="flex justify-between text-[11px]">
                                <span className="font-medium text-ink-600 dark:text-ink-300">{ROUGE_LABEL[key]}</span>
                                <span className="tabular-nums text-ink-500 dark:text-ink-400">
                                  {entry[key].fmeasure.toFixed(4)}
                                </span>
                              </div>
                              <Progress className="mt-1" value={entry[key].fmeasure * 100} />
                            </div>
                          ))}
                        </div>
                        <Link
                          to={`/summaries/${entry.summary_id}`}
                          className="mt-3 inline-flex text-[11.5px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                        >
                          Open summary
                        </Link>
                      </div>
                    ))}
                  </div>
                  {comparison.notes.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[11.5px] text-ink-400">
                      {comparison.notes.map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}

            {!running && !result && !comparison && (
              <Card className="p-5">
                <SectionHeading title="How to read ROUGE" description="Use it as one signal, not a verdict." />
                <div className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-ink-500 dark:text-ink-400">
                  <p>
                    <span className="font-semibold text-ink-700 dark:text-ink-200">ROUGE-1</span> counts
                    shared unigrams, <span className="font-semibold text-ink-700 dark:text-ink-200">ROUGE-2</span>{" "}
                    shared bigrams, and{" "}
                    <span className="font-semibold text-ink-700 dark:text-ink-200">ROUGE-L</span> the longest
                    common subsequence. Higher F-measures mean more overlap with your reference.
                  </p>
                  <p>
                    Extractive summaries often score higher because they reuse source wording. BART may
                    paraphrase and score lower while still reading better. Always skim the summary for
                    hallucinations.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Evaluation;
