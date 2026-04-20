import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const GO_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/zonas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/registro`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    const res = await fetch(
      `${GO_URL}/api/v1/propiedades/publicas?porPagina=1000`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return staticPages

    const body = await res.json()
    const items = body.data ?? body

    const propPages: MetadataRoute.Sitemap = (items as { id: string; slug?: string; fecha_actualizacion?: string }[]).map((p) => ({
      url: `${BASE_URL}/propiedades/${p.id}`,
      lastModified: p.fecha_actualizacion ? new Date(p.fecha_actualizacion) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...propPages]
  } catch {
    return staticPages
  }
}
