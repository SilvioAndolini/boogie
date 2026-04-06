// Formulario de pago dinámico según el método seleccionado
'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { MetodoPagoEnum } from '@/types'

interface PaymentFormProps {
  metodo: MetodoPagoEnum
  monto: number
  moneda: 'USD' | 'VES'
  onSubmit: (data: FormData) => void
}

// Datos bancarios de ejemplo de la plataforma para recibir pagos
const DATOS_BANCARIOS = {
  TRANSFERENCIA_BANCARIA: {
    banco: 'Banco de Venezuela',
    cuenta: '0102-XXXX-XXXX-XXXX',
    titular: 'Boogie C.A.',
    cedula: 'J-XXXXXXXX',
  },
  PAGO_MOVIL: {
    banco: 'Banco de Venezuela',
    telefono: '0414-XXX-XXXX',
    cedula: 'J-XXXXXXXX',
  },
  ZELLE: {
    email: 'pagos@boogie.app',
    nombre: 'Boogie CA',
  },
  USDT: {
    red: 'TRC-20 (Tron)',
    direccion: 'TJxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
}

export function PaymentForm({ metodo, monto, moneda, onSubmit }: PaymentFormProps) {
  const [referencia, setReferencia] = useState('')
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  const datosReceptor = DATOS_BANCARIOS[metodo as keyof typeof DATOS_BANCARIOS]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    // Aquí se procesaría el comprobante de pago
    const formData = new FormData()
    formData.append('referencia', referencia)
    if (comprobante) formData.append('comprobante', comprobante)
    onSubmit(formData)
    setEnviando(false)
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones de pago */}
      {datosReceptor && (
        <div className="rounded-lg bg-[#D8F3DC] p-4">
          <h4 className="mb-2 text-sm font-semibold text-[#1B4332]">Datos para realizar el pago:</h4>
          <div className="space-y-1">
            {Object.entries(datosReceptor).map(([campo, valor]) => (
              <div key={campo} className="flex justify-between text-sm">
                <span className="text-[#2D6A4F] capitalize">{campo}:</span>
                <span className="font-medium text-[#1B4332]">{valor}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-[#2D6A4F]">Monto a pagar:</span>
              <span className="text-[#1B4332]">{moneda === 'USD' ? `$${monto.toFixed(2)}` : `Bs. ${monto.toFixed(2)}`}</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de comprobante */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="referencia">Número de referencia</Label>
          <Input
            id="referencia"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej: 1234567890"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label>Comprobante de pago (opcional)</Label>
          <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-[#E8E4DF] p-6 transition-colors hover:border-[#52B788]">
            <label className="flex cursor-pointer flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-[#9E9892]" />
              <span className="text-sm text-[#6B6560]">
                {comprobante ? comprobante.name : 'Haz clic para subir comprobante'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setComprobante(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
          disabled={enviando || !referencia}
        >
          {enviando ? 'Enviando...' : 'Confirmar pago'}
        </Button>

        <p className="text-center text-xs text-[#9E9892]">
          Tu pago será verificado manualmente. Recibirás una confirmación por correo.
        </p>
      </form>
    </div>
  )
}
