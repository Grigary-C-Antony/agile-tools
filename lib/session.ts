import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export interface SessionData { orgId: string; memberId: string }

export async function getSession(): Promise<SessionData | null> {
  try {
    const store = await cookies()
    const raw = store.get('agile_session')?.value
    if (!raw) return null
    return JSON.parse(Buffer.from(raw, 'base64url').toString()) as SessionData
  } catch { return null }
}

export function setSessionCookie(res: NextResponse, data: SessionData): void {
  res.cookies.set('agile_session', Buffer.from(JSON.stringify(data)).toString('base64url'), {
    httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.delete('agile_session')
}

export function readSessionFromCookie(raw: string): SessionData | null {
  try { return JSON.parse(Buffer.from(raw, 'base64url').toString()) as SessionData }
  catch { return null }
}
