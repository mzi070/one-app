"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// ─── Base Skeleton ───────────────────────────────────────────────────────────────────
export function Skeleton({ className }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
    />
  );
}

// ─── Card Skeleton ────────────────────────────────────────────────────────────────
export function CardSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

// ─── Table Skeleton ────────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5 }: { rows?: number }): React.ReactElement {
  return (
    <div className="space-y-2">
      <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 border-t">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── List Skeleton ────────────────────────────────────────────────────────
export function ListSkeleton({ items = 4 }: { items?: number }): React.ReactElement {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Form Skeleton ────────────────────────────────────────────────────────
export function FormSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4 p-6 bg-white rounded-xl border">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

// ─── Chart Skeleton ────────────────────────────────────────────────────────────
export function ChartSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card Skeleton ────────────────────────────────────────────────────────
export function StatCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// ─── Grid Skeleton ────────────────────────────────────────────────────────────────
export function GridSkeleton({
  cols = 4,
  rows = 3,
}: {
  cols?: number;
  rows?: number;
}): React.ReactElement {
  return (
    <div
      className={cn("grid", cols === 2 && "grid-cols-2", cols === 3 && "grid-cols-3", cols === 4 && "grid-cols-4")}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Modal Skeleton ────────────────────────────────────────────────────────
export function ModalSkeleton(): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}

// ─── Page Skeleton ───────────────────────────────��────────────────────────────
export function PageSkeleton(): React.ReactElement {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <GridSkeleton cols={4} rows={2} />
      <TableSkeleton rows={6} />
    </div>
  );
}