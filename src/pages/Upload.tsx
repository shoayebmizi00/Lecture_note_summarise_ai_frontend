import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  FileUp,
  Info,
  Loader2,
  ScanText,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Badge, Button, Card, Progress, SectionHeading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiError, formatBytes } from "../services/api";
import { lectureService } from "../services/rest";

const MAX_MB = 25;

export function Upload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [useOcr, setUseOcr] = useState(user?.settings.use_ocr ?? true);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    lecture: import("../types").Lecture;
    warnings: string[];
    text_preview: string;
  } | null>(null);

  const accept = useCallback(
    (candidate: File | undefined | null) => {
      if (!candidate) return;
      setError(null);
      setResult(null);
      if (!candidate.name.toLowerCase().endsWith(".pdf") && candidate.type !== "application/pdf") {
        setError("Only PDF files are supported. Export your notes as a PDF and try again.");
        return;
      }
      if (candidate.size > MAX_MB * 1024 * 1024) {
        setError(`This file is ${formatBytes(candidate.size)}. The limit is ${MAX_MB} MB.`);
        return;
      }
      if (candidate.size === 0) {
        setError("This file is empty.");
        return;
      }
      setFile(candidate);
      setProgress(0);
    },
    [],
  );

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const data = await lectureService.upload(file, useOcr, setProgress);
      setResult(data);
      success(`"${data.lecture.original_filename}" uploaded (${data.lecture.page_count} pages).`);
    } catch (err) {
      const message = apiError(err);
      setError(message);
      toastError(message);
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-ink-900 dark:text-white">Text extracted successfully</h1>
              <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                {result.lecture.original_filename} · {result.lecture.page_count} pages ·{" "}
                {result.lecture.word_count.toLocaleString()} words ·{" "}
                {result.lecture.sentence_count.toLocaleString()} sentences
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="success">ready</Badge>
                {result.lecture.ocr_used ? (
                  <Badge tone="violet">OCR used</Badge>
                ) : (
                  <Badge tone="neutral">text layer</Badge>
                )}
                <Badge tone="brand">{formatBytes(result.lecture.file_size)}</Badge>
              </div>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" /> Extraction notes
              </p>
              <ul className="space-y-1 text-[12px] text-amber-800 dark:text-amber-300/90">
                {result.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-ink-200/70 bg-ink-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">Text preview</p>
            <p className="mt-1.5 line-clamp-6 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-600 dark:text-ink-300">
              {result.text_preview}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => navigate(`/lectures/${result.lecture.id}`)}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Open workspace
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setFile(null);
                setProgress(0);
              }}
              icon={<FileUp className="h-4 w-4" />}
            >
              Upload another
            </Button>
          </div>
        </Card>

        <p className="text-center text-[12px] text-ink-400 dark:text-ink-500">
          Tip: open the workspace to run TextRank and BART, extract keywords, build topics and generate a quiz.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-ink-900 dark:text-white">Upload lecture notes</h1>
        <p className="mt-1 text-[13.5px] text-ink-500 dark:text-ink-400">
          PDF only, up to {MAX_MB} MB and {400} pages. Text is extracted page by page — scanned PDFs
          need Tesseract for OCR.
        </p>
      </div>

      <Card className="p-5">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
            dragging
              ? "border-brand-400 bg-brand-50/70 dark:border-brand-400/60 dark:bg-brand-500/10"
              : "border-ink-200 bg-ink-50/50 hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-300">
            <UploadCloud className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[14px] font-semibold text-ink-800 dark:text-ink-100">
            {dragging ? "Drop the PDF here" : "Drag and drop a PDF, or click to browse"}
          </p>
          <p className="mt-1 text-[12.5px] text-ink-500 dark:text-ink-400">
            Lecture slides, handouts, printed notes — anything with a text layer.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => accept(event.target.files?.[0])}
          />
        </div>

        {file && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink-800 dark:text-ink-100">{file.name}</p>
              <p className="text-[11.5px] text-ink-500 dark:text-ink-400">
                {formatBytes(file.size)} · PDF
              </p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setFile(null);
                setProgress(0);
              }}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {uploading && (
          <Progress
            className="mt-4"
            value={progress}
            label="Uploading and extracting text"
            hint={progress < 100 ? `${progress}%` : "extracting…"}
          />
        )}

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-ink-200/70 bg-ink-50/60 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
          <input
            id="use-ocr"
            type="checkbox"
            checked={useOcr}
            onChange={(event) => setUseOcr(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="use-ocr" className="flex-1 cursor-pointer">
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">
              <ScanText className="h-3.5 w-3.5" /> Use OCR for scanned pages
            </span>
            <span className="mt-0.5 block text-[12px] text-ink-500 dark:text-ink-400">
              Only applied when a page has almost no text layer. Requires Tesseract installed on the
              backend machine; otherwise the page is skipped with a warning.
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Stored in your uploads folder, scoped to your account.
          </p>
          <Button
            onClick={onUpload}
            disabled={!file || uploading}
            loading={uploading}
            icon={uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          >
            {uploading ? "Processing…" : "Upload and extract"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading title="What happens next" description="Extraction runs synchronously on the backend." />
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Extract", "PyMuPDF reads each page, removes repeated headers and detects headings by font size."],
            ["Clean", "Noise, page numbers and duplicate sentences are removed before analysis."],
            ["Ready", "The lecture opens in the workspace where you choose TextRank or BART."],
          ].map(([title, body], index) => (
            <li key={title} className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {index + 1}
              </span>
              <p className="mt-2 text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">{title}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-brand-200/70 bg-brand-50/50 px-4 py-3 text-[12px] text-brand-900/80 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-200/90">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        BART-large on a CPU is slow (minutes per summary). For a quick demo set{" "}
        <code className="rounded bg-white/70 px-1 font-mono text-[11px] dark:bg-black/20">PREFER_LIGHT_MODEL=true</code>{" "}
        in backend/.env to use distilbart instead.
      </div>
    </div>
  );
}

export default Upload;
