'use client'

import { motion } from 'framer-motion'
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AdminStatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: { value: number; label: string }
  color?: 'green' | 'orange' | 'blue' | 'purple' | 'red'
}

const COLOR_MAP = {
  green: { bg: 'bg-[#D8F3DC]', icon: 'text-[#1B4332]' },
  orange: { bg: 'bg-[#FEF3C7]', icon: 'text-[#92400E]' },
  blue: { bg: 'bg-[#E0F2FE]', icon: 'text-[#0369A1]' },
  purple: { bg: 'bg-[#F3E8FF]', icon: 'text-[#7C3AED]' },
  red: { bg: 'bg-[#FEE2E2]', icon: 'text-[#C1121F]' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export function AdminStatCard({ icon: Icon, label, value, trend, color = 'green' }: AdminStatCardProps) {
  const colors = COLOR_MAP[color]

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <div className="rounded-xl border border-[#E8E4DF] bg-white p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.value > 0
                ? 'bg-[#D8F3DC] text-[#1B4332]'
                : trend.value < 0
                  ? 'bg-[#FEE2E2] text-[#C1121F]'
                  : 'bg-[#F8F6F3] text-[#6B6560]'
            }`}>
              {trend.value > 0 ? <TrendingUp className="h-3 w-3" /> : trend.value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
          <p className="text-xs text-[#6B6560]">{label}</p>
        </div>
        {trend && (
          <p className="mt-1 text-[10px] text-[#9E9892]">{trend.label}</p>
        )}
      </div>
    </motion.div>
  )
}
