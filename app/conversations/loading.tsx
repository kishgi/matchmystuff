import { Skeleton } from "@/components/Skeleton";

export default function ConversationsLoading() {
  return (
    <div className="page-container max-w-2xl">
      <Skeleton className="mb-8 h-10 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
