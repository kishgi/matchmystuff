"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { FloatingAssets } from "@/components/FloatingAssets";
import { FormInput } from "@/components/FormInput";
import { Logo } from "@/components/Logo";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { fadeIn } from "@/lib/motion";
import { toastError, toastSuccess } from "@/lib/toast";

type AuthTab = "signIn" | "signUp";

export default function AuthPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [tab, setTab] = useState<AuthTab>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : COPY.auth.errorFallback;
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh)] flex-1 flex-col-reverse lg:flex-row">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10">
            <Logo height={56} priority />
          </div>
          <div className="mb-8 flex gap-8 border-b border-gray-100">
            {(["signIn", "signUp"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`pb-4 text-base font-semibold transition-colors ${tab === t ? "border-b-2" : "opacity-45 hover:opacity-70"}`}
                style={{ color: C.teal, borderColor: tab === t ? C.teal : "transparent" }}
              >
                {t === "signIn" ? COPY.auth.signInTab : COPY.auth.signUpTab}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              onSubmit={handleSubmit}
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={fadeIn.initial}
              transition={fadeIn.transition}
              className="space-y-5"
            >
              {tab === "signUp" && (
                <div>
                  <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                    {COPY.auth.name}
                  </label>
                  <FormInput name="name" required />
                </div>
              )}
              <div>
                <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                  {COPY.auth.email}
                </label>
                <FormInput name="email" type="email" required />
              </div>
              <div>
                <label className="mb-2 block text-base font-medium" style={{ color: C.slate }}>
                  {COPY.auth.password}
                </label>
                <FormInput name="password" type="password" required minLength={8} />
              </div>
              {error && (
                <p className="text-base" style={{ color: C.coral }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
                style={{ backgroundColor: C.teal }}
              >
                {COPY.auth.submit}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>

      <div
        className="relative hidden min-h-[320px] flex-1 overflow-hidden lg:flex lg:w-1/2"
        style={{
          background:" #FFF8E7",
        }}
      >
        <FloatingAssets />
        <div className="relative z-10 flex flex-col items-center justify-center px-12 text-center">
          {/* <Logo height={80} className="mb-10 drop-shadow-lg" /> */}
          <h2
            className="max-w-md text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: C.coralSoft }}
          >
            {COPY.auth.brandingHeadline}
          </h2>
          <p className="mt-5 max-w-sm text-lg leading-relaxed" style={{ color: C.slate }}>
            {COPY.auth.brandingSubtext}
          </p>
        </div>
      </div>
    </div>
  );
}
