import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { pusher } from '@/lib/pusher'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await db.getMember(session.memberId)
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const text = await request.text()
  const params = new URLSearchParams(text)
  const socketId = params.get('socket_id')
  const channel = params.get('channel_name')

  if (!socketId || !channel) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 })
  }

  const auth = pusher.authorizeChannel(socketId, channel, {
    user_id: session.memberId,
    user_info: { name: member.name },
  })

  return NextResponse.json(auth)
}
