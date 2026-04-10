import { MessageCircle, ShieldCheck, Crown } from 'lucide-react'
import { GoldStar } from '@/components/ui/gold-star'

interface HostCardProps {
  nombre: string
  apellido: string
  avatar_url: string | null
  verificado: boolean
  plan_suscripcion: string
  bio: string | null
  reputacion: number | null
  reputacionManual: boolean
}

export function HostCard({
  nombre,
  apellido,
  avatar_url,
  verificado,
  plan_suscripcion,
  bio,
  reputacion,
}: HostCardProps) {
  const isUltra = plan_suscripcion === 'ULTRA'
  const initials = `${nombre[0] || ''}${apellido[0] || ''}`
  const displayName = `${nombre} ${apellido}`
  const rating = reputacion ?? 0

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        isUltra
          ? 'ultra-shine-card border-amber-300/50 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
          : 'border-[#E8E4DF] bg-gradient-to-br from-[#F0FDF4] via-white to-[#FAFDF7]'
      }`}
    >
      {isUltra && (
        <>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200/40 via-yellow-300/30 to-orange-200/40 blur-xl" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-300/20" />
        </>
      )}

      <div className="relative flex items-start gap-4">
        <div className="relative shrink-0">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={displayName}
              className={`h-14 w-14 rounded-full object-cover ring-2 ${
                isUltra ? 'ring-amber-300/60' : 'ring-[#1B4332]/20'
              }`}
            />
          ) : (
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold ${
                isUltra
                  ? 'bg-gradient-to-br from-amber-200 to-yellow-300 text-amber-800 ring-2 ring-amber-300/60'
                  : 'bg-gradient-to-br from-[#1B4332] to-[#40916C] text-white ring-2 ring-[#1B4332]/20'
              }`}
            >
              {initials}
            </div>
          )}
          {verificado && (
            <div className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ${isUltra ? 'bg-amber-400' : 'bg-[#1B4332]'}`}>
              <ShieldCheck className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-[#1A1A1A]">{displayName}</h3>
            {isUltra && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, #D4A017, #F5D060, #D4A017)',
                  color: '#3D2E00',
                  textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                  boxShadow: '0 1px 2px rgba(212,160,23,0.3)',
                  border: '1px solid rgba(212,160,23,0.4)',
                }}
              >
                <Crown className="h-2.5 w-2.5" />
                Ultra
              </span>
            )}
          </div>

          <p className="text-[11px] font-medium text-[#9E9892]">Anfitrión</p>

          <div className="mt-2 flex items-center gap-2">
            <GoldStar size={16} rating={rating} showValue />
            <div className="h-3 w-px bg-[#E8E4DF]" />
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                isUltra
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#B7E4C7]'
              }`}
              title="Enviar mensaje al anfitrión"
            >
              <MessageCircle className="h-3 w-3" />
              Mensaje
            </button>
          </div>
        </div>
      </div>

      {bio && (
        <p className="mt-3 border-t border-[#E8E4DF]/50 pt-3 text-[11px] leading-relaxed text-[#6B6560] line-clamp-3">
          {bio}
        </p>
      )}
    </div>
  )
}
