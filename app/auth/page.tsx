"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { Logo } from "@/components/Logo";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { fadeIn } from "@/lib/motion";

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
      } else {
        await signIn("password", {
          email: form.get("email") as string,
          password: form.get("password") as string,
          flow: "signIn",
        });
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY.auth.errorFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <Logo height={40} />
        </div>
        <div className="mb-8 flex border-b border-gray-100">
          {(["signIn", "signUp"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${tab === t ? "border-b-2" : "opacity-50"}`}
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
            className="space-y-4"
          >
            {tab === "signUp" && (
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: C.slate }}>
                  {COPY.auth.name}
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#1B5E78]"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: C.slate }}>
                {COPY.auth.email}
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#1B5E78]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: C.slate }}>
                {COPY.auth.password}
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#1B5E78]"
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: C.coral }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: C.teal }}
            >
              {COPY.auth.submit}
            </button>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
