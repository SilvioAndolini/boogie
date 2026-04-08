import { createAdminClient } from './src/lib/supabase/admin'

async function main() {
  const admin = createAdminClient()

  console.log('--- Querying usuarios table ---')
  const { data, error } = await admin
    .from('usuarios')
    .select('id, email, nombre, apellido, rol, activo, fecha_registro')
    .order('fecha_registro', { ascending: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Total usuarios in DB: ${data?.length ?? 0}`)
  for (const u of (data || [])) {
    console.log(`- ${u.email} | ${u.nombre} ${u.apellido} | rol: ${u.rol} | activo: ${u.activo}`)
  }

  process.exit(0)
}

main().catch(console.error)
