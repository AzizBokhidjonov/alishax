import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/auth-context";
import { isApiError } from "@/api";
import { errorMessage } from "@/lib/errors";
import { LANGUAGES } from "@/i18n";
import { useLanguage } from "@/i18n/useLanguage";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { RoleLegend } from "./RoleLegend";
import { DayNowChip, DayRail } from "./DayRail";
import { formatClock, greetingKey, useMinuteOfDay } from "./day";
import { cn, focusRing } from "@/lib/utils";
import logo from "@/assets/logo-alishax.png";
import panelImg from "@/assets/landing-hero.jpg";

export function LoginPage() {
  const { t } = useTranslation();
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const minute = useMinuteOfDay();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/boshqaruv", replace: true });
  }, [status, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const me = await login(loginValue.trim(), password);
      toast.success(t("auth.welcome", { name: me.user.fullName }));
      navigate({ to: "/boshqaruv", replace: true });
    } catch (caught) {
      // 423 va 429 uchun alohida matn — qolganlari kod bo'yicha tarjima qilinadi.
      if (isApiError(caught) && caught.status === 429) setError(t("auth.rateLimited"));
      else if (isApiError(caught) && caught.code === "ACCOUNT_LOCKED")
        setError(t("auth.lockedCountdown", { minutes: 15 }));
      else setError(errorMessage(t, caught));
    } finally {
      setBusy(false);
    }
  };

  /*
    Caps Lock — kirish xatolarining eng ko'p uchraydigan sababi, parol esa
    yopiq bo'lgani uchun buni ko'rib bo'lmaydi. Holat klaviatura hodisasidan
    olinadi, shuning uchun u faqat maydonga yozila boshlagach paydo bo'ladi.
  */
  const trackCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  };

  // Parol maydoni ikkita izohga ega bo'lishi mumkin: xato va Caps Lock.
  const passwordHints =
    [error ? "login-error" : null, capsLock ? "caps-hint" : null].filter(Boolean).join(" ") ||
    undefined;

  const backLink = (
    <>
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      {t("nav.landing")}
    </>
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/*
        Chap panel — bog'chaning o'zi: foto, logotip va bugungi kun tartibi.
        Foto bu yerda fon vazifasini bajaradi, ma'lumot tashimaydi — shuning
        uchun `alt` bo'sh va butun qatlam `aria-hidden`. Matn foto ustidagi
        to'q navy qatlamda o'qiladi.
      */}
      <div className="relative hidden max-h-screen flex-col justify-between gap-10 overflow-y-auto bg-panel p-10 text-panel-foreground lg:flex xl:p-14">
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <img
            src={panelImg}
            alt=""
            width={1024}
            height={1024}
            className="h-full w-full animate-[ken-burns_32s_ease-in-out_infinite] object-cover"
          />
          <div className="absolute inset-0 bg-panel/80" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--panel)_18%,transparent_62%,var(--panel)_96%)]" />
          <div className="absolute -left-24 top-1/3 h-72 w-72 animate-[blob_20s_ease-in-out_infinite] rounded-full bg-sky/20 blur-3xl" />
          <div className="absolute -right-16 bottom-8 h-64 w-64 animate-[blob_26s_ease-in-out_infinite_reverse] rounded-full bg-brand/20 blur-3xl" />
        </div>

        <div className="relative flex shrink-0 items-center justify-between gap-4">
          <Link
            to="/"
            className={cn(
              "group inline-flex items-center gap-2 rounded-sm text-sm font-medium text-panel-foreground/75 transition-colors hover:text-panel-foreground",
              focusRing,
            )}
          >
            {backLink}
          </Link>
          {/*
            Soat montajdan keyin paydo bo'ladi (server vaqti bilan farq
            qilmasligi uchun) — shu sababli joyi oldindan band qilinadi.
          */}
          <span className="min-w-18 text-right text-sm font-bold tabular-nums text-panel-foreground/75">
            {minute === null ? "" : formatClock(minute)}
          </span>
        </div>

        <div className="relative animate-[pop-in_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
          <span className="inline-flex rounded-2xl bg-panel-foreground px-4 py-3">
            <img
              src={logo}
              alt={t("common.appName")}
              width={160}
              height={80}
              className="h-9 w-auto"
            />
          </span>
          <p className="mt-7 max-w-md text-4xl font-extrabold leading-[1.1] xl:text-[2.75rem]">
            {t("auth.panelTitle")}
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-panel-foreground/70">
            {t("auth.panelSubtitle")}
          </p>
        </div>

        <div className="relative max-w-md">
          <DayRail minute={minute} />
        </div>

        <p className="relative shrink-0 text-xs text-panel-foreground/60">
          © {new Date().getFullYear()} {t("common.appName")}
        </p>
      </div>

      {/* O'ng ustun — forma. Fon iliq oq, ustida yumshoq brend nuri. */}
      <div className="relative flex items-center justify-center overflow-hidden p-6 md:p-10">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(900px_480px_at_70%_-10%,var(--brand-soft),transparent)]"
        />

        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between gap-3 lg:justify-end">
            <Link
              to="/"
              className={cn(
                "group inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden",
                focusRing,
              )}
            >
              {backLink}
            </Link>

            {/*
              Til tanlash — kirishdan oldin ham kerak: sahifadagi hamma matn
              shu tanlovga bog'liq. Ikki til uchun ro'yxat ochish ortiqcha,
              shuning uchun ikkita tugma.
            */}
            <div
              role="group"
              aria-label={t("common.language.switch")}
              className="inline-flex rounded-full border border-border bg-card p-0.5"
            >
              {LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  aria-pressed={language === code}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors",
                    focusRing,
                    language === code
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="animate-[pop-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.1s_both] rounded-3xl border border-border bg-card p-6 shadow-[0_28px_70px_-45px_var(--panel)] sm:p-8">
            {minute === null ? null : (
              <div className="mb-4 lg:hidden">
                <DayNowChip minute={minute} />
              </div>
            )}

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-ink">
              {t(greetingKey(minute))}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">{t("auth.loginTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>

            <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">{t("auth.loginField")}</Label>
                <Input
                  id="login"
                  autoComplete="username"
                  value={loginValue}
                  onChange={(event) => setLoginValue(event.target.value)}
                  className="h-12 rounded-xl"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyUp={trackCapsLock}
                    onKeyDown={trackCapsLock}
                    onBlur={() => setCapsLock(false)}
                    className="h-12 rounded-xl pr-12"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={passwordHints}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    className={cn(
                      "absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                      focusRing,
                    )}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsLock ? (
                  <p
                    id="caps-hint"
                    className="animate-[pop-in_0.3s_ease-out_both] text-xs font-semibold text-st-warn-fg"
                  >
                    {t("auth.capsLock")}
                  </p>
                ) : null}
              </div>

              {/*
                `role="alert"` — kirish rad etilganda xabar ekran o'quvchida
                darhol o'qiladi. Ranglar ilovadagi boshqa ogohlantirish
                bloklari bilan bir xil: `st-danger` toni va chegarasi.
                Bir martalik tebranish xatoni ko'rsatadi, uni takrorlamaydi.
              */}
              {error ? (
                <div
                  id="login-error"
                  role="alert"
                  className="flex animate-[shake_0.45s_ease-in-out_both] items-center gap-2 rounded-xl border border-st-danger-border bg-st-danger-soft px-3 py-2.5 text-sm text-st-danger-fg"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={busy}
                className="group relative h-12 w-full overflow-hidden rounded-full bg-brand text-base font-bold text-brand-foreground shadow-md hover:-translate-y-0.5 hover:bg-brand hover:shadow-xl"
              >
                {/* Kutish paytida tugma bo'ylab o'tadigan yorug'lik — jarayon davom etayotgani belgisi. */}
                {busy ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 w-16 animate-[sweep_1.2s_linear_infinite] bg-panel-foreground/15 blur-md"
                  />
                ) : null}
                <span className="relative">{busy ? t("auth.submitting") : t("auth.submit")}</span>
                {busy ? null : <ArrowRight className="relative h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-3 text-center">
              <ForgotPasswordDialog />
            </div>

            <p className="mt-5 flex items-start gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-st-ok-fg" />
              {t("auth.auditNote")}
            </p>
          </div>

          <RoleLegend />
        </div>
      </div>
    </div>
  );
}
