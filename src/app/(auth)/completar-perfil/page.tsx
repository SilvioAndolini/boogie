'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { completarPerfilGoogle } from '@/actions/auth-perfil.actions'

const CODIGOS_PAIS = [
  { codigo: '+58', label: 'VE +58' },
  { codigo: '+1', label: 'US/CAN +1' },
  { codigo: '+34', label: 'ES +34' },
  { codigo: '+57', label: 'CO +57' },
  { codigo: '+51', label: 'PE +51' },
  { codigo: '+56', label: 'CL +56' },
  { codigo: '+54', label: 'AR +54' },
  { codigo: '+52', label: 'MX +52' },
  { codigo: '+53', label: 'CU +53' },
  { codigo: '+44', label: 'UK +44' },
  { codigo: '+49', label: 'DE +49' },
  { codigo: '+55', label: 'BR +55' },
]

interface FormDatos {
  nombre: string
  apellido: string
  tipoDocumento: string
  numeroDocumento: string
  codigoPais: string
  telefono: string
}

export default function CompletarPerfilPage() {
  const [cargando, setCargando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [tipoDocumento, setTipoDocumento] = useState<'CEDULA' | 'PASAPORTE'>('CEDULA')
  const [codigoPais, setCodigoPais] = useState('+58')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormDatos>({
    defaultValues: {
      nombre: '',
      apellido: '',
      tipoDocumento: 'CEDULA',
      numeroDocumento: '',
      codigoPais: '+58',
      telefono: '',
    },
  })

  const onSubmit = async (datos: FormDatos) => {
    setCargando(true)
    setErrorForm(null)
    try {
      const formData = new FormData()
      formData.append('nombre', datos.nombre)
      formData.append('apellido', datos.apellido)
      formData.append('tipoDocumento', tipoDocumento)
      formData.append('numeroDocumento', datos.numeroDocumento)
      formData.append('codigoPais', codigoPais)
      formData.append('telefono', datos.telefono)

      const res = await completarPerfilGoogle(formData)
      if (res?.error) {
        setErrorForm(res.error)
        setCargando(false)
      }
    } catch {
      setErrorForm('Error inesperado. Intenta de nuevo.')
      setCargando(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[420px]"
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#E8E4DF] bg-white shadow-sm">
        <div className="relative p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#40916C]">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Completa tu perfil</h1>
            <p className="mt-1 text-sm text-[#9E9892]">Necesitamos estos datos para finalizar tu registro</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorForm && (
              <div className="rounded-xl border border-[#C1121F]/20 bg-[#FEF2F2] px-4 py-3 text-xs text-[#C1121F]">
                {errorForm}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Nombre</label>
                <input
                  type="text"
                  placeholder="María"
                  autoComplete="given-name"
                  className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  {...register('nombre', { required: 'Campo requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                />
                {errors.nombre && <p className="text-[11px] text-[#C1121F]">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Apellido</label>
                <input
                  type="text"
                  placeholder="García"
                  autoComplete="family-name"
                  className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  {...register('apellido', { required: 'Campo requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                />
                {errors.apellido && <p className="text-[11px] text-[#C1121F]">{errors.apellido.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                Documento de identidad <span className="text-[#C1121F]">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  className="h-11 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  value={tipoDocumento}
                  onChange={(e) => {
                    setTipoDocumento(e.target.value as 'CEDULA' | 'PASAPORTE')
                    setValue('tipoDocumento', e.target.value)
                  }}
                >
                  <option value="CEDULA">Cédula</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
                <input
                  type="text"
                  placeholder={tipoDocumento === 'CEDULA' ? 'V-12345678' : 'AB1234567'}
                  className="h-11 flex-1 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  {...register('numeroDocumento', { required: 'Campo requerido', minLength: { value: 4, message: 'Mínimo 4 caracteres' } })}
                />
              </div>
              {errors.numeroDocumento && <p className="text-[11px] text-[#C1121F]">{errors.numeroDocumento.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                Teléfono <span className="text-[#C1121F]">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  className="h-11 w-24 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-2 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  value={codigoPais}
                  onChange={(e) => {
                    setCodigoPais(e.target.value)
                    setValue('codigoPais', e.target.value)
                  }}
                >
                  {CODIGOS_PAIS.map((c) => (
                    <option key={c.codigo} value={c.codigo}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="412 1234567"
                  autoComplete="tel"
                  className="h-11 flex-1 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  {...register('telefono', { required: 'Campo requerido', minLength: { value: 7, message: 'Mínimo 7 dígitos' } })}
                />
              </div>
              {errors.telefono && <p className="text-[11px] text-[#C1121F]">{errors.telefono.message}</p>}
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-sm font-semibold text-white transition-all hover:from-[#2D6A4F] hover:to-[#40916C] disabled:opacity-60"
            >
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              {cargando ? 'Guardando...' : 'Finalizar registro'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
