import { C } from "@/lib/colors";

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-6">
      <p className="text-sm font-medium" style={{ color: C.slate, opacity: 0.7 }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
