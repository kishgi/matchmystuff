import type { ReactNode } from "react";

export function AdminTable({
  headers,
  children,
  emptyMessage,
}: {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div className="card-surface overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-semibold text-gray-600 md:px-5"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">{children}</tbody>
        </table>
      </div>
      {emptyMessage ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">
          {emptyMessage}
        </p>
      ) : null}
    </div>
  );
}
