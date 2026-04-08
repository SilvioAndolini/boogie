'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users as UsersIcon, Search, Loader2, Shield, Eye, EyeOff, ChevronDown, ChevronUp, UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getUsuariosAdmin, actualizarRolUsuario } from '@/actions/verificacion.actions'
import { RegistrarUsuarioModal } from '@/components/admin'

interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono: string | null
  cedula: string | null
  verificado: boolean
  rol: 'HUESPED' | 'ANFITRION' | 'AMBOS' | 'ADMIN'
  activo: boolean
  fecha_registro: string
}

const ROL_LABELS: Record<string, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
  AMBOS: 'Ambos',
  ADMIN: 'Admin',
}

const ROL_COLORS: Record<string, string> = {
  HUESPED: 'bg-[#E0F2FE] text-[#0369A1]',
  ANFITRION: 'bg-[#D8F3DC] text-[#1B4332]',
  AMBOS: 'bg-[#FEF9E7] text-[#B8860B]',
  ADMIN: 'bg-[#F3E8FF] text-[#7C3AED]',
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('TODOS')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false)

  useEffect(() => {
    let cancelled = false
    getUsuariosAdmin().then((res) => {
      if (cancelled) return
      console.log('[AdminUsuarios] Respuesta:', res)
      if (res.error) {
        toast.error(res.error)
      } else if (res.usuarios) {
        setUsuarios(res.usuarios as Usuario[])
      }
      setCargando(false)
    }).catch((err) => {
      console.error('[AdminUsuarios] Error cargando usuarios:', err)
      toast.error('Error inesperado cargando usuarios')
      setCargando(false)
    })
    return () => { cancelled = true }
  }, [])

  const cargarUsuarios = async () => {
    const res = await getUsuariosAdmin()
    if (res.error) {
      toast.error(res.error)
    } else if (res.usuarios) {
      setUsuarios(res.usuarios as Usuario[])
    }
  }

  const handleActualizarRol = async (usuarioId: string, rol: string) => {
    setActualizando(usuarioId)
    const formData = new FormData()
    formData.append('usuarioId', usuarioId)
    formData.append('rol', rol)

    const res = await actualizarRolUsuario(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Rol actualizado')
      await cargarUsuarios()
    }
    setActualizando(null)
  }

  const handleToggleActivo = async (usuarioId: string, activoActual: boolean) => {
    setActualizando(usuarioId)
    const formData = new FormData()
    formData.append('usuarioId', usuarioId)
    formData.append('activo', String(!activoActual))

    const res = await actualizarRolUsuario(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(activoActual ? 'Usuario suspendido' : 'Usuario reactivado')
      await cargarUsuarios()
    }
    setActualizando(null)
  }

  const filtrados = usuarios.filter((u) => {
    if (filtroRol !== 'TODOS' && u.rol !== filtroRol) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.apellido.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.cedula || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F3DC]">
          <UsersIcon className="h-5 w-5 text-[#1B4332]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Gestión de usuarios</h1>
          <p className="text-sm text-[#6B6560]">{usuarios.length} usuarios registrados</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <Input
            placeholder="Buscar por nombre, email o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-[#E8E4DF] pl-10"
          />
        </div>
        <Button
          onClick={() => setModalRegistroAbierto(true)}
          className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar usuario
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {['TODOS', 'HUESPED', 'ANFITRION', 'AMBOS', 'ADMIN'].map((r) => (
            <Button
              key={r}
              variant={filtroRol === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroRol(r)}
              className={filtroRol === r ? 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]' : 'border-[#E8E4DF] text-[#6B6560]'}
            >
              {r === 'TODOS' ? 'Todos' : ROL_LABELS[r]}
            </Button>
          ))}
      </div>

      <div className="space-y-3">
        {filtrados.map((u) => {
          const expandidoCurrent = expandido === u.id
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`border-[#E8E4DF] ${!u.activo ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div
                    className="flex cursor-pointer items-center justify-between"
                    onClick={() => setExpandido(expandidoCurrent ? null : u.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F6F3] text-sm font-semibold text-[#1A1A1A]">
                        {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">
                          {u.nombre} {u.apellido}
                          {!u.activo && (
                            <span className="ml-2 text-xs text-[#C1121F]">Suspendido</span>
                          )}
                        </p>
                        <p className="text-xs text-[#6B6560]">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.verificado && (
                        <Shield className="h-4 w-4 text-[#1B4332]" />
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROL_COLORS[u.rol]}`}>
                        {ROL_LABELS[u.rol]}
                      </span>
                      {expandidoCurrent ? (
                        <ChevronUp className="h-4 w-4 text-[#9E9892]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#9E9892]" />
                      )}
                    </div>
                  </div>

                  {expandidoCurrent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-4 border-t border-[#E8E4DF] pt-4"
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-[#9E9892]">Cédula:</span>{' '}
                          <span className="text-[#1A1A1A]">{u.cedula || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[#9E9892]">Teléfono:</span>{' '}
                          <span className="text-[#1A1A1A]">{u.telefono || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[#9E9892]">Verificado:</span>{' '}
                          <span className={u.verificado ? 'text-[#1B4332]' : 'text-[#C1121F]'}>
                            {u.verificado ? 'Sí' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9E9892]">Registro:</span>{' '}
                          <span className="text-[#1A1A1A]">
                            {new Date(u.fecha_registro).toLocaleDateString('es-VE')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-end gap-3 border-t border-[#E8E4DF] pt-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-[#9E9892]">Cambiar rol:</p>
                          <Select
                            defaultValue={u.rol}
                            onValueChange={(value) => handleActualizarRol(u.id, value!)}
                            disabled={actualizando === u.id}
                          >
                            <SelectTrigger className="h-9 w-32 border-[#E8E4DF] text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROL_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className={u.activo
                            ? 'border-[#C1121F] text-[#C1121F] hover:bg-[#FEE2E2]'
                            : 'border-[#1B4332] text-[#1B4332] hover:bg-[#D8F3DC]'
                          }
                          disabled={actualizando === u.id}
                          onClick={() => handleToggleActivo(u.id, u.activo)}
                        >
                          {actualizando === u.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : u.activo ? (
                            <EyeOff className="mr-1 h-3 w-3" />
                          ) : (
                            <Eye className="mr-1 h-3 w-3" />
                          )}
                          {u.activo ? 'Suspender' : 'Reactivar'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <RegistrarUsuarioModal
        abierto={modalRegistroAbierto}
        onCerrar={() => setModalRegistroAbierto(false)}
        onRegistrado={cargarUsuarios}
      />
    </div>
  )
}
