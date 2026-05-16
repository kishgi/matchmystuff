"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdminSession } from "@/components/admin/AdminSessionProvider";
import { C } from "@/lib/colors";
import { toastError, toastSuccess } from "@/lib/toast";

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1B5E78]/20 focus:border-[#1B5E78]";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setToken } = useAdminSession();
  const login = useMutation(api.adminAuth.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const { token } = await login({
        email: form.get("email") as string,
        password: form.get("password") as string,
      });
      setToken(token);
      toastSuccess("Admin signed in");
      router.push("/admin");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid credentials";
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="card-surface w-full max-w-md rounded-2xl p-8">
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="MatchMyStuff"
            width={140}
            height={36}
            className="mx-auto h-9 w-auto"
          />
          <h1 className="mt-6 text-2xl font-bold" style={{ color: C.teal }}>
            Admin sign in
          </h1>
          <p className="mt-2 text-sm" style={{ color: C.slate }}>
            Use your admin credentials from the Convex dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: C.slate }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: C.slate }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          {error ? (
            <p className="text-sm" style={{ color: C.coral }}>
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ backgroundColor: C.teal }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="hover:underline" style={{ color: C.sky }}>
            ← Back to app
          </Link>
        </p>
      </div>
    </div>
  );
}
