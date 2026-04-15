import { redirect } from 'next/navigation'

export default async function BoogieDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/mis-propiedades/${id}/editar`)
}
