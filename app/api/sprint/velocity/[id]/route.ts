import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await db.updateVelocityRecord(id, await request.json())
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await db.deleteVelocityRecord(id)
  return NextResponse.json({ ok: true })
}
