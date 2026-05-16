"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { C } from "@/lib/colors";
import { useAdminArgs } from "@/lib/useAdminArgs";

export default function AdminDashboardPage() {
  const adminArgs = useAdminArgs();
  const stats = useQuery(api.admin.getStats, adminArgs);

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={stats?.totalUsers ?? "—"}
          accent={C.teal}
        />
        <StatCard
          label="Total posts"
          value={stats?.totalPosts ?? "—"}
          accent={C.coral}
        />
        <StatCard
          label="Total matches"
          value={stats?.totalMatches ?? "—"}
          accent={C.sky}
        />
      </div>
    </AdminShell>
  );
}
