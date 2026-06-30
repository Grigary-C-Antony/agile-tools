import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/session'

export async function POST(request: Request) {
  const { inviteCode, name } = await request.json()
  if (!inviteCode?.trim() || !name?.trim())
    return NextResponse.json({ error: 'Invite code and your name are required' }, { status: 400 })

  const org = await db.getOrgByInviteCode(inviteCode.trim())
  if (!org) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  const member = await db.createMember(org.id, name.trim(), 'member')

  const res = NextResponse.json({ org, member, status: member.status })
  setSessionCookie(res, { orgId: org.id, memberId: member.id })
  return res
}
