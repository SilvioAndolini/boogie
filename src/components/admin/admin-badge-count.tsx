'use client'

interface AdminBadgeCountProps {
  count: number
}

export function AdminBadgeCount({ count }: AdminBadgeCountProps) {
  if (count <= 0) return null
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E76F51] px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}
