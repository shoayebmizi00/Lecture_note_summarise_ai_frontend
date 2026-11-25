import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  HelpCircle,
  Info,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, LoadingBlock, Progress, SectionHeading } from "../components/ui";
import { LectureTabs } from "../components/LectureTabs";
import { useToast } from "../context/ToastContext";
import { analysisService } from "../services/analysis";
import { apiError, downloadFromApi } from "../services/api";
import { lectureService } from "../services/rest";
import type { LectureDetail, QuizResult } from "../types";

const LETTERS = ["A", "B", "C", "D", "E"];

export function Quiz() {
  const { lectureId = "" } = useParams<{ lectureId: string }>();
  const { error: toastError } = useToast();
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const generate = useCallback(
    async (requested: number, seed?: number) => {
      setRunning(true);
      setError(null);
      setAnswers({});
      setRevealed({});
      try {
        const data = await analysisService.quiz(lectureId, requested, seed);
        setQuiz(data);
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
        await generate(5);
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

  if (loading) return <LoadingBlock label="Preparing the quiz" />;

  const questions = quiz?.questions ?? [];
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.reduce(
    (total, question, index) => (answers[index] === question.correct_index ? total + 1 : total),
    0,
  );
  const finished = questions.length > 0 && answeredCount === questions.length;

  const choose = (index: number, option: number) => {
    if (revealed[index]) return;
    setAnswers((current) => ({ ...current, [index]: option }));
  };

  const reveal = (index: number) => {
    if (answers[index] === undefined) return;
    setRevealed((current) => ({ ...current, [index]: true }));
  };

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
            Practice quiz
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-500 dark:text-ink-400">
            {lecture?.original_filename} — questions are generated from real sentences. Items without
            four clean options are skipped instead of invented.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="quiz-count" className="label !mb-1 text-[11px]">
              Questions
            </label>
            <select
              id="quiz-count"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="input !w-20 !py-2"
            >
              {[3, 5, 8, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => void generate(count, Math.floor(Math.random() * 10_000))}
            loading={running}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            New quiz
          </Button>
        </div>
      </div>

      <LectureTabs />

      {running && (
        <Card className="flex items-center gap-3 p-4 text-[13px] text-ink-600 dark:text-ink-300">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          Finding definitions, acronyms and fill-in-the-blank sentences…
        </Card>
      )}

      {error && !running && (
        <Card className="p-5">
          <div className="flex items-start gap-2 text-[12.5px] text-rose-700 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        </Card>
      )}

      {quiz && !running && (
        <>
          {questions.length === 0 ? (
            <Card>
              <EmptyState
                icon={<HelpCircle className="h-5 w-5" />}
                title="No reliable questions could be generated"
                description="The generator only uses sentences with enough context and four distinct options. Try a longer or more definition-rich lecture."
                action={
                  <Button onClick={() => void generate(count, Math.floor(Math.random() * 10_000))}>
                    Try again
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              <Card className="sticky top-[68px] z-20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-ink-900 dark:text-white">
                        {correctCount} correct of {questions.length}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        {answeredCount} answered · {quiz.generated} generated from your notes
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(quiz.strategies).map(([strategy, amount]) => (
                      <Badge key={strategy} tone="neutral">
                        {strategy} · {amount}
                      </Badge>
                    ))}
                    <button
                      type="button"
                      onClick={() => downloadFromApi(`/lectures/${lectureId}/download/quiz?format=csv`)}
                      className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
                    >
                      <Download className="h-3 w-3" /> CSV
                    </button>
                  </div>
                </div>
                <Progress className="mt-3" value={(answeredCount / questions.length) * 100} />
              </Card>

              {finished && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    You scored {correctCount}/{questions.length} (
                    {Math.round((correctCount / questions.length) * 100)}%).
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAnswers({});
                      setRevealed({});
                    }}
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                  >
                    Retry same quiz
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {questions.map((question, index) => {
                  const selected = answers[index];
                  const isRevealed = revealed[index];
                  const isCorrect = selected === question.correct_index;
                  return (
                    <Card key={index} className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-[11px] font-bold text-ink-600 dark:bg-white/10 dark:text-ink-300">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="brand">{question.strategy}</Badge>
                            <Badge tone="neutral">{question.difficulty}</Badge>
                          </div>
                          <p className="mt-2 text-[13.5px] font-semibold leading-relaxed text-ink-900 dark:text-white">
                            {question.question}
                          </p>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {question.options.map((option, optionIndex) => {
                              const isPicked = selected === optionIndex;
                              const isAnswer = optionIndex === question.correct_index;
                              return (
                                <button
                                  key={optionIndex}
                                  type="button"
                                  onClick={() => choose(index, optionIndex)}
                                  onDoubleClick={() => reveal(index)}
                                  disabled={isRevealed}
                                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[12.5px] transition ${
                                    isRevealed && isAnswer
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                                      : isRevealed && isPicked && !isAnswer
                                        ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                                        : isPicked
                                          ? "border-brand-300 bg-brand-50/70 text-ink-900 ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-white"
                                          : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-200 dark:hover:bg-white/[0.05]"
                                  }`}
                                >
                                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-current text-[9px] font-bold opacity-70">
                                    {LETTERS[optionIndex]}
                                  </span>
                                  <span className="min-w-0 flex-1">{option}</span>
                                  {isRevealed && isAnswer && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                                  {isRevealed && isPicked && !isAnswer && <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant={isRevealed ? "secondary" : "primary"}
                              onClick={() => reveal(index)}
                              disabled={selected === undefined || isRevealed}
                              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            >
                              {isRevealed ? "Answer shown" : "Check answer"}
                            </Button>
                            {isRevealed && (
                              <span
                                className={
                                  isCorrect
                                    ? "text-[12px] font-semibold text-emerald-700 dark:text-emerald-400"
                                    : "text-[12px] font-semibold text-rose-700 dark:text-rose-400"
                                }
                              >
                                {isCorrect ? "Correct" : `Correct answer: ${LETTERS[question.correct_index]}`}
                              </span>
                            )}
                          </div>

                          {isRevealed && (
                            <div className="mt-3 space-y-2 rounded-xl border border-ink-200/70 bg-ink-50/60 p-3.5 text-[12px] dark:border-white/10 dark:bg-white/[0.03]">
                              <p className="text-ink-600 dark:text-ink-300">
                                <span className="font-semibold text-ink-800 dark:text-ink-100">Explanation: </span>
                                {question.explanation}
                              </p>
                              <p className="flex items-start gap-1.5 border-t border-ink-200/70 pt-2 text-[11.5px] italic text-ink-500 dark:border-white/10 dark:text-ink-400">
                                <Info className="mt-0.5 h-3 w-3 shrink-0" /> “{question.source_sentence}”
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {quiz.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Generator notes
              </p>
              <ul className="mt-1 space-y-0.5">
                {quiz.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Card className="p-5">
        <SectionHeading
          title="How the questions are made"
          description="Honest template-based generation — not an LLM writing facts."
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Definition", "“X is Y” / “X refers to Y” sentences become “What is X?” with the real definition and three distractors from other keywords."],
            ["Acronym", "Pronounced uppercase tokens such as TF-IDF or BERT become “What does X stand for?” only when the expansion appears in the text."],
            ["Cloze", "A single keyword is blanked out of a long sentence when it is a noun, appears once, and three plausible terms are available."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" /> {title}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-ink-400">
          Skipped items: {quiz?.skipped ?? 0}. Questions are tied to a source sentence so you can verify
          every answer.
        </p>
      </Card>
    </div>
  );
}

export default Quiz;
