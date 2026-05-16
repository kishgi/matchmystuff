"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { fadeInUp, inViewFadeInUp } from "@/lib/motion";

const heroCircles = [
  { size: 280, color: C.coral, left: "8%", top: "12%", duration: 10 },
  { size: 200, color: C.sky, left: "72%", top: "18%", duration: 12 },
  { size: 160, color: C.coral, left: "55%", top: "55%", duration: 9 },
  { size: 240, color: C.sky, left: "20%", top: "62%", duration: 14 },
  { size: 120, color: C.coral, left: "80%", top: "70%", duration: 8 },
  { size: 180, color: C.sky, left: "40%", top: "28%", duration: 11 },
] as const;

const stats = [
  COPY.stats.recovered,
  COPY.stats.accuracy,
  COPY.stats.response,
] as const;

const stepIcons = [
  <svg key="camera" className="h-8 w-8" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>,
  <svg key="sparkles" className="h-8 w-8" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>,
  <svg key="bell" className="h-8 w-8" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>,
];

type FeedTab = "lost" | "found";

export default function HomePage() {
  const posts = useQuery(api.posts.getPosts, {});
  const [tab, setTab] = useState<FeedTab>("lost");

  const filtered = useMemo(() => {
    if (!posts) return [];
    return [...posts]
      .filter((p) => p.type === tab)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6);
  }, [posts, tab]);

  return (
    <>
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24">
        {heroCircles.map((circle, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              width: circle.size,
              height: circle.size,
              left: circle.left,
              top: circle.top,
              backgroundColor: circle.color,
              opacity: 0.1,
            }}
            animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
            transition={{ duration: circle.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <motion.div
          className="relative z-10 mx-auto max-w-3xl text-center"
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={fadeInUp.transition}
        >
          <h1 className="text-5xl font-bold tracking-tight">
            <span style={{ color: C.coral }}>{COPY.hero.line1}</span>
            <br />
            <span style={{ color: C.teal }}>{COPY.hero.line2}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg" style={{ color: C.slate }}>
            {COPY.hero.subtext}
          </p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.15 }}
          >
            <Link
              href="/report/lost"
              className="rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.coral }}
            >
              {COPY.hero.lostCta}
            </Link>
            <Link
              href="/report/found"
              className="rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.sky }}
            >
              {COPY.hero.foundCta}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-4" style={{ backgroundColor: C.teal }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center text-white sm:flex-row sm:gap-0">
          {stats.map((stat, i) => (
            <div key={stat} className="flex flex-1 items-center justify-center gap-4 sm:px-6">
              {i > 0 && <span className="hidden h-6 w-px bg-white/30 sm:block" aria-hidden />}
              <p className="text-sm font-medium sm:text-base">{stat}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: C.teal }}>
          {COPY.howItWorks.title}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {COPY.howItWorks.steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="rounded-2xl border-t-2 bg-white p-6"
              style={{ borderTopColor: C.sky }}
              {...inViewFadeInUp}
              transition={{ ...inViewFadeInUp.transition, delay: i * 0.1 }}
            >
              <span className="text-6xl font-bold" style={{ color: C.sky, opacity: 0.2 }}>
                {i + 1}
              </span>
              <div className="mb-4 mt-2">{stepIcons[i]}</div>
              <h3 className="text-lg font-semibold" style={{ color: C.teal }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: C.slate }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-3xl font-bold" style={{ color: C.teal }}>
          {COPY.feed.title}
        </h2>
        <div className="mb-8 flex gap-6">
          <button
            type="button"
            onClick={() => setTab("lost")}
            className={`pb-1 text-sm font-semibold transition-colors ${tab === "lost" ? "border-b-2" : "opacity-60"}`}
            style={{ color: C.coral, borderColor: tab === "lost" ? C.coral : "transparent" }}
          >
            {COPY.feed.lostTab}
          </button>
          <button
            type="button"
            onClick={() => setTab("found")}
            className={`pb-1 text-sm font-semibold transition-colors ${tab === "found" ? "border-b-2" : "opacity-60"}`}
            style={{ color: C.sky, borderColor: tab === "found" ? C.sky : "transparent" }}
          >
            {COPY.feed.foundTab}
          </button>
        </div>
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {posts === undefined
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)
              : filtered.map((post) => (
                  <motion.div key={post._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PostCard
                      _id={post._id}
                      type={post.type}
                      title={post.title}
                      location={post.location}
                      createdAt={post.createdAt}
                      imageUrl={post.imageUrl}
                      matched={post.matched}
                      userName={post.userName}
                    />
                  </motion.div>
                ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="mx-4 my-12 rounded-3xl p-12 text-center" style={{ backgroundColor: C.teal }}>
        <h2 className="text-3xl font-bold text-white">{COPY.cta.headline}</h2>
        <p className="mt-3 text-lg" style={{ color: C.sky }}>
          {COPY.cta.subtext}
        </p>
        <Link
          href="/report/found"
          className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: C.coral }}
        >
          {COPY.cta.button}
        </Link>
      </section>
    </>
  );
}
