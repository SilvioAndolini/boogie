import { getBoogieDashboard } from '@/actions/boogie-dashboard.actions'
import { redirect } from 'next/navigation'
import BoogieDashboardClient from './boogie-dashboard-client'

export default async function BoogieDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getBoogieDashboard(id)

  if ('error' in data && data.error) {
    redirect('/dashboard/mis-propiedades')
  }

  return <BoogieDashboardClient data={data as Exclude<typeof data, { error: string }>} />
}
