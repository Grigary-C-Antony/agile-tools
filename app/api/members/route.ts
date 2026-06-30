import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const active = await db.getOrgMembers(session.orgId)
  const pending = member.role === 'admin' ? await db.getPendingMembers(session.orgId) : []

  return NextResponse.json({ active, pending })
}
