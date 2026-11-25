import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, LoadingBlock, SectionHeading } from "../components/ui";
import { LectureTabs } from "../components/LectureTabs";
import { useToast } from "../context/ToastContext";
import { analysisService } from "../services/analysis";
import { apiError, truncate } from "../services/api";
import { lectureService } from "../services/rest";
import type { LectureDetail, TopicResult } from "../types";

export function Topics() {
  const { lectureId = "" } = useParams<{ lectureId: string }>();
  const { error: toastError } = useToast();
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [result, setResult] = useState<TopicResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxTopics, setMaxTopics] = useState(6);

  const run = useCallback(
    async (count: number) => {
      setRunning(true);
      setError(null);
      try {
        const data = await analysisService.topics(lectureId, count);
        setResult(data);
      } catch (err) {
        const message = apiError(err);
        setError(message);
        toastError(message);
      } finally {
        setRunning(false);
      }
    },
    [lectureId, toastError],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const detail = await lectureService.get(lectureId);
        if (!alive) return;
        setLecture(detail);
        setLoading(false);
        await run(6);
      } catch (err) {
        if (alive) {
          setError(apiError(err));
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  if (loading) return <LoadingBlock label="Building topics" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/lectures/${lectureId}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
          </Link>
          <h1 className="mt-1.5 text-[22px] font-bold tracking-tight text-ink-900 dark:text-white">
            Topics & section summaries
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-500 dark:text-ink-400">
            {lecture?.original_filename} — sections come from detected lecture headings when available,
            otherwise from TF-IDF sentence clustering.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="max-topics" className="label !mb-1 text-[11px]">
              Max topics
            </label>
            <select
              id="max-topics"
              value={maxTopics}
              onChange={(event) => setMaxTopics(Number(event.target.value))}
              className="input !w-24 !py-2"
            >
              {[4, 6, 8, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => void run(maxTopics)}
            loading={running}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Rebuild
          </Button>
        </div>
      </div>

      <LectureTabs />

      {running && (
        <Card className="flex items-center gap-3 p-4 text-[13px] text-ink-600 dark:text-ink-300">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          Segmenting the document and scoring sections…
        </Card>
      )}

      {error && !running && (
        <Card className="p-5">
          <div className="flex items-start gap-2 text-[12.5px] text-rose-700 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        </Card>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={result.method === "headings" ? "success" : "brand"}>
              {result.method === "headings" ? "heading segmentation" : "TF-IDF clustering"}
            </Badge>
            <Badge tone="neutral">{result.topic_count} topics</Badge>
            {result.notes.map((note) => (
              <span key={note} className="inline-flex items-center gap-1 text-[11.5px] text-ink-400">
                <BadgeCheck className="h-3 w-3" /> {note}
              </span>
            ))}
          </div>

          {result.topics.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Layers className="h-5 w-5" />}
                title="No topics could be formed"
                description="The document may be too short or too uniform. Try a longer lecture PDF."
              />
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {result.topics.map((topic) => (
                <Card key={topic.index} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        {String(topic.index).padStart(2, "0")}
                      </span>
                      <h2 className="text-[14px] font-semibold leading-snug text-ink-900 dark:text-white">
                        {topic.title}
                      </h2>
                    </div>
                    <Badge tone={topic.source === "heading" ? "success" : "brand"}>{topic.source}</Badge>
                  </div>

                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-600 dark:text-ink-300">
                    {topic.summary || "No extractive summary was produced for this section."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {topic.keywords.slice(0, 8).map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-md bg-ink-100/80 px-1.5 py-0.5 text-[11px] font-medium text-ink-600 dark:bg-white/10 dark:text-ink-300"
                      >
                        <Tag className="h-2.5 w-2.5" /> {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[11px] text-ink-400">
                    <span>
                      {topic.sentence_count} sentences · {topic.word_count.toLocaleString()} words
                    </span>
                    <span>starts at sentence #{topic.start_sentence + 1}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Notes
              </p>
              <ul className="mt-1 space-y-0.5">
                {result.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Card className="p-5">
        <SectionHeading
          title="How topics are built"
          description="No generative guessing: each topic is a real span of the document."
        />
        <div className="mt-3 grid gap-3 text-[12.5px] leading-relaxed text-ink-600 sm:grid-cols-2 dark:text-ink-300">
          <div className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
            <p className="font-semibold text-ink-800 dark:text-ink-100">Heading segmentation</p>
            <p className="mt-1 text-ink-500 dark:text-ink-400">
              Used when extraction detected at least two numbered or font-sized headings. Each heading
              becomes a topic, and TextRank summarises the sentences underneath it.
            </p>
          </div>
          <div className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
            <p className="font-semibold text-ink-800 dark:text-ink-100">TF-IDF clustering</p>
            <p className="mt-1 text-ink-500 dark:text-ink-400">
              Fallback for documents without headings: sentences are vectorised with TF-IDF, clustered,
              and labelled with their top keywords. Clusters are ordered by first appearance in the text.
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11.5px] text-ink-400">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
          Section summaries use the extractive TextRank algorithm, so they are limited to sentences that
          appear in the document.
        </p>
        <p className="mt-2 text-[11.5px] text-ink-400">
          Example section: “{truncate(result?.topics[0]?.summary ?? lecture?.extracted_text ?? "", 160)}”
        </p>
      </Card>
    </div>
  );
}

export default Topics;
