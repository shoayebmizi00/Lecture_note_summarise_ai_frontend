import { api } from "./api";
import type {
  AnalysisResult,
  ComparisonResult,
  Evaluation,
  Job,
  Keyword,
  QuizResult,
  SummaryLength,
  SummaryMethod,
  TopicResult,
} from "../types";

export const analysisService = {
  async summarize(payload: {
    lecture_id: string;
    method: SummaryMethod;
    length: SummaryLength;
    save?: boolean;
  }): Promise<Job> {
    const { data } = await api.post<Job>("/summarize", { save: true, ...payload });
    return data;
  },

  async compare(payload: { lecture_id: string; length: SummaryLength }): Promise<Job> {
    const { data } = await api.post<Job>("/summarize/compare", payload);
    return data;
  },

  async job(id: string): Promise<Job> {
    const { data } = await api.get<Job>(`/jobs/${id}`);
    return data;
  },

  async keywords(lectureId: string, topN = 15): Promise<{ keywords: Keyword[]; method: string; saved: boolean }> {
    const { data } = await api.post("/keywords", { lecture_id: lectureId, top_n: topN, save: true });
    return data;
  },

  async topics(lectureId: string, maxTopics = 6): Promise<TopicResult> {
    const { data } = await api.post<TopicResult>("/topics", {
      lecture_id: lectureId,
      max_topics: maxTopics,
    });
    return data;
  },

  async quiz(lectureId: string, count = 5, seed?: number): Promise<QuizResult> {
    const { data } = await api.post<QuizResult>("/quiz", {
      lecture_id: lectureId,
      count,
      save: true,
      ...(seed !== undefined ? { seed } : {}),
    });
    return data;
  },

  async evaluate(payload: {
    reference_summary: string;
    summary_id?: string;
    summary_text?: string;
    lecture_id?: string;
  }): Promise<Evaluation> {
    const { data } = await api.post<Evaluation>("/evaluate", payload);
    return data;
  },

  async compareEvaluation(payload: {
    lecture_id: string;
    reference_summary: string;
  }): Promise<ComparisonResult> {
    const { data } = await api.post<ComparisonResult>("/evaluate/compare", payload);
    return data;
  },

  async waitForJob(
    id: string,
    onUpdate?: (job: Job) => void,
    signal?: AbortSignal,
  ): Promise<Job> {
    const started = Date.now();
    for (;;) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const job = await analysisService.job(id);
      onUpdate?.(job);
      if (job.status === "succeeded" || job.status === "failed") return job;
      if (Date.now() - started > 60 * 60 * 1000) {
        throw new Error("The job is taking unusually long. Check the backend logs.");
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  },
};

export type { AnalysisResult };
