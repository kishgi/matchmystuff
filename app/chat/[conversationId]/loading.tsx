import { Skeleton } from "@/components/Skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col">
      <Skeleton className="h-16 shrink-0 rounded-none" />
      <div className="flex-1 space-y-4 p-4">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="ml-auto h-16 w-2/3" />
        <Skeleton className="h-16 w-2/3" />
      </div>
      <Skeleton className="h-16 shrink-0 rounded-none" />
    </div>
  );
}
