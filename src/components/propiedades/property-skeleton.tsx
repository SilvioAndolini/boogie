'use client'

export function PropertySkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-2xl border border-[#E8E4DF] bg-white p-2.5"
      style={{ animation: `skeletonFadeIn 0.5s ease-out ${delay}ms both` }}
    >
      <div className="skeleton aspect-[3/4] rounded-xl" />
      <div className="pt-2.5 pb-1">
        <div className="skeleton mb-1.5 h-3.5 w-3/4 rounded-md" />
        <div className="flex items-center gap-1">
          <div className="skeleton h-2.5 w-2.5 rounded-full" />
          <div className="skeleton h-2.5 w-1/2 rounded-md" />
        </div>
        <div className="mt-2">
          <div className="skeleton h-3.5 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function PropertySkeletonGrid({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: cantidad }).map((_, i) => (
        <PropertySkeleton key={i} delay={i * 60} />
      ))}
    </div>
  )
}

export function PropertyPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      <section className="border-b border-[#E8E4DF] bg-white py-6">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="skeleton h-11 flex-1 rounded-xl" />
            <div className="skeleton hidden h-11 w-28 rounded-xl sm:block" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <div
          className="mb-5 flex items-center justify-between"
          style={{ animation: 'skeletonFadeIn 0.4s ease-out 0.1s both' }}
        >
          <div className="skeleton h-6 w-48 rounded-md" />
          <div className="skeleton h-4 w-24 rounded-md" />
        </div>
        <div className="flex flex-col xl:flex-row xl:items-start gap-8">
          <div className="flex-1">
            <PropertySkeletonGrid />
          </div>
          <div className="hidden xl:block xl:w-[450px] xl:shrink-0">
            <div
              className="skeleton sticky top-6 h-[650px] rounded-xl"
              style={{ animation: 'skeletonFadeIn 0.6s ease-out 0.3s both' }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
