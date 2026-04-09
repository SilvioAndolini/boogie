import { Star, MessageCircle, ShieldCheck, Crown } from 'lucide-react'

interface HostCardProps {
  nombre: string
  apellido: string
  avatar_url: string | null
  verificado: boolean
  plan_suscripcion: string
  bio: string | null
  ratingPromedio: number
  totalResenas: number
}

export function HostCard({
  nombre,
  apellido,
  avatar_url,
  verificado,
  plan_suscripcion,
  bio,
  ratingPromedio,
  totalResenas,
}: HostCardProps) {
  const isUltra = plan_suscripcion === 'ULTRA'
  const initials = `${nombre[0] || ''}${apellido[0] || ''}`
  const displayName = `${nombre} ${apellido}`

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        isUltra
          ? 'border-amber-300/50 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
          : 'border-[#D8F3DC] bg-gradient-to-br from-[#F0FDF4] via-[#F8FDF9] to-white'
      }`}
    >
      {isUltra && (
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200/40 via-yellow-300/30 to-orange-200/40 blur-xl" />
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
                  : 'bg-[#D8F3DC] text-[#1B4332] ring-2 ring-[#1B4332]/20'
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
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                isUltra
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 shadow-sm shadow-amber-200/50'
                  : 'bg-[#1B4332] text-white'
              }`}
            >
              {isUltra && <Crown className="h-2.5 w-2.5" />}
              {isUltra ? 'Ultra' : 'Free'}
            </span>
          </div>

          <p className="text-[11px] font-medium text-[#6B6560]">
            Anfitrión{isUltra ? ' destacado' : ''}
          </p>

          <div className="mt-1.5 flex items-center gap-3">
            {ratingPromedio > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[#F4A261] text-[#F4A261]" />
                <span className="text-xs font-semibold text-[#1A1A1A]">{ratingPromedio.toFixed(1)}</span>
                <span className="text-[10px] text-[#9E9892]">({totalResenas})</span>
              </div>
            )}
            {totalResenas > 0 && (
              <span className="text-[10px] text-[#9E9892]">
                {totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isUltra
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#B7E4C7]'
          }`}
          title="Enviar mensaje"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>

      {bio && (
        <p className="mt-3 text-[11px] leading-relaxed text-[#6B6560] line-clamp-3">
          {bio}
        </p>
      )}
    </div>
  )
}
