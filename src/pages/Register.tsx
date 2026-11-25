import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, UserPlus, X } from "lucide-react";
import { AuthShell } from "../components/AuthShell";
import { Button, Field, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiError } from "../services/api";

const RULES = [
  { id: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { id: "letter", label: "Contains a letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { id: "number", label: "Contains a number", test: (value: string) => /\d/.test(value) },
];

export function Register() {
  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = useMemo(() => RULES.map((rule) => ({ ...rule, ok: rule.test(password) })), [password]);
  const passwordOk = checks.every((check) => check.ok);
  const mismatch = confirm.length > 0 && confirm !== password;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!passwordOk) {
      setError("Please choose a password that satisfies all requirements.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      success("Account created. Upload your first lecture to begin.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Your lectures, summaries and quizzes are private to this account."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Username" htmlFor="username" hint="3–32 characters: letters, numbers, dot, dash, underscore.">
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            required
            placeholder="ayesha.k"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@university.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Choose a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <ul className="grid gap-1.5 rounded-xl border border-ink-200/70 bg-ink-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          {checks.map((check) => (
            <li
              key={check.id}
              className={
                check.ok
                  ? "flex items-center gap-2 text-[12px] font-medium text-emerald-700 dark:text-emerald-400"
                  : "flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400"
              }
            >
              {check.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />}
              {check.label}
            </li>
          ))}
        </ul>

        <Field
          label="Confirm password"
          htmlFor="confirm"
          error={mismatch ? "Passwords do not match." : undefined}
        >
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Repeat the password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={submitting}
          icon={<UserPlus className="h-4 w-4" />}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
