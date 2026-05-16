"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useAction, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FloatingAssets } from "@/components/FloatingAssets";
import { StatsBar } from "@/components/StatsBar";
import { Logo } from "@/components/Logo";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { fadeInUp, inViewFadeInUp } from "@/lib/motion";
import type { MapPost } from "@/components/MapView";

const MapView = dynamic(
  () => import("@/components/MapView").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[220px] w-full rounded-2xl md:h-[320px]" />
    ),
  },
);

const stepIcons = [
  <svg key="camera" className="h-10 w-10" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>,
  <svg key="sparkles" className="h-10 w-10" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>,
  <svg key="bell" className="h-10 w-10" style={{ color: C.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>,
];

type FeedTab = "lost" | "found";

type SearchHit = {
  _id: Id<"posts">;
  type: "lost" | "found";
  title: string;
  location: string;
  createdAt: number;
  imageUrl: string;
  matched: boolean;
  userName: string;
};

export default function HomePage() {
  const { isAuthenticated } = useConvexAuth();
  const posts = useQuery(api.posts.getPosts, {});
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const userMatches = useQuery(
    api.matches.getMatchesForUser,
    isAuthenticated ? {} : "skip",
  );
  const semanticSearch = useAction(api.actions.semanticSearchPosts);
  const [tab, setTab] = useState<FeedTab>("lost");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState<SearchHit[] | null>(null);
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserCoords(null),
      { timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  const matchedPostIds = useMemo(() => {
    const ids = new Set<string>();
    if (!userMatches) return ids;
    for (const m of userMatches) {
      ids.add(m.postA._id);
      ids.add(m.postB._id);
    }
    return ids;
  }, [userMatches]);

  const mapPosts: MapPost[] = useMemo(() => {
    if (!posts) return [];
    return posts.map((p) => ({
      _id: p._id,
      type: p.type,
      title: p.title,
      location: p.location,
      imageUrl: p.imageUrl,
      userId: p.userId,
    }));
  }, [posts]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const localResults = useQuery(
    api.posts.searchPosts,
    debouncedQuery ? { query: debouncedQuery, type: tab } : "skip",
  );

  useEffect(() => {
    if (!debouncedQuery) {
      setSemanticResults(null);
      setSemanticSearching(false);
      return;
    }
    setSemanticSearching(true);
    let cancelled = false;
    void semanticSearch({ query: debouncedQuery, type: tab, limit: 24 })
      .then((results) => {
        if (!cancelled) setSemanticResults(results);
      })
      .catch(() => {
        if (!cancelled) setSemanticResults([]);
      })
      .finally(() => {
        if (!cancelled) setSemanticSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, tab, semanticSearch]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) {
      if (!posts) return [];
      return [...posts]
        .filter((p) => p.type === tab)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 6);
    }

    const byId = new Map<string, SearchHit>();
    for (const hit of semanticResults ?? []) {
      byId.set(hit._id, hit);
    }
    for (const hit of localResults ?? []) {
      if (!byId.has(hit._id)) {
        byId.set(hit._id, hit);
      }
    }
    return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, tab, debouncedQuery, semanticResults, localResults]);

  const isSearchActive = debouncedQuery.length > 0;
  const feedLoading = isSearchActive
    ? semanticSearching || localResults === undefined
    : posts === undefined;

  return (
    <>
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-28 md:py-32">
        <FloatingAssets />
        <motion.div
          className="relative z-10 mx-auto max-w-4xl text-center"
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={fadeInUp.transition}
        >
          <div className="mb-8 flex justify-center">
            <Logo height={64} priority />
          </div>
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            <span style={{ color: C.coral }}>{COPY.hero.line1}</span>
            <br />
            <span style={{ color: C.teal }}>{COPY.hero.line2}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: C.slate }}>
            {COPY.hero.subtext}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: C.slate, opacity: 0.9 }}>
            {COPY.hero.subtext2}
          </p>
          <p className="mt-6 text-sm font-medium tracking-wide" style={{ color: C.teal }}>
            {COPY.hero.trustLine}
          </p>
          <motion.div
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.15 }}
          >
            <Link href="/report/lost" className="btn-primary" style={{ backgroundColor: C.coral }}>
              {COPY.hero.lostCta}
            </Link>
            <Link href="/report/found" className="btn-primary" style={{ backgroundColor: C.sky }}>
              {COPY.hero.foundCta}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <StatsBar />

      <section className="page-container">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="mb-4" style={{ color: C.teal }}>
            {COPY.features.title}
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: C.slate }}>
            {COPY.features.subtitle}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {COPY.features.items.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="card-surface rounded-2xl border-l-4 p-7"
              style={{ borderLeftColor: i % 2 === 0 ? C.coral : C.sky }}
              {...inViewFadeInUp}
              transition={{ ...inViewFadeInUp.transition, delay: i * 0.08 }}
            >
              <h3 className="mb-3 font-semibold" style={{ color: C.teal }}>
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: C.slate }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="page-container pt-0">
        <div
          className="rounded-3xl px-8 py-12 md:px-14 md:py-16"
          style={{ backgroundColor: `${C.teal}08` }}
        >
          <h2 className="mb-5 text-center md:text-left" style={{ color: C.teal }}>
            {COPY.community.title}
          </h2>
          <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed md:mx-0 md:text-left" style={{ color: C.slate }}>
            {COPY.community.body}
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-center text-base leading-relaxed md:mx-0 md:text-left" style={{ color: C.slate, opacity: 0.9 }}>
            {COPY.community.body2}
          </p>
        </div>
      </section>

      <section className="page-container pt-0">
        <div className="mb-14 text-center">
          <h2 className="mb-3" style={{ color: C.teal }}>
            {COPY.howItWorks.title}
          </h2>
          <p className="text-lg" style={{ color: C.slate }}>
            {COPY.howItWorks.subtitle}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {COPY.howItWorks.steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="card-surface overflow-hidden rounded-2xl border-t-2 p-8"
              style={{ borderTopColor: C.sky }}
              {...inViewFadeInUp}
              transition={{ ...inViewFadeInUp.transition, delay: i * 0.1 }}
            >
              <span className="text-7xl font-bold" style={{ color: C.sky, opacity: 0.2 }}>
                {i + 1}
              </span>
              <div className="mb-5 mt-3">{stepIcons[i]}</div>
              <h3 className="font-semibold" style={{ color: C.teal }}>
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed" style={{ color: C.slate }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="page-container pt-0">
        <h2 className="mb-10" style={{ color: C.teal }}>
          {COPY.feed.title}
        </h2>
        <div className="mb-8">
          <MapView
            posts={mapPosts}
            userCoords={userCoords}
            matchedPostIds={matchedPostIds}
            currentUserId={(user?._id as string | undefined) ?? null}
          />
        </div>
        <div className="mb-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={COPY.feed.searchPlaceholder}
            className="input-field w-full max-w-xl"
            aria-label={COPY.feed.searchPlaceholder}
          />
        </div>
        <div className="mb-10 flex gap-8">
          <button
            type="button"
            onClick={() => setTab("lost")}
            className={`pb-2 rounded-none text-base font-semibold transition-all ${tab === "lost" ? "border-b-2" : "opacity-50 hover:opacity-80"}`}
            style={{ color: C.coral, borderColor: tab === "lost" ? C.coral : "transparent" }}
          >
            {COPY.feed.lostTab}
          </button>
          <button
            type="button"
            onClick={() => setTab("found")}
            className={`pb-2 rounded-none text-base font-semibold transition-all ${tab === "found" ? "border-b-2" : "opacity-50 hover:opacity-80"}`}
            style={{ color: C.sky, borderColor: tab === "found" ? C.sky : "transparent" }}
          >
            {COPY.feed.foundTab}
          </button>
        </div>
        {isSearchActive && feedLoading && (
          <p className="mb-4 text-sm" style={{ color: C.slate }}>
            {COPY.feed.searchLoading}
          </p>
        )}
        {isSearchActive && !feedLoading && filtered.length === 0 && (
          <p className="mb-4 text-sm" style={{ color: C.slate }}>
            {COPY.feed.searchEmpty}
          </p>
        )}
        <motion.div layout className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" key={`${tab}-${searchQuery}`}>
            {feedLoading
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

      <section className="mx-4 my-16 rounded-3xl p-12 text-center md:mx-6 md:p-16 lg:mx-8" style={{ backgroundColor: C.teal }}>
        <h2 className="text-white">{COPY.cta.headline}</h2>
        <p className="mt-4 text-lg md:text-xl" style={{ color: C.sky }}>
          {COPY.cta.subtext}
        </p>
        <motion.div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <Link href="/report/found" className="btn-primary" style={{ backgroundColor: C.coral }}>
            {COPY.cta.button}
          </Link>
          <Link
            href="/report/lost"
            className="rounded-full border-2 border-white/60 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            {COPY.cta.secondary}
          </Link>
        </motion.div>
      </section>
    </>
  );
}
