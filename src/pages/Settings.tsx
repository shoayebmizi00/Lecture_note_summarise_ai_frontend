import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Info,
  Laptop,
  Moon,
  RefreshCw,
  Save,
  ScanText,
  Server,
  ShieldAlert,
  Sparkles,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Field,
  LoadingBlock,
  Modal,
  SectionHeading,
  Select,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { apiError, formatDate } from "../services/api";
import { systemService } from "../services/rest";
import type { Health, SummaryLength, SummaryMethod } from "../types";

export function Settings() {
  const { user, updateSettings, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [method, setMethod] = useState<SummaryMethod>(user?.settings.default_method ?? "extractive");
  const [length, setLength] = useState<SummaryLength>(user?.settings.default_length ?? "medium");
  const [useOcr, setUseOcr] = useState(user?.settings.use_ocr ?? true);
  const [saving, setSaving] = useState(false);

  const [health, setHealth] = useState<Health | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setMethod(user.settings.default_method);
    setLength(user.settings.default_length);
    setUseOcr(user.settings.use_ocr);
  }, [user]);

  const loadHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      setHealth(await systemService.health());
    } catch (err) {
      setHealthError(apiError(err));
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings({ default_method: method, default_length: length, use_ocr: useOcr, theme });
      success("Preferences saved.");
    } catch (err) {
      toastError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAccount = async () => {
    if (confirmText.trim() !== user?.username) return;
    setDeleting(true);
    try {
      await deleteAccount();
      success("Your account and all stored documents were deleted.");
      navigate("/", { replace: true });
    } catch (err) {
      toastError(apiError(err));
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-ink-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
          Preferences, local model diagnostics and account controls.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeading title="Account" description="Identity stored in MongoDB Atlas." />
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
              {user?.username.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-ink-900 dark:text-white">{user?.username}</p>
              <p className="truncate text-[12px] text-ink-500 dark:text-ink-400">{user?.email}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200/70 px-3 py-2 dark:border-white/10">
              <dt className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                <User className="h-3.5 w-3.5" /> Username
              </dt>
              <dd className="font-medium text-ink-800 dark:text-ink-100">{user?.username}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200/70 px-3 py-2 dark:border-white/10">
              <dt className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                <Database className="h-3.5 w-3.5" /> Member since
              </dt>
              <dd className="font-medium text-ink-800 dark:text-ink-100">{formatDate(user?.created_at)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex items-start gap-1.5 text-[11.5px] text-ink-400">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Authentication uses a bcrypt password hash (SHA-256 pre-hash) and a JWT stored in an
            httpOnly cookie. Passwords are never stored in plain text.
          </p>
        </Card>

        <Card className="p-5">
          <SectionHeading title="Appearance & defaults" description="Applied to new uploads and analyses." />
          <div className="mt-4 space-y-4">
            <div>
              <p className="label">Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "light" as const, label: "Light", icon: Sun },
                  { id: "dark" as const, label: "Dark", icon: Moon },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold transition ${
                      theme === option.id
                        ? "border-brand-300 bg-brand-50/70 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200"
                        : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <option.icon className="h-4 w-4" /> {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Default summary method" htmlFor="default-method">
              <Select
                id="default-method"
                value={method}
                onChange={(event) => setMethod(event.target.value as SummaryMethod)}
              >
                <option value="extractive">TextRank (extractive, fast)</option>
                <option value="abstractive">BART (abstractive, slow on CPU)</option>
              </Select>
            </Field>

            <Field label="Default summary length" htmlFor="default-length">
              <Select
                id="default-length"
                value={length}
                onChange={(event) => setLength(event.target.value as SummaryLength)}
              >
                <option value="short">Short — about 10% of the text</option>
                <option value="medium">Medium — about 20% of the text</option>
                <option value="long">Long — about 30% of the text</option>
              </Select>
            </Field>

            <label className="flex items-start gap-3 rounded-xl border border-ink-200/70 bg-ink-50/60 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
              <input
                type="checkbox"
                checked={useOcr}
                onChange={(event) => setUseOcr(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">
                  <ScanText className="h-3.5 w-3.5" /> Use OCR by default
                </span>
                <span className="mt-0.5 block text-[11.5px] text-ink-500 dark:text-ink-400">
                  Applies to new uploads when a page has no text layer. Tesseract must be installed on the
                  backend machine.
                </span>
              </span>
            </label>

            <Button onClick={save} loading={saving} icon={<Save className="h-4 w-4" />}>
              Save preferences
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading
          title="System health"
          description="Live status reported by GET /api/health."
          action={
            <Button variant="secondary" size="sm" onClick={() => void loadHealth()} loading={healthLoading} icon={<RefreshCw className="h-3.5 w-3.5" />}>
              Refresh
            </Button>
          }
        />

        {healthLoading && !health ? (
          <LoadingBlock label="Checking the backend" />
        ) : healthError ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-[12.5px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">The backend did not answer</p>
              <p className="mt-0.5">{healthError}</p>
              <p className="mt-1 text-[11.5px] opacity-80">
                Start it with: <code className="font-mono">python -m uvicorn app.main:app --port 8000</code>
              </p>
            </div>
          </div>
        ) : health ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                    <Database className="h-3.5 w-3.5" /> MongoDB
                  </span>
                  <Badge tone={health.database.connected ? "success" : "danger"}>
                    {health.database.connected ? "connected" : "offline"}
                  </Badge>
                </div>
                <p className="mt-2 text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">
                  {health.database.database}
                </p>
                <p className="text-[11px] text-ink-400">{health.database.engine}</p>
              </div>

              <div className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                    <Cpu className="h-3.5 w-3.5" /> BART
                  </span>
                  <Badge
                    tone={
                      health.models.loaded
                        ? "success"
                        : health.models.primary_model_cached || health.models.fallback_model_cached
                          ? "brand"
                          : "warning"
                    }
                  >
                    {health.models.loaded ? "loaded" : "not loaded"}
                  </Badge>
                </div>
                <p className="mt-2 break-all text-[12px] font-semibold text-ink-800 dark:text-ink-100">
                  {health.models.loaded_model ?? health.models.primary_model}
                </p>
                <p className="text-[11px] text-ink-400">
                  device {health.models.device} · light mode {health.models.prefer_light_model ? "on" : "off"}
                </p>
              </div>

              <div className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                    <Laptop className="h-3.5 w-3.5" /> OCR
                  </span>
                  <Badge tone={health.ocr.available ? "success" : "neutral"}>
                    {health.ocr.available ? "available" : "unavailable"}
                  </Badge>
                </div>
                <p className="mt-2 text-[12px] text-ink-700 dark:text-ink-200">
                  {health.ocr.available ? "Tesseract detected" : "Install Tesseract to read scans"}
                </p>
                <p className="line-clamp-2 text-[11px] text-ink-400">{health.ocr.detail}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
              <div className="rounded-xl bg-ink-50/70 p-3.5 dark:bg-white/[0.03]">
                <p className="flex items-center gap-1.5 font-semibold text-ink-700 dark:text-ink-200">
                  <Server className="h-3.5 w-3.5" /> Runtime
                </p>
                <ul className="mt-1.5 space-y-1 text-ink-500 dark:text-ink-400">
                  <li>App {health.app} v{health.version} · {health.environment}</li>
                  <li>Python {health.python} · uptime {Math.round(health.uptime_seconds)} s</li>
                  <li>Upload limit {health.limits.max_upload_mb} MB · max {health.limits.max_pdf_pages} pages</li>
                </ul>
              </div>
              <div className="rounded-xl bg-ink-50/70 p-3.5 dark:bg-white/[0.03]">
                <p className="flex items-center gap-1.5 font-semibold text-ink-700 dark:text-ink-200">
                  <HardDrive className="h-3.5 w-3.5" /> Model cache
                </p>
                <ul className="mt-1.5 space-y-1 text-ink-500 dark:text-ink-400">
                  <li className="flex items-center gap-1.5">
                    {health.models.primary_model_cached ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    {health.models.primary_model}
                  </li>
                  <li className="flex items-center gap-1.5">
                    {health.models.fallback_model_cached ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    {health.models.fallback_model}
                  </li>
                  <li>Chunk budget {health.limits.chunk_token_budget} tokens</li>
                </ul>
              </div>
            </div>

            {health.models.last_error && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Last model error: {health.models.last_error}
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-[12.5px] text-ink-500 dark:text-ink-400">No health information available.</p>
        )}
      </Card>

      <Card className="p-5">
        <SectionHeading title="About the engine" description="What is real and what is limited." />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["Extractive", "True TF-IDF cosine sentence graph + PageRank (NetworkX). Sentences are returned in document order."],
            ["Abstractive", "facebook/bart-large-cnn (or distilbart fallback) with token-aware chunking and a reduce pass."],
            ["Keywords & topics", "TF-IDF ranking; topics use detected headings or TF-IDF clustering. No generative labels."],
            ["Evaluation", "rouge_score implementation of ROUGE-1/2/L against a reference you write yourself."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-ink-200/70 p-3.5 dark:border-white/10">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-800 dark:text-ink-100">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" /> {title}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11.5px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          BART on CPU can take several minutes per document. TextRank is near-instant. BART output may
          contain hallucinations and should always be reviewed before study use.
        </div>
      </Card>

      <Card className="border-rose-200 p-5 dark:border-rose-500/30">
        <SectionHeading
          title="Danger zone"
          description="Irreversible actions. Export anything you want to keep first."
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200/70 bg-rose-50/40 p-4 dark:border-rose-500/30 dark:bg-rose-500/5">
          <div>
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-rose-800 dark:text-rose-200">
              <ShieldAlert className="h-3.5 w-3.5" /> Delete account
            </p>
            <p className="mt-0.5 text-[11.5px] text-rose-700/80 dark:text-rose-300/80">
              Removes your user record, lectures, stored PDFs, summaries, keywords, quizzes and jobs.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            icon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Delete account
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmText("");
        }}
        title="Delete your account permanently?"
        description="This cannot be undone. Type your username to confirm."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onDeleteAccount}
              loading={deleting}
              disabled={confirmText.trim() !== user?.username}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Delete everything
            </Button>
          </>
        }
      >
        <Field label={`Type "${user?.username}" to confirm`} htmlFor="confirm-account">
          <input
            id="confirm-account"
            className="input"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={user?.username}
            autoComplete="off"
          />
        </Field>
      </Modal>
    </div>
  );
}

export default Settings;
