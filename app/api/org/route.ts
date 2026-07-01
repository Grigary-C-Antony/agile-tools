import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const { name, adminName, email, password } = await request.json()
    if (!name?.trim() || !adminName?.trim() || !email?.trim() || !password)
      return NextResponse.json({ error: 'Organization name, your name, email, and password are required' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    if (await db.emailExists(email))
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 10)
    const org = await db.createOrg(name.trim())
    const admin = await db.createMember(org.id, adminName.trim(), email, passwordHash, 'admin')

    const res = NextResponse.json({ org, member: admin, inviteCode: org.invite_code })
    setSessionCookie(res, { orgId: org.id, memberId: admin.id })
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[api/org POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
