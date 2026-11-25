import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Logo, LogoMark } from "../components/Logo";

const FEATURES = [
  {
    icon: Network,
    title: "TextRank summaries",
    body: "A real TF-IDF cosine similarity graph, ranked with PageRank. Every sentence is traceable to the source.",
  },
  {
    icon: Brain,
    title: "BART abstractive summaries",
    body: "facebook/bart-large-cnn runs locally with token-aware chunking and hierarchical map-reduce.",
  },
  {
    icon: Layers,
    title: "Keywords & topics",
    body: "TF-IDF keyword ranking, plus heading detection or TF-IDF clustering for topic-wise summaries.",
  },
  {
    icon: HelpCircle,
    title: "Grounded quizzes",
    body: "Multiple-choice questions built from real sentences, with four options and an explanation.",
  },
  {
    icon: BarChart3,
    title: "ROUGE evaluation",
    body: "Score any summary against your own reference with ROUGE-1, ROUGE-2 and ROUGE-L.",
  },
  {
    icon: ShieldCheck,
    title: "Local & private",
    body: "PDFs stay on your machine. Only structured metadata is stored in MongoDB Atlas.",
  },
];

const STEPS = [
  { icon: FileText, title: "Upload a PDF", body: "Drag in lecture notes. Text is extracted page by page, with optional OCR for scans." },
  { icon: Wand2, title: "Preprocess & chunk", body: "Noise and duplicate sentences are removed, then the text is split on sentence boundaries." },
  { icon: GraduationCap, title: "Summarise & study", body: "Generate TextRank or BART summaries, keywords, topics and a quiz in one workspace." },
  { icon: BarChart3, title: "Evaluate & export", body: "Compare both methods with ROUGE, then download a formatted PDF or TXT." },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120]">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <a
            href="#features"
            className="hidden rounded-lg px-3 py-2 text-[13px] font-medium text-ink-600 hover:bg-ink-100 sm:block dark:text-ink-300 dark:hover:bg-white/10"
          >
            Features
          </a>
          <a
            href="#pipeline"
            className="hidden rounded-lg px-3 py-2 text-[13px] font-medium text-ink-600 hover:bg-ink-100 sm:block dark:text-ink-300 dark:hover:bg-white/10"
          >
            How it works
          </a>
          <Link to="/login" className="btn-ghost text-[13px]">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary btn-sm">
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-gradient-to-b from-brand-100/70 via-brand-50/30 to-transparent blur-2xl dark:from-brand-500/10 dark:via-transparent" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> NLP course project · no fake data
            </span>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              Turn 40 pages of notes into{" "}
              <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
                10 minutes of study
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-600 dark:text-ink-300">
              LectureNote AI reads your PDF lecture notes, produces extractive and abstractive
              summaries, ranks keywords, groups topics, generates quizzes and scores summaries with
              ROUGE — all with real NLP models running on your own machine.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary px-5 py-3">
                Create a free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary px-5 py-3">
                I already have an account
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-ink-500 dark:text-ink-400">
              {[
                "Real TextRank + BART",
                "MongoDB history",
                "PDF & TXT export",
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative animate-fade-in lg:justify-self-end">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-500/10 via-violet-500/10 to-transparent blur-2xl" />
            <div className="relative w-full max-w-md rotate-[-1.2deg] rounded-3xl border border-ink-200/80 bg-white p-5 shadow-pop dark:border-white/10 dark:bg-[#111a2e]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogoMark className="h-10 w-10 rounded-xl" />
                  <div>
                    <p className="text-[13px] font-semibold text-ink-900 dark:text-white">
                      Lecture 5 · NLP
                    </p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">
                      sample_lecture_notes.pdf · 4 pages
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  ready
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  <span>Abstractive summary</span>
                  <span>BART · local</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-ink-200 dark:bg-white/10" />
                  <div className="h-2 w-[92%] rounded-full bg-ink-200 dark:bg-white/10" />
                  <div className="h-2 w-[76%] rounded-full bg-ink-200 dark:bg-white/10" />
                  <div className="h-2 w-[84%] rounded-full bg-ink-200 dark:bg-white/10" />
                </div>
                <p className="mt-2 text-[11px] text-ink-500 dark:text-ink-400">
                  A condensed overview of the lecture, generated from the uploaded document.
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Method</p>
                  <p className="mt-1 text-[12px] font-semibold text-ink-800 dark:text-ink-100">
                    TextRank / BART
                  </p>
                </div>
                <div className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Outputs</p>
                  <p className="mt-1 text-[12px] font-semibold text-ink-800 dark:text-ink-100">
                    PDF · TXT · Quiz
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {["TF-IDF", "TextRank", "BART", "ROUGE-L", "Topic clusters"].map((chip) => (
                  <span key={chip} className="chip !py-0.5">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-ink-100 bg-ink-50/50 py-16 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              What is inside
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
              Genuine algorithms, not placeholder output
            </h2>
            <p className="mt-3 text-[14.5px] text-ink-600 dark:text-ink-300">
              Every feature maps to a tested module in the Python backend. If a model cannot load,
              the app tells you — it never pretends to have summarised your document.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-ink-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-[#111a2e]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[14px] font-semibold text-ink-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pipeline" className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              The pipeline
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
              From PDF to study pack in four steps
            </h2>
          </div>
          <Link to="/register" className="btn-outline">
            Try it with your notes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-white/10 dark:bg-[#111a2e]">
              <span className="absolute right-4 top-4 text-3xl font-black text-ink-100 dark:text-white/10">
                0{index + 1}
              </span>
              <step.icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h3 className="mt-4 text-[14px] font-semibold text-ink-900 dark:text-white">{step.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <BookOpen className="h-4 w-4" /> LectureNote AI · University NLP project
          </div>
          <div className="flex gap-4 text-[12px] text-ink-500 dark:text-ink-400">
            <Link to="/login" className="hover:text-ink-800 dark:hover:text-white">Sign in</Link>
            <Link to="/register" className="hover:text-ink-800 dark:hover:text-white">Register</Link>
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-ink-800 dark:hover:text-white">
              API docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
