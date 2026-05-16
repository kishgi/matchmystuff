"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { C } from "@/lib/colors";
import { formatAdminDate, formatScore } from "@/lib/adminFormat";
import { useAdminArgs } from "@/lib/useAdminArgs";
import { toastError, toastSuccess } from "@/lib/toast";

export default function AdminMatchesPage() {
  const adminArgs = useAdminArgs();
  const matches = useQuery(api.admin.getAllMatches, adminArgs);
  const deleteMatch = useMutation(api.admin.deleteMatch);

  const handleDelete = async (matchId: Id<"matches">) => {
    if (adminArgs === "skip") return;
    try {
      await deleteMatch({ ...adminArgs, matchId });
      toastSuccess("Match deleted");
    } catch {
      toastError("Failed to delete match");
    }
  };

  return (
    <AdminShell title="Matches">
      <AdminTable
        headers={["Lost post", "Found post", "Score", "Created", ""]}
        emptyMessage={matches?.length === 0 ? "No matches yet" : undefined}
      >
        {matches?.map((match) => {
          const lostTitle =
            match.postAType === "lost" ? match.postATitle : match.postBTitle;
          const foundTitle =
            match.postAType === "found" ? match.postATitle : match.postBTitle;
          const lostId =
            match.postAType === "lost" ? match.postA : match.postB;
          const foundId =
            match.postAType === "found" ? match.postA : match.postB;

          return (
            <tr key={match._id}>
              <td className="px-4 py-3 md:px-5">
                <Link
                  href={`/post/${lostId}`}
                  className="font-medium hover:underline"
                  style={{ color: C.coral }}
                >
                  {lostTitle}
                </Link>
              </td>
              <td className="px-4 py-3 md:px-5">
                <Link
                  href={`/post/${foundId}`}
                  className="font-medium hover:underline"
                  style={{ color: C.sky }}
                >
                  {foundTitle}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-sm md:px-5">
                {formatScore(match.score)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500 md:px-5">
                {formatAdminDate(match.createdAt)}
              </td>
              <td className="px-4 py-3 text-right md:px-5">
                <DeleteButton onConfirm={() => handleDelete(match._id)} />
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </AdminShell>
  );
}
