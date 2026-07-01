import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/session'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email?.trim() || !password)
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })

  const member = await db.getMemberByEmail(email)
  if (!member)
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

  const valid = await bcrypt.compare(password, member.passwordHash)
  if (!valid)
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

  if (member.status === 'rejected')
    return NextResponse.json({ error: 'Your account has been rejected' }, { status: 403 })

  const res = NextResponse.json({ memberId: member.id, orgId: member.org_id, status: member.status })
  setSessionCookie(res, { orgId: member.org_id, memberId: member.id })
  return res
}
