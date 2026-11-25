import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Gauge,
  Hash,
  HelpCircle,
  Layers,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
  StopCircle,
  Wand2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  Progress,
  SectionHeading,
} from "../components/ui";
import { LectureTabs } from "../components/LectureTabs";
import { useToast } from "../context/ToastContext";
import { useJob } from "../hooks/useJob";
import { analysisService } from "../services/analysis";
import { apiError, downloadFromApi, formatBytes, formatDate, formatDuration, methodLabel } from "../services/api";
import { lectureService, summaryService } from "../services/rest";
import type { AnalysisResult, LectureDetail, Summary, SummaryLength, SummaryMethod } from "../types";

const METHODS: { id: SummaryMethod; title: string; body: string; icon: typeof Brain }[] = [
  {
    id: "extractive",
    title: "TextRank",
    body: "Selects real sentences via a TF-IDF cosine graph. Fast and always faithful to the source.",
    icon: ScrollText,
  },
  {
    id: "abstractive",
    title: "BART",
    body: "Rewrites the content with facebook/bart-large-cnn. Fluent, but needs review for accuracy.",
    icon: Brain,
  },
];

const LENGTHS: { id: SummaryLength; label: string; hint: string }[] = [
  { id: "short", label: "Short", hint: "≈10% of the text" },
  { id: "medium", label: "Medium", hint: "≈20% of the text" },
  { id: "long", label: "Long", hint: "≈30% of the text" },
];

function stageLabel(stage: string): string {
  switch (stage) {
    case "queued":
      return "Queued";
    case "preprocessing":
      return "Preprocessing text";
    case "extractive":
      return "Ranking sentences with TextRank";
    case "loading_model":
      return "Loading the BART model";
    case "summarizing":
      return "Summarising chunks with BART";
    case "reducing":
      return "Reducing chunk summaries";
    case "keywords":
      return "Extracting keywords";
    case "finalizing":
      return "Preparing results";
    default:
      return stage.replace(/_/g, " ");
  }
}

