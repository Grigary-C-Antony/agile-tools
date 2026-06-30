import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/session'

export async function POST(request: Request) {
  const { name, adminName } = await request.json()
  if (!name?.trim() || !adminName?.trim())
    return NextResponse.json({ error: 'Organization name and your name are required' }, { status: 400 })

  const org = await db.createOrg(name.trim())
  const admin = await db.createMember(org.id, adminName.trim(), 'admin')

  const res = NextResponse.json({ org, member: admin, inviteCode: org.invite_code })
  setSessionCookie(res, { orgId: org.id, memberId: admin.id })
  return res
}
