import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  RefreshCw,
  ScrollText,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  LoadingBlock,
  Modal,
  Progress,
  SectionHeading,
} from "../components/ui";
import { useToast } from "../context/ToastContext";
import {
  apiError,
  downloadFromApi,
  formatDate,
  formatDuration,
  methodLabel,
  percent,
} from "../services/api";
import { summaryService } from "../services/rest";
import type { Summary, SummaryDetail } from "../types";

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink-200/70 px-3.5 py-3 dark:border-white/10">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-1 text-[15px] font-bold text-ink-900 dark:text-white">{value}</p>
      {hint && <p className="text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}

export function Results() {
  const { summaryId = "" } = useParams<{ summaryId: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [data, setData] = useState<SummaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await summaryService.get(summaryId);
        if (alive) setData(detail);
      } catch (err) {
        if (alive) setError(apiError(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [summaryId]);

  const summary: Summary | undefined = data?.summary;
  const sourceSentences = useMemo(
    () => (summary?.selected_sentences ?? []).filter((sentence) => sentence.selected !== false),
    [summary],
  );

  const copy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.summary_text);
      setCopied(true);
      success("Summary copied to the clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("The browser blocked clipboard access.");
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await summaryService.remove(summaryId);
      success("Summary deleted.");
      navigate("/history");
    } catch (err) {
      toastError(apiError(err));
      setDeleting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading the summary" />;

  if (error || !summary) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
        <h2 className="mt-3 text-base font-semibold text-ink-900 dark:text-white">Summary unavailable</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-500 dark:text-ink-400">
          {error ?? "This summary does not exist or belongs to another account."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => window.location.reload()} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
          <Link to="/history" className="btn-primary">
            Back to library
          </Link>
        </div>
      </Card>
    );
  }

  const evaluation = summary.last_evaluation;
  const isAbstractive = summary.method === "abstractive";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <h1 className="mt-1.5 flex flex-wrap items-center gap-2 text-[22px] font-bold tracking-tight text-ink-900 dark:text-white">
            {methodLabel(summary.method)}
            <Badge tone={isAbstractive ? "violet" : "brand"}>{summary.summary_length}</Badge>
            {summary.fallback_used && <Badge tone="warning">fallback model</Badge>}
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-500 dark:text-ink-400">
            {summary.lecture_filename} · generated {formatDate(summary.created_at)} ·{" "}
            {formatDuration(summary.processing_time)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={copy} icon={copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadFromApi(`/summary/${summary.id}/download/pdf`)}
            icon={<FileText className="h-3.5 w-3.5" />}
          >
            PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadFromApi(`/summary/${summary.id}/download/txt`)}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            TXT
          </Button>
          <IconButton label="Delete summary" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {isAbstractive ? <Brain className="h-4 w-4" /> : <ScrollText className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink-900 dark:text-white">Generated summary</p>
                <p className="text-[11px] text-ink-400">
                  {summary.model_name
                    ? `Model: ${summary.model_name}`
                    : summary.algorithm ?? "TextRank (PageRank)"}
                </p>
              </div>
            </div>
            <Badge tone="success">{summary.summary_word_count ?? summary.summary_text.split(/\s+/).length} words</Badge>
          </div>

          <div className="prose-summary mt-4">
            {paragraphs(summary.summary_text).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {(summary.warnings?.length ?? 0) > 0 && (
            <div className="mt-5 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Model notes
              </p>
              {(summary.warnings ?? []).map((warning) => (
                <p key={warning}>• {warning}</p>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHeading title="Metrics" description="Measured, not estimated." />
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Stat label="Processing" value={formatDuration(summary.processing_time)} />
              <Stat
                label="Compression"
                value={summary.compression_ratio != null ? percent(summary.compression_ratio) : "—"}
                hint="summary / source"
              />
              <Stat label="Summary words" value={summary.summary_word_count ?? "—"} />
              <Stat label="Source words" value={summary.source_word_count?.toLocaleString() ?? "—"} />
              <Stat label="Sentences" value={summary.source_sentence_count ?? "—"} hint="in the source" />
              <Stat label="Chunks" value={isAbstractive ? summary.chunk_count ?? 0 : "—"} hint={isAbstractive ? "BART passes" : undefined} />
            </div>
            {summary.device && (
              <p className="mt-3 text-[11px] text-ink-400">
                Inference device: <span className="font-medium text-ink-600 dark:text-ink-300">{summary.device}</span>
                {summary.requested_model && summary.requested_model !== summary.model_name && (
                  <> · requested {summary.requested_model}</>
                )}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeading title="Evaluation" description="ROUGE against your reference." />
            {evaluation ? (
              <div className="mt-3 space-y-2.5">
                {(["rouge1", "rouge2", "rougeL"] as const).map((key) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">
                        {key === "rougeL" ? "ROUGE-L" : key.replace("rouge", "ROUGE-")}
                      </span>
                      <span className="tabular-nums text-ink-500 dark:text-ink-400">
                        F {evaluation[key].fmeasure.toFixed(4)}
                      </span>
                    </div>
                    <Progress className="mt-1" value={evaluation[key].fmeasure * 100} />
                  </div>
                ))}
                <p className="text-[11px] text-ink-400">
                  Precision/recall are stored with the evaluation. ROUGE measures overlap, not factual
                  correctness.
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-[12.5px] text-ink-500 dark:text-ink-400">
                  No reference has been scored for this summary yet.
                </p>
                <Link
                  to={`/lectures/${summary.lecture_id}/evaluation`}
                  className="btn-secondary btn-sm mt-3"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Evaluate this summary
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeading title="Study next" />
            <div className="mt-3 grid gap-2">
              <Link to={`/lectures/${summary.lecture_id}/topics`} className="btn-secondary justify-start">
                <Layers className="h-4 w-4" /> Topic breakdown
              </Link>
              <Link to={`/lectures/${summary.lecture_id}/quiz`} className="btn-secondary justify-start">
                <HelpCircle className="h-4 w-4" /> Generate a quiz
              </Link>
              <Link to={`/lectures/${summary.lecture_id}`} className="btn-secondary justify-start">
                <BookOpen className="h-4 w-4" /> Open the workspace
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {data?.keywords && data.keywords.length > 0 && (
        <Card className="p-5">
          <SectionHeading
            title="Keywords"
            description="TF-IDF ranking computed from this lecture."
            action={<Badge tone="neutral">{data.keywords.length}</Badge>}
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.keywords.map((keyword) => (
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

      {!isAbstractive && sourceSentences.length > 0 && (
        <Card className="p-5">
          <SectionHeading
            title="Selected source sentences"
            description="TextRank returns original sentences in document order — nothing is invented."
            action={<Badge tone="brand">{sourceSentences.length}</Badge>}
          />
          <ol className="mt-3 space-y-2">
            {sourceSentences.map((sentence) => (
              <li
                key={sentence.index}
                className="flex gap-3 rounded-xl border border-ink-200/70 px-3.5 py-2.5 dark:border-white/10"
              >
                <span className="mt-0.5 text-[11px] font-bold tabular-nums text-brand-600 dark:text-brand-400">
                  #{sentence.index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-relaxed text-ink-700 dark:text-ink-200">{sentence.text}</p>
                  <p className="mt-1 text-[10.5px] text-ink-400">PageRank score {sentence.score.toFixed(4)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {isAbstractive && (summary.chunk_summaries?.length ?? 0) > 1 && (
        <Card className="p-5">
          <SectionHeading
            title="Chunk summaries"
            description="Intermediate BART outputs before the hierarchical reduce step."
            action={<Badge tone="violet">{summary.chunk_summaries?.length ?? 0} chunks</Badge>}
          />
          <div className="mt-3 space-y-2">
            {(summary.chunk_summaries ?? []).map((chunk, index) => (
              <div
                key={index}
                className="rounded-xl border border-ink-200/70 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-600 dark:border-white/10 dark:text-ink-300"
              >
                <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">
                  Chunk {index + 1}
                </p>
                {chunk}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this summary?"
        description="The summary and its stored evaluation are removed permanently. The lecture itself is kept."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete} loading={deleting} icon={<Trash2 className="h-4 w-4" />}>
              Delete summary
            </Button>
          </>
        }
      />
    </div>
  );
}

export default Results;
