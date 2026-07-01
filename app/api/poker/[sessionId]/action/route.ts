import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { pusher } from '@/lib/pusher'
import { calcModeVote, calcAverageVote } from '@/lib/utils'

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await params
  const pokerSession = await db.getPokerSession(sessionId)
  if (!pokerSession || pokerSession.org_id !== session.orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { action } = body
  const channel = `presence-poker-${sessionId}`

  switch (action) {
    case 'vote': {
      const { storyId, vote } = body
      await db.saveVote(sessionId, storyId, session.memberId, vote)
      await pusher.trigger(channel, 'poker:voted', { memberId: session.memberId })
      return NextResponse.json({ ok: true })
    }

    case 'reveal': {
      const { storyId } = body
      await db.updatePokerSessionStatus(sessionId, 'revealed')
      const votes = await db.getVotes(sessionId, storyId)
      await pusher.trigger(channel, 'poker:revealed', { votes })
      return NextResponse.json({ ok: true })
    }

    case 'reset': {
      const { storyId } = body
      await db.clearVotes(sessionId, storyId)
      await db.updatePokerSessionStatus(sessionId, 'voting')
      await pusher.trigger(channel, 'poker:reset-round', {})
      return NextResponse.json({ ok: true })
    }

    case 'accept-story': {
      const { storyId, estimate } = body
      // Compute stats from current votes before saving
      const currentVotes = await db.getVotes(sessionId, storyId)
      const votesRecord: Record<string, string | number> = {}
      currentVotes.forEach(v => { votesRecord[v.member_id] = v.vote })
      const numericVals = currentVotes.map(v => parseFloat(v.vote)).filter(n => !isNaN(n))
      const maxVal = numericVals.length ? Math.max(...numericVals) : null
      const minVal = numericVals.length > 1 ? Math.min(...numericVals) : null
      const modeVote = calcModeVote(votesRecord)
      const avgVote = calcAverageVote(votesRecord)

      await db.setStoryEstimate(storyId, estimate)
      await db.setStoryStats(storyId, {
        consensus: modeVote !== null ? String(modeVote) : estimate,
        average: avgVote !== null ? String(avgVote) : null,
        highVote: maxVal !== null ? String(maxVal) : null,
        lowVote: minVal !== null ? String(minVal) : null,
        voteCount: currentVotes.length,
      })
      // Votes are kept in DB as history (only reset-round clears them)

      const stories = await db.getStories(sessionId)
      const currentIdx = stories.findIndex(s => s.id === storyId)
      const nextStory = currentIdx >= 0 && currentIdx < stories.length - 1 ? stories[currentIdx + 1] : null
      if (nextStory) {
        await db.setCurrentStory(sessionId, nextStory.id)
      } else {
        await db.updatePokerSessionStatus(sessionId, 'completed')
      }
      await pusher.trigger(channel, 'poker:story-accepted', { storyId, estimate, nextStory })
      return NextResponse.json({ ok: true })
    }

    case 'add-story': {
      const { title } = body
      const story = await db.addStory(sessionId, title)
      await pusher.trigger(channel, 'poker:story-added', { story })
      return NextResponse.json({ story })
    }

    case 'end': {
      await db.updatePokerSessionStatus(sessionId, 'completed')
      await pusher.trigger(channel, 'poker:session-ended', {})
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
