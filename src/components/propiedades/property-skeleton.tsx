// Esqueleto de carga para tarjetas de propiedad
'use client'

export function PropertySkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E4DF] bg-white">
      {/* Imagen esqueleto */}
      <div className="skeleton aspect-[4/3] rounded-t-xl" />

      {/* Contenido esqueleto */}
      <div className="space-y-2.5 p-3">
        {/* Calificación */}
        <div className="flex items-center gap-1.5">
          <div className="skeleton h-3.5 w-3.5 rounded-full" />
          <div className="skeleton h-3.5 w-12 rounded" />
        </div>

        {/* Título */}
        <div className="skeleton h-4 w-3/4 rounded" />

        {/* Ubicación */}
        <div className="flex items-center gap-1">
          <div className="skeleton h-3 w-3 rounded-full" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>

        {/* Precio */}
        <div className="pt-1">
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      </div>
    </div>
  )
}

// Cuadrícula de esqueletos para la página de carga completa
export function PropertySkeletonGrid({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: cantidad }).map((_, i) => (
        <PropertySkeleton key={i} />
      ))}
    </div>
  )
}
