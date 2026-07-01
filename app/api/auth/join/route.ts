import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/session'

export async function POST(request: Request) {
  const { inviteCode, name, email, password } = await request.json()
  if (!inviteCode?.trim() || !name?.trim() || !email?.trim() || !password)
    return NextResponse.json({ error: 'Invite code, your name, email, and password are required' }, { status: 400 })
  if (password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const org = await db.getOrgByInviteCode(inviteCode.trim())
  if (!org) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  if (await db.emailExists(email))
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  const member = await db.createMember(org.id, name.trim(), email, passwordHash, 'member')

  const res = NextResponse.json({ org, member, status: member.status })
  setSessionCookie(res, { orgId: org.id, memberId: member.id })
  return res
}
