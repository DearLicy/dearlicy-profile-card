import { Skeleton } from "@/components/ui/skeleton";

export default function CardStudioLoading() {
  return (
    <main className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
      <div>
        <Skeleton className="mb-5 h-8 w-48" />
        <Skeleton className="aspect-[920/1360] w-full max-w-[820px] rounded-2xl" />
      </div>
      <Skeleton className="hidden h-[560px] rounded-2xl lg:block" />
    </main>
  );
}
