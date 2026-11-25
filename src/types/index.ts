export type SummaryMethod = "extractive" | "abstractive";
export type SummaryLength = "short" | "medium" | "long";
export type Theme = "light" | "dark";

export interface UserSettings {
  theme: Theme;
  default_method: SummaryMethod;
  default_length: SummaryLength;
  use_ocr: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  settings: UserSettings;
}

export interface Lecture {
  id: string;
  original_filename: string;
  page_count: number;
  char_count: number;
  word_count: number;
  sentence_count: number;
  file_size: number;
  upload_date?: string;
  processing_status: string;
  ocr_used: boolean;
  warnings: string[];
  preview?: string;
  summary_count: number;
}

export interface LectureHeading {
  text: string;
  page: number;
  font_size: number;
}

export interface LectureDetail extends Lecture {
  extracted_text: string;
  headings: LectureHeading[];
  pages: { number: number; char_count: number; used_ocr: boolean }[];
  metadata_info: Record<string, string | number>;
}

export interface ScoredSentence {
  index: number;
  text: string;
  score: number;
  selected: boolean;
}

export interface Summary {
  id: string;
  lecture_id: string;
  method: SummaryMethod;
  algorithm?: string | null;
  summary_text: string;
  summary_length: SummaryLength;
  processing_time: number;
  created_at?: string;
  model_name?: string | null;
  requested_model?: string | null;
  fallback_used?: boolean;
  device?: string | null;
  chunk_count?: number;
  chunk_summaries?: string[];
  compression_ratio?: number | null;
  summary_word_count?: number | null;
  source_word_count?: number | null;
  source_sentence_count?: number | null;
  selected_sentences?: ScoredSentence[];
  sentence_scores?: ScoredSentence[];
  warnings?: string[];
  lecture_filename?: string | null;
  last_evaluation?: Evaluation | null;
}

export interface Keyword {
  keyword: string;
  score: number;
  frequency: number;
  kind: string;
  method: string;
}

export interface DocumentInfo {
  word_count: number;
  char_count: number;
  sentence_count: number;
  average_sentence_words: number;
  duplicates_removed: number;
  noise_removed: number;
  preprocessing_time: number;
  reading_time_minutes: number;
  warnings: string[];
}

export interface AnalysisResult {
  summaries: Summary[];
  keywords: Keyword[];
  keyword_method?: string;
  document: DocumentInfo;
  total_processing_time: number;
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  stage: string;
  message?: string | null;
  lecture_id?: string | null;
  error?: string | null;
  result?: AnalysisResult | null;
  created_at?: string;
  updated_at?: string;
}

export interface Topic {
  index: number;
  title: string;
  summary: string;
  keywords: string[];
  sentence_count: number;
  word_count: number;
  source: "heading" | "cluster" | "document";
  start_sentence: number;
}

export interface TopicResult {
  topics: Topic[];
  method: string;
  topic_count: number;
  notes: string[];
  warnings: string[];
  lecture_id?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  correct_answer: string;
  explanation: string;
  source_sentence: string;
  strategy: string;
  difficulty: string;
}

export interface QuizResult {
  questions: QuizQuestion[];
  requested: number;
  generated: number;
  skipped: number;
  strategies: Record<string, number>;
  notes: string[];
  warnings: string[];
  stored?: number;
  lecture_id?: string;
}

export interface RougeMetric {
  precision: number;
  recall: number;
  fmeasure: number;
}

export interface EvaluationStats {
  summary_words: number;
  source_words?: number | null;
  reference_words?: number | null;
  compression_ratio?: number | null;
  summary_sentences: number;
  reading_time_saved_minutes?: number | null;
  coverage_of_reference?: number | null;
}

export interface Evaluation {
  method?: SummaryMethod | null;
  rouge1: RougeMetric;
  rouge2: RougeMetric;
  rougeL: RougeMetric;
  rougeLsum?: RougeMetric;
  stats: EvaluationStats;
  processing_time: number;
  warnings: string[];
  notes: string[];
  summary_id?: string;
  lecture_id?: string;
  summary_preview?: string;
  reference_words?: number;
}

export interface ComparisonResult {
  results: Array<Evaluation & { summary_id: string; summary_length: string }>;
  best_by_rougeL?: SummaryMethod | null;
  reference_words?: number;
  notes: string[];
  lecture_id?: string;
  lecture_filename?: string;
}

export interface ModelStatus {
  loaded: boolean;
  loaded_model?: string | null;
  device: string;
  primary_model: string;
  primary_model_cached: boolean;
  fallback_model: string;
  fallback_model_cached: boolean;
  prefer_light_model: boolean;
  allow_model_download: boolean;
  last_error?: string | null;
}

export interface Health {
  status: string;
  app: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime_seconds: number;
  python: string;
  database: { connected: boolean; engine: string; database: string };
  ocr: { available: boolean; detail: string; enabled: boolean };
  models: ModelStatus;
  limits: { max_upload_mb: number; max_pdf_pages: number; chunk_token_budget: number };
}

export interface Stats {
  lecture_count: number;
  summary_count: number;
  keyword_count: number;
  quiz_count: number;
  avg_processing_time: number;
  total_processing_time: number;
  summaries_by_method: Record<string, number>;
  recent_summaries: Summary[];
  username?: string;
}

export interface SummaryDetail {
  summary: Summary;
  lecture: Lecture;
  keywords: Keyword[];
  lecture_id: string;
}
