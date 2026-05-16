"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { formatAdminDate } from "@/lib/adminFormat";
import { useAdminArgs } from "@/lib/useAdminArgs";
import { toastError, toastSuccess } from "@/lib/toast";

export default function AdminUsersPage() {
  const adminArgs = useAdminArgs();
  const [cascadePosts, setCascadePosts] = useState(true);
  const users = useQuery(api.admin.getAllUsers, adminArgs);
  const deleteUser = useMutation(api.admin.deleteUser);

  const handleDelete = async (userId: Id<"users">) => {
    if (adminArgs === "skip") return;
    try {
      await deleteUser({ ...adminArgs, userId, cascadePosts });
      toastSuccess("User deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete user";
      toastError(msg);
    }
  };

  return (
    <AdminShell title="Users">
      <label className="mb-6 flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={cascadePosts}
          onChange={(e) => setCascadePosts(e.target.checked)}
          className="rounded border-gray-300"
        />
        Cascade delete user posts
      </label>

      <AdminTable
        headers={["Email", "Name", "Joined", ""]}
        emptyMessage={users?.length === 0 ? "No users found" : undefined}
      >
        {users?.map((user) => (
          <tr key={user._id}>
            <td className="px-4 py-3 font-medium md:px-5">{user.email}</td>
            <td className="px-4 py-3 md:px-5">{user.name || "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-gray-500 md:px-5">
              {formatAdminDate(user.createdAt)}
            </td>
            <td className="px-4 py-3 text-right md:px-5">
              <DeleteButton onConfirm={() => handleDelete(user._id)} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </AdminShell>
  );
}
