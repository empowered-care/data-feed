import { Skeleton } from "@/components/ui/skeleton";

export default function SplashScreen() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col w-64 border-r border-border p-4 space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopNav Skeleton */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-48 md:hidden" />
            <Skeleton className="hidden md:block h-6 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* Content Area Skeleton */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Metrics Skeleton */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-xl p-5 border border-border/50">
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-card rounded-xl p-5 border border-border/50 h-[320px]">
              <Skeleton className="h-6 w-32 mb-6" />
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
            <div className="glass-card rounded-xl p-5 border border-border/50 h-[320px]">
              <Skeleton className="h-6 w-32 mb-6" />
              <div className="flex justify-center items-center h-48">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="glass-card rounded-xl overflow-hidden border border-border/50">
            <div className="p-5 border-b border-border">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
