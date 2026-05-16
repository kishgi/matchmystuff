"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { COPY } from "@/lib/copy";
import { toastError, toastSuccess } from "@/lib/toast";

type AuthTab = "signIn" | "signUp";

const itemCards = [
  {
    rotate: "-rotate-3",
    translate: "",
    icon: (
      <svg className="h-8 w-8 shrink-0 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M5.25 7.5h13.5" />
      </svg>
    ),
    title: "Black Backpack",
    meta: "Lost · Colombo Fort",
    badge: "Lost",
    badgeBg: "#F47C5D",
  },
  {
    rotate: "rotate-[2deg]",
    translate: "translate-y-2",
    icon: (
      <svg className="h-8 w-8 shrink-0 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 01-2.25 2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 013 12V6a3 3 0 013-3h12a3 3 0 013 3v6z" />
      </svg>
    ),
    title: "Brown Wallet",
    meta: "Found · Pettah",
    badge: "Found",
    badgeBg: "#4AB9E2",
  },
  {
    rotate: "-rotate-1",
    translate: "translate-y-4",
    icon: (
      <svg className="h-8 w-8 shrink-0 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "Blue Headphones",
    meta: "Matched! · Nugegoda",
    badge: "Matched",
    badgeBg: "#4ade80",
  },
] as const;

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#333F48] focus:outline-none focus:ring-2 focus:ring-[#4AB9E2]";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const { signIn } = useAuthActions();
  const [tab, setTab] = useState<AuthTab>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const parseAuthError = (err: unknown, isSignUp: boolean) => {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    if (msg.includes("already") || msg.includes("exists")) {
      return COPY.auth.emailExists;
    }
    if (msg.includes("password") || msg.includes("invalid") || msg.includes("credentials")) {
      return COPY.auth.wrongPassword;
    }
    return isSignUp ? COPY.auth.errorFallback : COPY.auth.wrongPassword;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      if (tab === "signUp") {
        await signIn("password", {
          name: form.get("name") as string,
          email: form.get("email") as string,
          password: form.get("password") as string,
          flow: "signUp",
        });
        toastSuccess(COPY.toast.authSignUpSuccess);
      } else {
        await signIn("password", {
          email: form.get("email") as string,
          password: form.get("password") as string,
          flow: "signIn",
        });
        toastSuccess(COPY.toast.authSignInSuccess);
      }
      router.push(redirectTo.startsWith("/") ? redirectTo : "/");
    } catch (err) {
      const message = parseAuthError(err, tab === "signUp");
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = () => {
    setTab(tab === "signIn" ? "signUp" : "signIn");
    setError(null);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full flex-col bg-white md:w-[40%]"
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 ml-6 flex items-center gap-1 text-sm text-[#333F48] transition-colors hover:text-[#1B5E78]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {COPY.auth.backHome}
        </button>

        <div className="flex flex-1 flex-col justify-center px-6 py-6 sm:px-10 md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <Image
              src="/logo.png"
              alt=""
              width={140}
              height={36}
              className="mb-8 h-9 w-auto"
              priority
            />

            <h1 className="text-3xl font-bold tracking-tight text-[#1B5E78]">
              {tab === "signIn" ? COPY.auth.welcomeBack : COPY.auth.welcomeSignUp}
            </h1>
            <p className="mb-8 mt-2 text-sm text-[#333F48]">
              {tab === "signIn" ? COPY.auth.signInSubtext : COPY.auth.signUpSubtext}
            </p>

            <div className="mb-6 flex gap-6 border-b border-gray-100">
              {(["signIn", "signUp"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setError(null);
                  }}
                  className={`rounded-none pb-3 text-sm transition-colors ${
                    tab === t
                      ? "border-b-2 border-[#1B5E78] font-semibold text-[#1B5E78]"
                      : "text-[#333F48] opacity-50"
                  }`}
                >
                  {t === "signIn" ? COPY.auth.signInTab : COPY.auth.signUpTab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {tab === "signUp" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#333F48]">
                      {COPY.auth.name}
                    </label>
                    <input name="name" required className={inputClass} />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#333F48]">
                    {COPY.auth.email}
                  </label>
                  <input name="email" type="email" required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#333F48]">
                    {COPY.auth.password}
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      className={`${inputClass} pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#4AB9E2]"
                    >
                      {showPassword ? COPY.auth.hidePassword : COPY.auth.showPassword}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="mt-2 text-sm text-[#F47C5D]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#1B5E78] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {COPY.auth.submit}
                </button>

                <p className="text-center text-sm text-[#333F48]">
                  {tab === "signIn" ? COPY.auth.noAccount : COPY.auth.hasAccount}{" "}
                  <button
                    type="button"
                    onClick={switchTab}
                    className="text-[#4AB9E2] hover:underline"
                  >
                    {tab === "signIn" ? COPY.auth.signUpTab : COPY.auth.signInTab}
                  </button>
                </p>
              </motion.form>
            </AnimatePresence>

            <p className="mt-8 text-center text-xs text-[#333F48] opacity-50">
              {COPY.auth.termsFooter}{" "}
              <Link href="/terms" className="underline hover:opacity-80">
                {COPY.auth.termsLink}
              </Link>{" "}
              {COPY.auth.and}{" "}
              <Link href="/privacy" className="underline hover:opacity-80">
                {COPY.auth.privacyLink}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="relative hidden h-full w-[60%] overflow-hidden bg-[#1B5E78] md:flex"
      >
        <div
          className="absolute top-[-80px] right-[-80px] h-[400px] w-[400px] rounded-full bg-[#4AB9E2] opacity-10"
          aria-hidden
        />
        <div
          className="absolute bottom-[-100px] left-[-60px] h-[350px] w-[350px] rounded-full bg-[#F47C5D] opacity-10"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12">
          <h2 className="max-w-md text-4xl font-bold leading-snug tracking-tight text-white">
            {COPY.auth.quote}
          </h2>
          <p className="mt-4 max-w-sm text-base text-white/70">
            {COPY.auth.quoteSubtext}
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[COPY.auth.statRecovered, COPY.auth.statAccuracy, COPY.auth.statMatch].map(
              (stat) => (
                <span
                  key={stat}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
                >
                  {stat}
                </span>
              ),
            )}
          </div>

          <div className="mt-16 w-full max-w-md space-y-0">
            {itemCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                className={`flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur ${card.rotate} ${card.translate}`}
              >
                {card.icon}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{card.title}</p>
                  <p className="text-xs text-white/60">{card.meta}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-xs text-white"
                  style={{ backgroundColor: card.badgeBg }}
                >
                  {card.badge}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
