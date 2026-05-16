"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/Skeleton";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { fadeInUp } from "@/lib/motion";

export default function MatchesPage() {
  const matches = useQuery(api.matches.getMatchesForUser);
  const markMatchSeen = useMutation(api.matches.markMatchSeen);

  useEffect(() => {
    if (!matches) return;
    for (const match of matches) {
      if (!match.seen) void markMatchSeen({ matchId: match._id });
    }
  }, [matches, markMatchSeen]);

  return (
    <div className="page-container">
      <h1 className="mb-12" style={{ color: C.teal }}>
        {COPY.matches.title}
      </h1>
      {matches === undefined ? (
        <div className="space-y-8">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div
            className="mb-8 h-44 w-44 rounded-full opacity-20"
            style={{ backgroundColor: C.sky }}
          />
          <p className="max-w-md text-lg leading-relaxed md:text-xl" style={{ color: C.slate }}>
            {COPY.matches.empty}
          </p>
        </div>
      ) : (
        <ul className="space-y-10">
          {matches.map((match, i) => {
            const contactEmail =
              match.postA.contactEmail || match.postB.contactEmail;
            return (
              <motion.li
                key={match._id}
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={{ ...fadeInUp.transition, delay: i * 0.08 }}
                className="card-surface overflow-hidden rounded-2xl border-2 p-5 md:p-8"
                style={{ borderColor: C.teal }}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <span className="rounded-full bg-green-500 px-4 py-1.5 text-base font-semibold text-white">
                    {Math.round(match.score * 100)}% {COPY.matches.scoreLabel}
                  </span>
                  <Link
                    href={`/matches/${match._id}`}
                    className="text-base font-medium transition-colors hover:underline hover:underline-offset-4"
                    style={{ color: C.teal }}
                  >
                    {COPY.postCard.viewMatch}
                  </Link>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <PostCard
                    _id={match.postA._id}
                    type={match.postA.type}
                    title={match.postA.title}
                    location={match.postA.location}
                    createdAt={match.postA.createdAt}
                    imageUrl={match.postA.imageUrl}
                    matched={match.postA.matched}
                    userName={match.postA.userName}
                    matchHref={`/matches/${match._id}`}
                  />
                  <PostCard
                    _id={match.postB._id}
                    type={match.postB.type}
                    title={match.postB.title}
                    location={match.postB.location}
                    createdAt={match.postB.createdAt}
                    imageUrl={match.postB.imageUrl}
                    matched={match.postB.matched}
                    userName={match.postB.userName}
                    matchHref={`/matches/${match._id}`}
                  />
                </div>
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="btn-primary mt-6"
                    style={{ backgroundColor: C.teal }}
                  >
                    {COPY.matches.contact}
                  </a>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
