import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Download,
  FileText,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ScrollText,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  LoadingBlock,
  Modal,
  SectionHeading,
  Tabs,
} from "../components/ui";
import { useToast } from "../context/ToastContext";
import { apiError, downloadFromApi, formatBytes, formatDate, formatDuration, truncate } from "../services/api";
import { lectureService, summaryService } from "../services/rest";
import type { Lecture, Summary, SummaryMethod } from "../types";

type Tab = "lectures" | "summaries";

export function History() {
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState<Tab>("lectures");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<"" | SummaryMethod>("");
  const [deleteTarget, setDeleteTarget] = useState<{ kind: Tab; id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lectureData, summaryData] = await Promise.all([
        lectureService.list({ limit: 100 }),
        summaryService.list({ limit: 100 }),
      ]);
      setLectures(lectureData.items);
      setSummaries(summaryData.items);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredLectures = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return lectures;
    return lectures.filter((lecture) => lecture.original_filename.toLowerCase().includes(needle));
  }, [lectures, query]);

  const filteredSummaries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return summaries.filter((summary) => {
      if (methodFilter && summary.method !== methodFilter) return false;
      if (!needle) return true;
      return (
        (summary.lecture_filename ?? "").toLowerCase().includes(needle) ||
        summary.summary_text.toLowerCase().includes(needle)
      );
    });
  }, [summaries, query, methodFilter]);

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "lectures") {
        await lectureService.remove(deleteTarget.id);
        setLectures((current) => current.filter((item) => item.id !== deleteTarget.id));
        setSummaries((current) => current.filter((item) => item.lecture_id !== deleteTarget.id));
        success("Lecture deleted with its summaries, keywords and quizzes.");
      } else {
        await summaryService.remove(deleteTarget.id);
        setSummaries((current) => current.filter((item) => item.id !== deleteTarget.id));
        success("Summary deleted.");
      }
      setDeleteTarget(null);
    } catch (err) {
      toastError(apiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900 dark:text-white">Library</h1>
          <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
            {lectures.length} lectures · {summaries.length} summaries stored in MongoDB.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void load()} loading={loading} icon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <Link to="/upload" className="btn-primary">
            <Plus className="h-4 w-4" /> Upload
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tab === "lectures" ? "Search lecture filenames…" : "Search summaries…"}
              className="input pl-9"
              aria-label="Search the library"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Tabs<Tab>
            value={tab}
            onChange={(next) => {
              setTab(next);
              setQuery("");
            }}
            items={[
              { id: "lectures", label: "Lectures", icon: <BookOpen className="h-3.5 w-3.5" />, badge: <Badge tone="neutral">{lectures.length}</Badge> },
              { id: "summaries", label: "Summaries", icon: <ScrollText className="h-3.5 w-3.5" />, badge: <Badge tone="neutral">{summaries.length}</Badge> },
            ]}
          />
          {tab === "summaries" && (
            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value as "" | SummaryMethod)}
              className="input !w-auto min-w-[140px]"
              aria-label="Filter by method"
            >
              <option value="">All methods</option>
              <option value="extractive">TextRank</option>
              <option value="abstractive">BART</option>
            </select>
          )}
        </div>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading your library" />
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
          <p className="mt-2 text-[13px] text-ink-500 dark:text-ink-400">{error}</p>
          <Button className="mt-4" onClick={() => void load()}>
            Retry
          </Button>
        </Card>
      ) : tab === "lectures" ? (
        filteredLectures.length === 0 ? (
          <Card>
            <EmptyState
              icon={<UploadCloud className="h-5 w-5" />}
              title={query ? "No lectures match your search" : "No lectures yet"}
              description={query ? "Try a different filename." : "Upload a PDF lecture to start building your study library."}
              action={
                !query && (
                  <Link to="/upload" className="btn-primary">
                    <UploadCloud className="h-4 w-4" /> Upload a PDF
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredLectures.map((lecture) => (
              <Card key={lecture.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                    <FileText className="h-4 w-4" />
                  </span>
                  <IconButton
                    label="Delete lecture"
                    onClick={() => setDeleteTarget({ kind: "lectures", id: lecture.id, label: lecture.original_filename })}
                    className="!h-7 !w-7 text-ink-400 hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
                <Link
                  to={`/lectures/${lecture.id}`}
                  className="mt-2 line-clamp-2 text-[13px] font-semibold text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
                >
                  {lecture.original_filename}
                </Link>
                <p className="mt-1 text-[11.5px] text-ink-400">
                  {lecture.page_count} pages · {lecture.word_count.toLocaleString()} words ·{" "}
                  {formatBytes(lecture.file_size)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{lecture.summary_count} summaries</Badge>
                  {lecture.ocr_used && <Badge tone="violet">OCR</Badge>}
                  {lecture.warnings.length > 0 && <Badge tone="warning">{lecture.warnings.length} notes</Badge>}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="text-[10.5px] text-ink-400">{formatDate(lecture.upload_date)}</span>
                  <Link
                    to={`/lectures/${lecture.id}`}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : filteredSummaries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title={query || methodFilter ? "No summaries match your filters" : "No summaries yet"}
            description={
              query || methodFilter
                ? "Clear the search or method filter to see everything."
                : "Open a lecture and run TextRank or BART to create your first summary."
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden items-center gap-4 border-b border-ink-100 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-400 md:flex dark:border-white/10">
            <span className="w-8" />
            <span className="flex-1">Summary</span>
            <span className="w-24">Method</span>
            <span className="w-20">Length</span>
            <span className="w-20">Time</span>
            <span className="w-36">Created</span>
            <span className="w-14" />
          </div>
          <ul className="divide-y divide-ink-100 dark:divide-white/10">
            {filteredSummaries.map((summary) => (
              <li key={summary.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-ink-50/60 dark:hover:bg-white/[0.02]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300">
                  {summary.method === "abstractive" ? <Brain className="h-4 w-4" /> : <ScrollText className="h-4 w-4" />}
                </span>
                <div className="min-w-[220px] flex-1">
                  <Link
                    to={`/summaries/${summary.id}`}
                    className="line-clamp-1 text-[12.5px] font-semibold text-ink-800 hover:text-brand-700 dark:text-ink-100 dark:hover:text-brand-300"
                  >
                    {summary.lecture_filename ?? "Lecture summary"}
                  </Link>
                  <p className="line-clamp-1 text-[11.5px] text-ink-400">
                    {truncate(summary.summary_text.replace(/\s+/g, " "), 120)}
                  </p>
                </div>
                <span className="w-24">
                  <Badge tone={summary.method === "abstractive" ? "violet" : "brand"}>{summary.method}</Badge>
                </span>
                <span className="w-20 text-[11.5px] text-ink-500 dark:text-ink-400">{summary.summary_length}</span>
                <span className="w-20 text-[11.5px] tabular-nums text-ink-500 dark:text-ink-400">
                  {formatDuration(summary.processing_time)}
                </span>
                <span className="w-36 text-[11px] text-ink-400">{formatDate(summary.created_at)}</span>
                <span className="flex w-14 items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => downloadFromApi(`/summary/${summary.id}/download/txt`)}
                    className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-white/10 dark:hover:text-white"
                    title="Download TXT"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        kind: "summaries",
                        id: summary.id,
                        label: summary.lecture_filename ?? "summary",
                      })
                    }
                    className="rounded p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    title="Delete summary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!loading && !error && (
        <SectionHeading
          className="px-1"
          title="Storage note"
          description="Deleting a lecture also deletes its stored PDF, summaries, keywords and quizzes. Summary documents can be deleted individually."
        />
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.kind === "lectures" ? "Delete this lecture?" : "Delete this summary?"}
        description={
          deleteTarget?.kind === "lectures"
            ? `"${deleteTarget?.label}" and all of its summaries, keywords and quizzes will be removed permanently.`
            : `"${deleteTarget?.label}" will be removed permanently. The lecture is kept.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete} loading={deleting} icon={<Trash2 className="h-4 w-4" />}>
              Delete
            </Button>
          </>
        }
      >
        {deleteTarget?.kind === "lectures" && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            This action cannot be undone. Export any summary you want to keep first.
          </p>
        )}
      </Modal>

      {deleting && (
        <span className="sr-only">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
    </div>
  );
}

export default History;