export function Workspace() {
  const { lectureId = "" } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { job, running, error: jobError, track, cancel } = useJob();

  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [method, setMethod] = useState<SummaryMethod>("extractive");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showFullText, setShowFullText] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [detail, list] = await Promise.all([
        lectureService.get(lectureId),
        summaryService.list({ lecture_id: lectureId, limit: 20 }),
      ]);
      setLecture(detail);
      setSummaries(list.items);
    } catch (err) {
      setLoadError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  useEffect(() => {
    if (job?.status === "succeeded" && job.result) {
      setResult(job.result);
      success("Summary generated and saved to your library.");
      void summaryService.list({ lecture_id: lectureId, limit: 20 }).then((list) => setSummaries(list.items));
    }
  }, [job?.status, job?.result, lectureId, success]);

  useEffect(() => {
    if (jobError) toastError(jobError);
  }, [jobError, toastError]);

  const latest = useMemo(() => {
    if (result?.summaries?.length) return result.summaries;
    return summaries.slice(0, 2);
  }, [result, summaries]);

  const onSummarize = async () => {
    setResult(null);
    await track(() =>
      analysisService.summarize({ lecture_id: lectureId, method, length, save: true }),
    );
  };

  const onCompare = async () => {
    setResult(null);
    await track(() => analysisService.compare({ lecture_id: lectureId, length }));
  };

  if (loading) return <LoadingBlock label="Opening the lecture" />;

  if (loadError || !lecture) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
        <h2 className="mt-3 text-base font-semibold text-ink-900 dark:text-white">
          This lecture could not be opened
        </h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-500 dark:text-ink-400">
          {loadError ?? "The lecture does not exist or belongs to another account."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => void load()} variant="secondary" icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
          <Link to="/history" className="btn-primary">
            Back to library
          </Link>
        </div>
      </Card>
    );
  }

  const keywordItems = result?.keywords ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[22px] font-bold tracking-tight text-ink-900 dark:text-white">
              {lecture.original_filename}
            </h1>
            <Badge tone="success">ready</Badge>
          </div>
          <p className="mt-1 text-[12.5px] text-ink-500 dark:text-ink-400">
            {lecture.page_count} pages · {lecture.word_count.toLocaleString()} words ·{" "}
            {lecture.sentence_count.toLocaleString()} sentences · {formatBytes(lecture.file_size)} · uploaded{" "}
            {formatDate(lecture.upload_date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/lectures/${lectureId}/topics`} className="btn-secondary btn-sm">
            <Layers className="h-3.5 w-3.5" /> Topics
          </Link>
          <Link to={`/lectures/${lectureId}/quiz`} className="btn-secondary btn-sm">
            <HelpCircle className="h-3.5 w-3.5" /> Quiz
          </Link>
          <Link to={`/lectures/${lectureId}/evaluation`} className="btn-secondary btn-sm">
            <BarChart3 className="h-3.5 w-3.5" /> Evaluate
          </Link>
        </div>
      </div>

      <LectureTabs />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <SectionHeading
            title="Generate a summary"
            description="Choose an algorithm and a target length, then run it as a background job."
          />

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {METHODS.map((option) => {
              const active = method === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMethod(option.id)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-brand-300 bg-brand-50/70 ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-brand-500/10"
                      : "border-ink-200 bg-white hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-900 dark:text-white">
                      <option.icon className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                      {option.title}
                    </span>
                    {active && <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {option.body}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <p className="label">Summary length</p>
            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setLength(option.id)}
                  className={`rounded-xl border px-3 py-2 text-center transition ${
                    length === option.id
                      ? "border-brand-300 bg-brand-50/70 dark:border-brand-500/40 dark:bg-brand-500/10"
                      : "border-ink-200 bg-white hover:bg-ink-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/5"
                  }`}
                >
                  <span className="block text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">
                    {option.label}
                  </span>
                  <span className="block text-[11px] text-ink-400">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={onSummarize} loading={running} icon={<Wand2 className="h-4 w-4" />}>
              {running ? "Running…" : `Summarise with ${method === "extractive" ? "TextRank" : "BART"}`}
            </Button>
            <Button
              variant="secondary"
              onClick={onCompare}
              disabled={running}
              icon={<Gauge className="h-4 w-4" />}
            >
              Compare both
            </Button>
            {running && (
              <Button variant="ghost" onClick={cancel} icon={<StopCircle className="h-4 w-4" />}>
                Stop waiting
              </Button>
            )}
          </div>
          <p className="mt-2 text-[11.5px] text-ink-400">
            Closing the page does not cancel the backend job; results are saved when it finishes.
          </p>

          {running && job && (
            <div className="mt-4 rounded-xl border border-brand-200/70 bg-brand-50/50 p-4 dark:border-brand-500/25 dark:bg-brand-500/10">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-brand-900 dark:text-brand-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {stageLabel(job.stage)}
                </span>
                <span className="text-[11.5px] tabular-nums text-brand-700 dark:text-brand-300">
                  {job.progress}%
                </span>
              </div>
              <Progress className="mt-2" value={job.progress} />
              <p className="mt-1.5 text-[11.5px] text-brand-800/80 dark:text-brand-300/80">
                {job.message || "This can take several minutes on a CPU when BART is used."}
              </p>
            </div>
          )}

          {jobError && !running && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {jobError}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHeading title="Document profile" description="Produced during extraction and preprocessing." />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[12.5px]">
              {[
                ["Words", lecture.word_count.toLocaleString()],
                ["Sentences", lecture.sentence_count.toLocaleString()],
                ["Characters", lecture.char_count.toLocaleString()],
                ["Pages", String(lecture.page_count)],
                ["Headings found", String(lecture.headings.length)],
                ["OCR pages", String(lecture.pages.filter((page) => page.used_ocr).length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-ink-200/70 px-3 py-2 dark:border-white/10">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-ink-800 dark:text-ink-100">{value}</dd>
                </div>
              ))}
            </dl>
            {result?.document && (
              <p className="mt-3 text-[11.5px] text-ink-400">
                Preprocessing removed {result.document.duplicates_removed} duplicates and{" "}
                {result.document.noise_removed} noise items in{" "}
                {formatDuration(result.document.preprocessing_time)}.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeading
              title="Detected headings"
              description="Font-size cues used by the topic builder."
              action={<Badge tone="brand">{lecture.headings.length}</Badge>}
            />
            <div className="mt-3 space-y-1.5">
              {lecture.headings.length === 0 ? (
                <p className="text-[12.5px] text-ink-500 dark:text-ink-400">
                  No headings detected. Topics will fall back to TF-IDF clustering.
                </p>
              ) : (
                lecture.headings.slice(0, 8).map((heading, index) => (
                  <div
                    key={`${heading.text}-${index}`}
                    className="flex items-start gap-2 rounded-lg bg-ink-50/70 px-2.5 py-1.5 text-[12px] dark:bg-white/[0.03]"
                  >
                    <Hash className="mt-0.5 h-3 w-3 shrink-0 text-ink-400" />
                    <span className="min-w-0 flex-1 truncate text-ink-700 dark:text-ink-200">{heading.text}</span>
                    <span className="shrink-0 text-[10.5px] text-ink-400">p.{heading.page}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {latest.length > 0 && (
        <Card className="p-5">
          <SectionHeading
            title="Latest summaries"
            description="Generated from this lecture. Open a result for the full view and downloads."
            action={
              <Badge tone="brand">{summaries.length} saved</Badge>
            }
          />
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {latest.map((summary) => (
              <div
                key={summary.id}
                className="flex flex-col rounded-xl border border-ink-200/80 p-4 dark:border-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {summary.method === "abstractive" ? (
                        <Brain className="h-3.5 w-3.5" />
                      ) : (
                        <ScrollText className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">
                        {methodLabel(summary.method)}
                      </p>
                      <p className="text-[10.5px] text-ink-400">
                        {summary.summary_length} · {formatDuration(summary.processing_time)} ·{" "}
                        {formatDate(summary.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge tone={summary.method === "abstractive" ? "violet" : "brand"}>
                    {summary.method}
                  </Badge>
                </div>
                <p className="mt-2.5 line-clamp-4 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-600 dark:text-ink-300">
                  {summary.summary_text}
                </p>
                {summary.compression_ratio != null && (
                  <p className="mt-2 text-[11px] text-ink-400">
                    Compression {Math.round(summary.compression_ratio * 100)}% ·{" "}
                    {summary.summary_word_count ?? "—"} words
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link
                    to={`/summaries/${summary.id}`}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  >
                    Open result <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => downloadFromApi(`/summary/${summary.id}/download/txt`)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
                  >
                    <Download className="h-3 w-3" /> TXT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {keywordItems.length > 0 && (
        <Card className="p-5">
          <SectionHeading
            title="Keywords from the last run"
            description={`${keywordItems.length} terms ranked by TF-IDF.`}
            action={
              <Link
                to={`/lectures/${lectureId}/topics`}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                Explore topics <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {keywordItems.map((keyword) => (
              <span
                key={keyword.keyword}
                className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50/70 px-2 py-1 text-[12px] text-ink-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-200"
              >
                {keyword.keyword}
                <span className="text-[10px] tabular-nums text-ink-400">{keyword.score.toFixed(2)}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <SectionHeading
          title="Extracted text"
          description="Exactly what the NLP pipeline sees. Repeated headers and page numbers are removed."
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullText((value) => !value)}
              icon={<ChevronDown className={`h-4 w-4 transition ${showFullText ? "rotate-180" : ""}`} />}
            >
              {showFullText ? "Collapse" : "Show full text"}
            </Button>
          }
        />
        <div
          className={`mt-3 whitespace-pre-wrap rounded-xl border border-ink-200/70 bg-ink-50/50 p-4 text-[12.5px] leading-relaxed text-ink-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-300 ${
            showFullText ? "max-h-[520px] overflow-y-auto" : "max-h-56 overflow-hidden"
          }`}
        >
          {lecture.extracted_text || "No extracted text available."}
        </div>
        {!showFullText && lecture.extracted_text.length > 900 && (
          <button
            type="button"
            onClick={() => setShowFullText(true)}
            className="mt-2 text-[12px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            Show all {lecture.char_count.toLocaleString()} characters
          </button>
        )}
      </Card>

      {result?.document?.warnings && result.document.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" /> Preprocessing notes
          </p>
          <ul className="mt-1 space-y-0.5">
            {result.document.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Workspace;
