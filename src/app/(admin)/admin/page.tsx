import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F3DC]">
          <Shield className="h-5 w-5 text-[#1B4332]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Panel de Administración</h1>
          <p className="text-sm text-[#6B6560]">Gestiona verificaciones y usuarios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/admin/verificaciones">
          <div className="rounded-xl border border-[#E8E4DF] p-6 transition-all hover:border-[#52B788] hover:shadow-md">
            <h3 className="font-semibold text-[#1A1A1A]">Verificaciones de identidad</h3>
            <p className="mt-1 text-sm text-[#6B6560]">Revisa documentos y aprueba verificaciones</p>
          </div>
        </Link>
        <Link href="/admin/usuarios">
          <div className="rounded-xl border border-[#E8E4DF] p-6 transition-all hover:border-[#52B788] hover:shadow-md">
            <h3 className="font-semibold text-[#1A1A1A]">Gestión de usuarios</h3>
            <p className="mt-1 text-sm text-[#6B6560]">Administra roles, suspensiones y actividad</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
