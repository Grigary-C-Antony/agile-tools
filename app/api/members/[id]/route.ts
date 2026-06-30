import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const current = await db.getMember(session.memberId)
  if (!current || current.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  if (body.action === 'approve') await db.approveMember(id)
  else if (body.action === 'reject') await db.rejectMember(id)
  else if (body.action === 'update-role' && body.role) await db.updateMemberRole(id, body.role)

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const current = await db.getMember(session.memberId)
  if (!current || current.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await db.deleteMember(id)
  return NextResponse.json({ ok: true })
}
