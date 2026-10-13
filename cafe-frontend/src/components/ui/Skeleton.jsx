import React from 'react'

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-mint-200 rounded-lg ${className}`}
      aria-hidden="true"
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-pine-200 shadow-warm-sm flex flex-col justify-between h-56 animate-pulse">
      <div>
        <div className="flex justify-between items-start gap-3">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mt-3 rounded-md" />
        <Skeleton className="h-4 w-2/3 mt-2 rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t-2 border-pine-200 mt-4">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}
