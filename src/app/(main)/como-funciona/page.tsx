// Página "Cómo funciona" - guía para huéspedes y anfitriones
import {
  Search,
  CalendarCheck,
  PartyPopper,
  Home,
  MessageSquare,
  Wallet,
  HelpCircle,
  ChevronDown,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cómo funciona',
  description: 'Descubre cómo reservar y publicar alojamientos en Boogie. Guía paso a paso para huéspedes y anfitriones en Venezuela.',
}

// Pasos para huéspedes
const PASOS_HUESPED = [
  {
    icono: Search,
    titulo: 'Busca tu alojamiento ideal',
    descripcion:
      'Explora cientos de propiedades en toda Venezuela. Filtra por ubicación, precio, tipo de propiedad y amenidades para encontrar el lugar perfecto para tu viaje.',
  },
  {
    icono: CalendarCheck,
    titulo: 'Reserva de forma segura',
    descripcion:
      'Selecciona tus fechas y realiza tu reserva con total confianza. Ofrecemos múltiples métodos de pago locales: transferencia bancaria, pago móvil, Zelle, USDT y más.',
  },
  {
    icono: PartyPopper,
    titulo: 'Disfruta tu estadía',
    descripcion:
      'Llega a tu alojamiento y disfruta de una experiencia increíble. Califica al anfitrión y comparte tu reseña para ayudar a otros viajeros.',
  },
]

// Pasos para anfitriones
const PASOS_ANFITRION = [
  {
    icono: Home,
    titulo: 'Publica tu espacio',
    descripcion:
      'Registra tu propiedad en minutos. Añade fotos, descripción, precios y reglas. Nuestro equipo revisará tu publicación para garantizar la calidad.',
  },
  {
    icono: MessageSquare,
    titulo: 'Recibe reservas',
    descripcion:
      'Gestiona las solicitudes de reserva desde tu panel. Comunícate directamente con los huéspedes y coordina los detalles de su llegada.',
  },
  {
    icono: Wallet,
    titulo: 'Gana dinero',
    descripcion:
      'Recibe pagos de forma segura y retira tus ganancias cuando quieras. Tú decides el precio y la disponibilidad de tu espacio.',
  },
]

// Preguntas frecuentes
const PREGUNTAS_FRECUENTES = [
  {
    pregunta: '¿Qué métodos de pago aceptan?',
    respuesta:
      'Aceptamos múltiples métodos de pago locales e internacionales: transferencia bancaria (BSV, Mercantil, Provincial), pago móvil, Zelle, USDT, efectivo en Farmatodo y tarjetas internacionales. Esto facilita el pago tanto para venezolanos como para visitantes extranjeros.',
  },
  {
    pregunta: '¿Cómo se protegen mis datos y pagos?',
    respuesta:
      'Boogie utiliza encriptación de punta a punta para proteger tus datos personales y financieros. Los pagos se retienen de forma segura hasta que confirmes que tu estadía comenzó correctamente.',
  },
  {
    pregunta: '¿Puedo cancelar una reserva?',
    respuesta:
      'Sí, cada propiedad tiene su propia política de cancelación (flexible, moderada o estricta). Puedes cancelar desde tu panel y recibirás el reembolso según la política del alojamiento.',
  },
  {
    pregunta: '¿Cuánto cuesta publicar mi propiedad?',
    respuesta:
      'Publicar tu propiedad en Boogie es completamente gratuito. Solo cobramos una pequeña comisión por cada reserva completada, para mantener la plataforma y ofrecer soporte.',
  },
  {
    pregunta: '¿Qué pasa si tengo un problema durante mi estadía?',
    respuesta:
      'Nuestro equipo de soporte está disponible para ayudarte. Puedes contactarnos directamente desde la plataforma y resolveremos cualquier inconveniente lo más rápido posible.',
  },
  {
    pregunta: '¿Necesito ser venezolano para usar Boogie?',
    respuesta:
      'No, Boogie está abierto para cualquier persona que desee hospedarse o publicar un alojamiento en Venezuela. Aceptamos pagos internacionales y nuestra plataforma está disponible en español.',
  },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Encabezado */}
      <section className="border-b border-[#E8E4DF] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
            Cómo funciona Boogie
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#6B6560]">
            Reservar o publicar un alojamiento en Venezuela nunca fue tan fácil.
            Descubre cómo empezar en simples pasos.
          </p>
        </div>
      </section>

      {/* Sección para huéspedes */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <BadgeSeccion texto="Para huéspedes" />
          <h2 className="mt-3 text-2xl font-bold text-[#1A1A1A]">
            Planifica tu viaje en 3 pasos
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PASOS_HUESPED.map((paso, indice) => (
            <TarjetaPaso
              key={paso.titulo}
              icono={paso.icono}
              numero={indice + 1}
              titulo={paso.titulo}
              descripcion={paso.descripcion}
            />
          ))}
        </div>
      </section>

      {/* Separador decorativo */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-[#E8E4DF]" />
      </div>

      {/* Sección para anfitriones */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <BadgeSeccion texto="Para anfitriones" />
          <h2 className="mt-3 text-2xl font-bold text-[#1A1A1A]">
            Empieza a ganar dinero con tu espacio
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PASOS_ANFITRION.map((paso, indice) => (
            <TarjetaPaso
              key={paso.titulo}
              icono={paso.icono}
              numero={indice + 1}
              titulo={paso.titulo}
              descripcion={paso.descripcion}
            />
          ))}
        </div>
      </section>

      {/* Separador decorativo */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-[#E8E4DF]" />
      </div>

      {/* Preguntas frecuentes */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <BadgeSeccion texto="FAQ" />
          <h2 className="mt-3 text-2xl font-bold text-[#1A1A1A]">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="space-y-3">
          {PREGUNTAS_FRECUENTES.map((faq) => (
            <PreguntaFrecuente
              key={faq.pregunta}
              pregunta={faq.pregunta}
              respuesta={faq.respuesta}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

// Componente: badge de sección
function BadgeSeccion({ texto }: { texto: string }) {
  return (
    <span className="inline-block rounded-full bg-[#D8F3DC] px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
      {texto}
    </span>
  )
}

// Componente: tarjeta de paso
function TarjetaPaso({
  icono: Icono,
  numero,
  titulo,
  descripcion,
}: {
  icono: React.ComponentType<{ className?: string }>
  numero: number
  titulo: string
  descripcion: string
}) {
  return (
    <div className="relative rounded-xl border border-[#E8E4DF] bg-white p-6 transition-shadow hover:shadow-md">
      {/* Número de paso */}
      <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E76F51] text-sm font-bold text-white">
        {numero}
      </div>

      {/* Icono */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8F3DC]">
        <Icono className="h-6 w-6 text-[#1B4332]" />
      </div>

      {/* Texto */}
      <h3 className="mb-2 text-base font-semibold text-[#1A1A1A]">{titulo}</h3>
      <p className="text-sm leading-relaxed text-[#6B6560]">{descripcion}</p>
    </div>
  )
}

// Componente: pregunta frecuente (colapsable visual)
function PreguntaFrecuente({
  pregunta,
  respuesta,
}: {
  pregunta: string
  respuesta: string
}) {
  return (
    <details className="group rounded-xl border border-[#E8E4DF] bg-white">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-[#1A1A1A] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <HelpCircle className="h-4 w-4 shrink-0 text-[#1B4332]" />
          {pregunta}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#6B6560] transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#E8E4DF] px-5 pb-4 pt-3">
        <p className="text-sm leading-relaxed text-[#6B6560]">{respuesta}</p>
      </div>
    </details>
  )
}
