import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ holidays: await db.getSprintHolidays(session.orgId) })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, date } = await request.json()
  if (!name || !date) return NextResponse.json({ error: 'name and date required' }, { status: 400 })
  const holiday = await db.createSprintHoliday(session.orgId, name, date)
  return NextResponse.json({ holiday })
}
