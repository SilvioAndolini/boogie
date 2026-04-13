import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
}
