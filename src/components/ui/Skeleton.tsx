"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-800 rounded",
        className
      )} 
    />
  );
};

export const AssetCardSkeleton = () => {
  return (
    <div className="premium-card p-6 h-[280px] flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="w-16 h-4 rounded-full" />
          <Skeleton className="w-32 h-6" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-48 h-10" />
      </div>
      <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
        <Skeleton className="w-10 h-3 mb-2" />
        <Skeleton className="w-24 h-6" />
      </div>
    </div>
  );
};

export const NewsItemSkeleton = () => {
  return (
    <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="w-16 h-4 rounded-full" />
        <Skeleton className="w-20 h-4" />
      </div>
      <Skeleton className="w-full h-5" />
      <Skeleton className="w-3/4 h-4" />
      <div className="flex gap-4">
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-12 h-3" />
      </div>
    </div>
  );
};
