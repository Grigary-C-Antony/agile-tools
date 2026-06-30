import { NextResponse } from 'next/server'
import { getSession, clearSessionCookie } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ session: null })

  const member = await db.getMember(session.memberId)
  if (!member) {
    const res = NextResponse.json({ session: null })
    clearSessionCookie(res)
    return res
  }

  const org = await db.getOrg(session.orgId)

  return NextResponse.json({
    session: {
      orgId: session.orgId,
      memberId: session.memberId,
      memberName: member.name,
      role: member.role,
      status: member.status,
      orgName: org?.name ?? '',
      inviteCode: org?.invite_code ?? '',
    },
  })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  clearSessionCookie(res)
  return res
}
