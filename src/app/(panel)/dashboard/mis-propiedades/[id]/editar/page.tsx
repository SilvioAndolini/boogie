import { notFound } from 'next/navigation'
import { getBoogieParaEditar } from '@/actions/propiedad.actions'
import EditarBoogieClient from './editar-boogie-client'

export default async function EditarBoogiePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const boogie = await getBoogieParaEditar(id)

  if (!boogie) notFound()

  return <EditarBoogieClient boogie={boogie} />
}
