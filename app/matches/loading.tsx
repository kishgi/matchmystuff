import { Skeleton } from "@/components/Skeleton";

export default function MatchesLoading() {
  return (
    <div className="page-container">
      <Skeleton className="mb-12 h-10 w-48" />
      <div className="space-y-8">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
